import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AppUpdateService } from '../../core/services/app-update.service';

@Component({
  selector: 'app-update-banner',
  imports: [],
  templateUrl: './update-banner.component.html',
  styleUrl: './update-banner.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UpdateBannerComponent {
  updateService = inject(AppUpdateService);
}
