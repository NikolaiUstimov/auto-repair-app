import { ChangeDetectionStrategy, Component, HostListener, inject } from '@angular/core';
import { ConfirmService } from '../../core/services/confirm.service';

@Component({
  selector: 'app-confirm-dialog',
  imports: [],
  templateUrl: './confirm-dialog.component.html',
  styleUrl: './confirm-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmDialogComponent {
  confirmService = inject(ConfirmService);

  //Клик мимо диалога (по фону) == отмена. Тот же приём, что и в Lightbox:
  //реагируем только если клик пришёлся именно по фону, а не всплыл от
  //дочернего элемента — тогда дополнительные обработчики на самой карточке
  //диалога не нужны, и линтер не просит делать её фокусируемой.
  onBackDropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.confirmService.respond(false);
    }
  }

  //Escape == отмена, как и в Lightbox — привычное поведение для любого
  //полноэкранного/модального UI
  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.confirmService.request()) {
      this.confirmService.respond(false);
    }
  }
}
