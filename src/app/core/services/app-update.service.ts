import { inject, Injectable, signal } from '@angular/core';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AppUpdateService {
  //Примет true, когда новая версия уже скачана и готова к применению
  readonly updateAvailable = signal(false);
  private readonly swUpdate: SwUpdate = inject(SwUpdate);

  constructor() {
    if (!this.swUpdate.isEnabled) {
      //Service worker не активен (например, локальная разработка через
      //ng serve — там enabled: !isDevMode() из app.config.ts даёт false) —
      //подписываться не на что, обновлений в дев-режиме не будет.
      return;
    }

    //VERSION_READY — новая версия полностью скачана и готова быть
    //активированной при следующей перезагрузке страницы.
    this.swUpdate.versionUpdates
      .pipe(filter((event): event is VersionReadyEvent => event.type === 'VERSION_READY'))
      .subscribe(() => this.updateAvailable.set(true));

    //По умолчанию Angular проверяет обновления только при старте приложения
    //(через registrationStrategy в app.config.ts). Но установленное PWA чаще
    //не "запускается заново", а просто разворачивается из фона — добавляем
    //ручную проверку каждый раз, когда вкладка/приложение снова становится видимым.
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.swUpdate.checkForUpdate().then();
      }
    });
  }

  //Активирует уже скачанную версию простой перезагрузкой страницы —
  //это официально рекомендуемый Angular способ, отдельный вызов
  //активации новой версии не требуется.
  reloadForUpdate(): void {
    document.location.reload();
  }
}
