import {Component, computed, inject} from '@angular/core'
import {
  StatisticRepairService
} from '../../core/services/statistic-repair.service'
import {NgxEchartsDirective, provideEchartsCore} from 'ngx-echarts'
import type {EChartsCoreOption} from 'echarts/core'
import * as echarts from 'echarts/core'
import {LineChart} from 'echarts/charts'
import {
  GridComponent,
  LegendComponent,
  TooltipComponent
} from 'echarts/components'
import {CanvasRenderer} from 'echarts/renderers'

echarts.use([
  LineChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  CanvasRenderer
]);

@Component({
  selector: 'app-diagram',
  imports: [
    NgxEchartsDirective
  ],
  providers: [provideEchartsCore({echarts})],
  standalone: true,
  templateUrl: './diagram.component.html',
  styleUrl: './diagram.component.scss',
})
export class DiagramComponent {
  statisticRepair = inject(StatisticRepairService);

  dataRepair = this.statisticRepair.dataRepair;

  private monthlyStats = computed(() => {
    const groupedData: Record<string, { count: number; total: number }> = {};

    for (const repair of this.dataRepair()) {
      const [day, month, yearTime] = repair.createdAt.split('.');
      const year = yearTime.split(' ')[0];

      const key = `${month}.${year}`;
      console.log(key)

      if (!groupedData[key]) {
        groupedData[key] = {count: 0, total: 0};
      }

      groupedData[key].count++;
      groupedData[key].total += Number(repair.price);
    }

    const sortedKeys = Object.keys(groupedData).sort(
      (a, b) => new Date(`01.${a}`).getTime() - new Date(`01.${b}`).getTime()
    );

    return sortedKeys.map(key => ({
      month: key,
      count: groupedData[key].count,
      total: groupedData[key].total
    }));
  })

  chartOptions = computed<EChartsCoreOption>(() => {
    const data = this.monthlyStats();

    return {
      tooltip: {
        trigger: 'axis'
      },
      legend: {
        data: ['Количество авто', 'Общая сумма'],
      },
      xAxis: {
        type: 'category',
        data: data.map(d => d.month),
      },
      yAxis: [
        {
          type: 'value',
          name: 'Количество',
        },
        {
          type: 'value',
          name: 'Сумма',
        },
      ],
      series: [
        {
          name: 'Количество авто',
          type: 'line',
          smooth: true,
          areaStyle: {},
          data: data.map(d => d.count),
        },
        {
          name: 'Общая сумма',
          type: 'line',
          smooth: true,
          areaStyle: {
            opacity: 0.3,
          },
          data: data.map(d => d.total),
        },
      ],
    };
  });
}
