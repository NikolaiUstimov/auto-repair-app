import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  input,
  OnDestroy,
  OnInit,
  output,
} from '@angular/core';

@Component({
  selector: 'app-lightbox',
  imports: [],
  templateUrl: './lightbox.component.html',
  styleUrl: './lightbox.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LightboxComponent implements OnInit, OnDestroy {
  imageUrl = input.required<string>();
  altText = input<string>('Изображение');

  closed = output<void>();

  //Закрываем только если клик пришёлся именно по фону (backdrop), а не всплыл
  //от дочернего элемента (картинки/кнопки). event.target — реальный элемент,
  //по которому кликнули; event.currentTarget — элемент, на котором висит
  //обработчик (сам .lightbox). Совпадают только когда кликнули "мимо" фото —
  //так картинке не нужны никакие обработчики вообще, а значит и не нужен
  //фейковый tabindex/role для интерактивности, которой у неё на самом деле нет.
  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.closed.emit();
    }
  }
  //Закрытие по Escape
  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closed.emit();
  }

  //Пока лайтбокс открыт, блокируем прокрутку страницы под ним
  ngOnInit(): void {
    document.body.style.overflowY = 'hidden';
  }

  ngOnDestroy(): void {
    document.body.style.overflow = '';
  }
}
