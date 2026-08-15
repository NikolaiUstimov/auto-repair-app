import { Component, inject } from '@angular/core';
import { SvgIconComponent } from '../../shared/svg-icon/svg-icon.component';
import { RouterLinkWithHref } from '@angular/router';
import { BurgerButtonComponent } from '../../shared/burger-button/burger-button.component';
import { ThemeDarkService } from '../../core/services/theme-dark.service';

@Component({
  selector: 'app-header',
  imports: [SvgIconComponent, RouterLinkWithHref, BurgerButtonComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  themeService = inject(ThemeDarkService);
}
