import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  computed,
  inject,
} from '@angular/core';
import { Field } from '../../shared/field/field';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonComponent } from '../../shared/button/button.component';
import { DateUtils } from '../../core/utils/date-utils';
import { RepairType } from '../../types/repair-type';
import { StatisticRepairService } from '../../core/services/statistic-repair.service';
import { RepairFormValue } from '../../types/form-value-type';
import { CardComponent } from '../../shared/card/card.component';
import { CarCatalogService } from '../../core/services/car-catalog.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { ComboboxComponent } from '../../shared/combobox/combobox.component';

@Component({
  selector: 'app-repair-list',
  imports: [
    Field,
    ButtonComponent,
    ReactiveFormsModule,
    ButtonComponent,
    CardComponent,
    ComboboxComponent,
  ],
  templateUrl: './repair-list.component.html',
  styleUrl: './repair-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RepairListComponent {
  cdr = inject(ChangeDetectorRef);
  #fb = inject(FormBuilder);
  statisticRepair = inject(StatisticRepairService);
  carCatalog = inject(CarCatalogService);

  constructor() {
    this.cdr.markForCheck();
  }

  repairForm = this.#fb.nonNullable.group({
    nameRepair: this.#fb.nonNullable.control('', Validators.required),
    brand: this.#fb.nonNullable.control('', Validators.required),
    model: this.#fb.nonNullable.control('', Validators.required),
    licenseNumber: this.#fb.nonNullable.control('', Validators.required),
    price: this.#fb.nonNullable.control(0, Validators.required),
  });

  //Список моделей для комбобокса "Модель" зависит от текущего значения поля "Марка".
  //toSignal превращает valueChanges (Observable) в сигнал, чтобы можно было
  //использовать его в computed() наравне с остальными сигналами.
  private brandValue = toSignal(this.repairForm.controls.brand.valueChanges, {
    initialValue: this.repairForm.controls.brand.value,
  });

  carBrands = this.carCatalog.brands;
  modelOptions = computed(() => this.carCatalog.getModelsForBrand(this.brandValue()));

  async addNewRepair() {
    const currentDate = new Date();
    const listData: RepairType[] = this.statisticRepair.dataRepair();

    const nextNumber: number = listData.length
      ? Math.max(...listData.map((repair) => repair.number)) + 1
      : 1;

    const id = crypto?.randomUUID() ?? Date.now().toString();
    const { brand, model, ...restFormValue } = this.repairForm.getRawValue();
    const formValue: RepairFormValue = {
      ...restFormValue,
      auto: `${brand} ${model}`.trim(),
    };
    const newRecord: RepairType = {
      number: nextNumber,
      id: id,
      createdAt: DateUtils.formatDate(currentDate),
      ...formValue,
    };

    await this.statisticRepair.addRepair(newRecord);

    this.repairForm.reset();
  }

  async onDeleteRepair(id: string): Promise<void> {
    const isConfirmed = confirm('Удалить эту запись? Это действие нельзя отменить.');
    if (!isConfirmed) {
      return;
    }

    await this.statisticRepair.deleteRepair(id);
  }
}
