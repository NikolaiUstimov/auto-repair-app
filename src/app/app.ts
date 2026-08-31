import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './features/header/header.component';
import { UpdateBannerComponent } from './shared/update-banner/update-banner.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HeaderComponent, UpdateBannerComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly title = signal('auto-repair-app');
}
