import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { SvgIconComponent } from '../svg-icon/svg-icon.component';
import { RepairType } from '../../types/repair-type';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-card',
  imports: [SvgIconComponent, CurrencyPipe, RouterLink],
  templateUrl: './card.component.html',
  styleUrl: './card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardComponent {
  @Input() repairList: RepairType[] = [];
  @Output() deleteRepair: EventEmitter<string> = new EventEmitter<string>();
}
