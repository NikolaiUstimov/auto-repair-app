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

@Component({
  selector: 'app-repair-detail',
  imports: [ButtonComponent, ReactiveFormsModule, Field],
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
  });

  photoUrl = signal<string | null>(null);
  isPhotoLoading = signal<boolean>(true);
  isSaving = signal<boolean>(false);
  photoError = signal<string | null>(null);
  //Метаданные текущего сохранённого фото
  photoMeta = signal<RepairPhoto | null>(null);
  //Хранит новое фото до нажатия "Сохранить" — не пишем в IndexedDB на каждый
  //выбор файла, только когда пользователь подтвердил сохранение всей формы.
  private pendingPhotoBlob = signal<Blob | null>(null);

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
        });
      }
    });
  }

  ngOnInit() {
    this.loadPhoto().then();
  }

  //Загрузка фотографии
  private async loadPhoto(): Promise<void> {
    try {
      const photo = await this.indexedDBService.getPhoto(this.id());
      if (photo) {
        this.setPhotoUrl(photo.photo);
        this.photoMeta.set(photo);
      }
    } catch (error) {
      console.error('Не удалось загрузить фото', error);
      this.photoError.set('Не удалось загрузить фото. Попробуйте обновить страницу');
    } finally {
      this.isPhotoLoading.set(false);
    }
  }

  //object URL — это ссылка в памяти вкладки на Blob, её обязательно нужно
  //освобождать через revokeObjectURL, когда она больше не нужна, иначе это
  //утечка памяти (браузер держит Blob в памяти, пока ссылка не отозвана)
  private setPhotoUrl(blob: Blob): void {
    const previousUrl = this.photoUrl();
    if (previousUrl) {
      URL.revokeObjectURL(previousUrl);
    }

    this.photoUrl.set(URL.createObjectURL(blob));
  }

  //Метод добавления фото
  async onPhotoSelected(event: Event): Promise<void> {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) {
      return;
    }

    this.photoError.set(null);

    try {
      const compressed = await ImageUtils.compressImage(file);
      this.pendingPhotoBlob.set(compressed);
      //Показываем превью перед сохранением в БД
      this.setPhotoUrl(compressed);
    } catch (error) {
      //Показываем текст ошибки если она возникает
      const message = error instanceof Error ? error.message : 'Не удалось обработать фото';
      this.photoError.set(message);
    } finally {
      //Сбрасываем значение инпута, чтобы можно было повторно сделать загрузку
      target.value = '';
    }
  }

  //Сохранение изменённой записи
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

      const pendingPhoto = this.pendingPhotoBlob();
      if (pendingPhoto) {
        //mimeType и size уже есть в самом Blob — читаем напрямую, без доп. вычислений.
        //width/height требуют декодирования — единственное место, где это реально нужно.
        const { width, height } = await ImageUtils.getImageDimensions(pendingPhoto);

        const photo: RepairPhoto = {
          id: this.id(),
          photo: pendingPhoto,
          mimeType: pendingPhoto.type,
          size: pendingPhoto.size,
          width,
          height,
          createdAt: Date.now(),
        };

        await this.indexedDBService.savePhoto(photo);
        this.pendingPhotoBlob.set(null);
      }

      await this.router.navigate(['/repair-list']);
    } finally {
      this.isSaving.set(false);
    }
  }

  cancel(): void {
    this.router.navigate(['/repair-list']).then();
  }

  ngOnDestroy(): void {
    const url = this.photoUrl();
    if (url) {
      URL.revokeObjectURL(url);
    }
  }
}
