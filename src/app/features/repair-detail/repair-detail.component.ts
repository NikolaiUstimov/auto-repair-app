import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { IndexedDBService } from '../../core/services/indexed-db.service';
import { StatisticRepairService } from '../../core/services/statistic-repair.service';
import { ImageUtils } from '../../core/utils/image-utils';
import { RepairPhoto, RepairType } from '../../types/repair-type';
import { ButtonComponent } from '../../shared/button/button.component';
import { Field } from '../../shared/field/field';
import { LightboxComponent } from '../../shared/lightbox/lightbox.component';
import { ConfirmService } from '../../core/services/confirm.service';

//Фото записи + object URL для превью.
//Всё, что есть в этом списке, уже сохранено в IndexedDB — промежуточного
//"ещё не сохранённого" состояния у фото больше нет.
interface PhotoItem {
  photo: RepairPhoto;
  url: string;
}

@Component({
  selector: 'app-repair-detail',
  imports: [ButtonComponent, ReactiveFormsModule, Field, LightboxComponent],
  templateUrl: './repair-detail.component.html',
  styleUrl: './repair-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RepairDetailComponent implements OnInit, OnDestroy {
  //Автоматически заполняется из параметра маршрута /:id благодаря
  //withComponentInputBinding() в app.config.ts — ручная подписка на
  //ActivatedRoute.paramMap не нужна.
  id = input.required<string>();

  private router = inject(Router);
  private fb = inject(FormBuilder);
  private indexedDBService = inject(IndexedDBService);
  private confirmService = inject(ConfirmService);
  statisticRepair = inject(StatisticRepairService);

  //Запись берётся из уже загруженного в память списка (единый источник данных
  //для всего приложения), а не отдельным походом в БД.
  repair = computed(() => this.statisticRepair.dataRepair().find((item) => item.id === this.id()));

  //Форма для редактирования записи
  //Марка и модель объединяются в одну запись для правки как готовой строки
  editForm = this.fb.nonNullable.group({
    nameRepair: this.fb.nonNullable.control('', [Validators.required]),
    auto: this.fb.nonNullable.control('', [Validators.required]),
    licenseNumber: this.fb.nonNullable.control('', [Validators.required]),
    price: this.fb.nonNullable.control(0, [Validators.required]),
    comment: this.fb.nonNullable.control(''),
  });

  photos = signal<PhotoItem[]>([]);
  isPhotoLoading = signal<boolean>(true);
  //Идёт сжатие/запись фото в БД — на это время блокируем кнопку добавления,
  //чтобы пользователь не запустил вторую загрузку поверх текущей
  isPhotoUploading = signal<boolean>(false);
  isSaving = signal<boolean>(false);
  photoError = signal<string | null>(null);
  //Какое фото сейчас открыто в полноэкранном просмотре (null — лайтбокс закрыт)
  selectedPhotoUrl = signal<string | null>(null);

  constructor() {
    //Как только запись найдена, заполняем данными из базы текущую форму для редактирования
    effect(() => {
      const repair = this.repair();
      if (repair) {
        this.editForm.patchValue({
          nameRepair: repair.nameRepair,
          auto: repair.auto,
          licenseNumber: repair.licenseNumber,
          price: repair.price,
          //?? '' — у старых записей, созданных до появления комментариев,
          //поле comment отсутствует вовсе (не undefined в объекте, а его нет).
          comment: repair.comment ?? '',
        });
      }
    });
  }

  ngOnInit() {
    this.loadPhotos().then();
  }

  //Загрузка всех фото записи
  private async loadPhotos(): Promise<void> {
    try {
      const photos = await this.indexedDBService.getPhotosByRepairId(this.id());
      this.photos.set(photos.map((photo) => ({ photo, url: URL.createObjectURL(photo.photo) })));
    } catch (error) {
      console.error('Не удалось загрузить фото', error);
      this.photoError.set('Не удалось загрузить фото. Попробуйте обновить страницу');
    } finally {
      this.isPhotoLoading.set(false);
    }
  }

  //Добавление одного или нескольких фото — каждое сразу пишется в IndexedDB
  async onPhotosSelected(event: Event): Promise<void> {
    const target = event.target as HTMLInputElement;
    const files = target.files;
    if (!files || files.length === 0) {
      return;
    }

    this.photoError.set(null);
    this.isPhotoUploading.set(true);

    try {
      //Обрабатываем файлы по очереди — если один окажется битым, остальные
      //всё равно должны сохраниться, а не рухнуть вместе с ним
      for (const file of Array.from(files)) {
        try {
          const compressed = await ImageUtils.compressImage(file);
          const { width, height } = await ImageUtils.getImageDimensions(compressed);

          const photo: RepairPhoto = {
            id: crypto.randomUUID(),
            repairId: this.id(),
            photo: compressed,
            mimeType: compressed.type,
            size: compressed.size,
            width,
            height,
            createdAt: Date.now(),
          };

          await this.indexedDBService.savePhoto(photo);

          this.photos.update((list) => [...list, { photo, url: URL.createObjectURL(compressed) }]);
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Не удалось обработать фото';
          this.photoError.set(message);
        }
      }
    } finally {
      this.isPhotoUploading.set(false);
      //Сбрасываем значение инпута, чтобы можно было повторно сделать загрузку
      target.value = '';
    }
  }

  //Удаление фото — сразу из БД, без ожидания "Сохранить".
  //Отменить это нельзя, поэтому формулировка в диалоге соответствующая
  async onDeletePhoto(item: PhotoItem): Promise<void> {
    const isConfirmed = await this.confirmService.confirm({
      title: 'Удалить фото?',
      message: 'Это действие нельзя отменить',
      confirmText: 'Удалить',
      danger: true,
    });
    if (!isConfirmed) {
      return;
    }

    try {
      await this.indexedDBService.deletePhoto(item.photo.id);

      //Если удаляемое фото открыто в лайтбоксе — закрываем его,
      //иначе останется висеть картинка по уже отозванному URL
      if (this.selectedPhotoUrl() === item.url) {
        this.selectedPhotoUrl.set(null);
      }

      URL.revokeObjectURL(item.url);
      this.photos.update((list) => list.filter((p) => p.photo.id !== item.photo.id));
    } catch (error) {
      console.error('Не удалось удалить фото', error);
      this.photoError.set('Не удалось удалить фото. Попробуйте ещё раз');
    }
  }

  //Сохранение изменённой записи (текстовых полей)
  async save(): Promise<void> {
    const currentRepair = this.repair();
    if (!currentRepair || this.editForm.invalid) {
      return;
    }

    this.isSaving.set(true);
    try {
      const updatedRepair: RepairType = {
        ...currentRepair,
        ...this.editForm.getRawValue(),
      };

      await this.statisticRepair.updateRepair(updatedRepair);
      await this.router.navigate(['/repair-list']);
    } finally {
      this.isSaving.set(false);
    }
  }

  cancel(): void {
    this.router.navigate(['/repair-list']).then();
  }

  ngOnDestroy(): void {
    //Освобождаем все object URL — браузер держит Blob в памяти, пока ссылка не отозвана
    this.photos().forEach((item) => URL.revokeObjectURL(item.url));
  }
}
