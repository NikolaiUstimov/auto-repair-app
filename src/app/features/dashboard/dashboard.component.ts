import {Component, computed, inject, Signal} from '@angular/core'
import {CurrencyPipe} from '@angular/common'
import {RouterLink} from '@angular/router'
import {
  StatisticRepairService
} from '../../core/services/statistic-repair.service'
import {DiagramComponent} from '../../shared/diagram/diagram.component'

@Component({
  selector: 'app-dashboard',
  imports: [
    CurrencyPipe,
    RouterLink,
    DiagramComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent {
  statisticRepair = inject(StatisticRepairService);

  totalCars = this.statisticRepair.dataRepair().length;
  totalRepairs = this.statisticRepair.dataRepair().length;
  totalCost: Signal<number> = computed(() => {
    return this.statisticRepair.dataRepair().reduce((acc, data) => acc + (Number(data.price ? data.price : 0)), 0);
  });
}
