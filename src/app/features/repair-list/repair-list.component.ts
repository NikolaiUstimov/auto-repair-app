import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject
} from '@angular/core';
import {Field} from '../../shared/field/field';
import {FormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import {ButtonComponent} from '../../shared/button/button.component';
import {DateUtils} from '../../core/utils/date-utils';
import {RepairType} from '../../types/repair-type';
import {SvgIconComponent} from '../../shared/svg-icon/svg-icon.component';
import {
  StatisticRepairService
} from '../../core/services/statistic-repair.service';

@Component({
  selector: 'app-repair-list',
  imports: [
    Field,
    ButtonComponent,
    ReactiveFormsModule,
    ButtonComponent,
    SvgIconComponent
  ],
  templateUrl: './repair-list.component.html',
  styleUrl: './repair-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RepairListComponent {
  cdr = inject(ChangeDetectorRef);
  #fb = inject(FormBuilder);
  statisticRepair = inject(StatisticRepairService);

  constructor() {
    this.cdr.markForCheck();
  }

  repairForm = this.#fb.group({
    nameRepair: ['', Validators.required],
    auto: ['', Validators.required],
    price: [],
  });

  addNewRepair() {
    const currentDate = new Date();
    const listData: RepairType[] = this.statisticRepair.dataRepair();


    const nextNumber: number = listData.length
      ? listData[listData.length - 1].number + 1
      : 1;

    const newRecord: RepairType = {
      number: nextNumber,
      id: crypto?.randomUUID() ?? Date.now().toString(),
      ...this.repairForm.value,
      createdAt: DateUtils.formatDate(currentDate)
    };

    this.statisticRepair.addRepair(newRecord);

    this.repairForm.reset();
  }
}
