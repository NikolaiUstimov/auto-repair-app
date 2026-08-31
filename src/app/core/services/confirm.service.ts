import { Injectable, signal } from '@angular/core';

export interface ConfirmOptions {
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  //Красная кнопка для подтверждения разрушительный действий
  danger?: boolean;
}

interface ConfirmRequest extends ConfirmOptions {
  resolve: (result: boolean) => void;
}

@Injectable({
  providedIn: 'root',
})
export class ConfirmService {
  //null — диалог закрыт. Как только кто-то вызывает confirm(), сюда
  //попадает запрос, и ConfirmDialogComponent (смонтированный один раз
  //в app.html) сам решает, что показать — ему больше ничего не нужно знать.
  private readonly _request = signal<ConfirmRequest | null>(null);
  readonly request = this._request.asReadonly();

  //Замена confirm(): await this.confirmService.confirm({ title: '...' })
  //возвращает true/false ровно как обычный confirm(), просто асинхронно.
  confirm(options: ConfirmOptions): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      this._request.set({ ...options, resolve });
    });
  }

  //Вызывается из ConfirmDialogComponent по клику на любую из кнопок
  respond(result: boolean): void {
    const current = this._request();
    if (!current) {
      return;
    }

    current.resolve(result);
    this._request.set(null);
  }
}
