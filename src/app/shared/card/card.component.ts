import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { SvgIconComponent } from '../svg-icon/svg-icon.component';
import { RepairType } from '../../types/repair-type';
import { CurrencyPipe } from '@angular/common';

@Component({
  selector: 'app-card',
  imports: [SvgIconComponent, CurrencyPipe],
  templateUrl: './card.component.html',
  styleUrl: './card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardComponent {
  @Input() repairList: RepairType[] = [];
}
