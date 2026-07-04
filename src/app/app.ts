import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './features/header/header.component';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter } from 'rxjs';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HeaderComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private swUpdate = inject(SwUpdate);
  protected readonly title = signal('auto-repair-app');

  constructor() {
    this.setupUpdate();
  }

  private setupUpdate(): void {
    this.swUpdate.versionUpdates
      .pipe(filter((event): event is VersionReadyEvent => event.type === 'VERSION_READY'))
      .subscribe(() => {
        if (confirm('New version available. Load New Version?')) {
          this.swUpdate.activateUpdate().then(() => window.location.reload());
        }
      });
  }
}
