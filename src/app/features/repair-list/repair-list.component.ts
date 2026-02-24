import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject
} from '@angular/core'
import {Field} from '../../shared/field/field'
import {FormBuilder, ReactiveFormsModule, Validators} from '@angular/forms'
import {ButtonComponent} from '../../shared/button/button.component'
import {DateUtils} from '../../core/utils/date-utils'
import {RepairType} from '../../types/repair-type'
import {SvgIconComponent} from '../../shared/svg-icon/svg-icon.component'
import {
  StatisticRepairService
} from '../../core/services/statistic-repair.service'
import {RepairFormValue} from '../../types/form-value-type'

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

  repairForm = this.#fb.nonNullable.group({
    nameRepair: this.#fb.nonNullable.control('', Validators.required),
    auto: this.#fb.nonNullable.control('', Validators.required),
    price: this.#fb.nonNullable.control(0, Validators.required),
  });

  addNewRepair() {
    const currentDate = new Date();
    const listData: RepairType[] = this.statisticRepair.dataRepair();


    const nextNumber: number = listData.length
      ? listData[listData.length - 1].number + 1
      : 1;

    const id = crypto?.randomUUID() ?? Date.now().toString();
    const formValue: RepairFormValue = this.repairForm.getRawValue();
    const newRecord: RepairType = {
      number: nextNumber,
      id: id,
      createdAt: DateUtils.formatDate(currentDate),
      ...formValue,
    };

    this.statisticRepair.addRepair(newRecord);

    this.repairForm.reset();
  }
}
