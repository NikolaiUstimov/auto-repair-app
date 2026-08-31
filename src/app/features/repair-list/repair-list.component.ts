import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  computed,
  effect,
  inject,
  signal,
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
import { ConfirmService } from '../../core/services/confirm.service';

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

  //Сигнал для открытия/скрытия формы записи
  isFormOpen = signal<boolean>(false);

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

  //Метод открытия/закрытия формы
  toggleForm(): void {
    this.isFormOpen.update((isOpen) => !isOpen);
  }

  //Фильтрация по тексту и по диапазонам дат создания
  filterForm = this.#fb.nonNullable.group({
    search: this.#fb.nonNullable.control(''),
    dateFrom: this.#fb.nonNullable.control(''),
    dateTo: this.#fb.nonNullable.control(''),
  });

  private searchValue = toSignal(this.filterForm.controls.search.valueChanges, {
    initialValue: '',
  });

  private dateFromValue = toSignal(this.filterForm.controls.dateFrom.valueChanges, {
    initialValue: '',
  });

  private dateToValue = toSignal(this.filterForm.controls.dateTo.valueChanges, {
    initialValue: '',
  });

  filteredRepairs = computed(() => {
    const query = this.searchValue().trim().toLowerCase();
    const dateFrom = this.dateFromValue();
    const dateTo = this.dateToValue();

    return this.statisticRepair.dataRepair().filter((repair) => {
      const matchesQuery =
        !query ||
        repair.nameRepair.toLowerCase().includes(query) ||
        repair.auto.toLowerCase().includes(query);

      return matchesQuery && this.matchesDateRange(repair.createdAt, dateFrom, dateTo);
    });
  });

  //Метод для приведения полученных дат в установленный здесь формат
  //dateFrom/dateTo приходят из <input type="date"> в формате "YYYY-MM-DD" (ISO) —
  //в отличие от нашего "DD.MM.YYYY", такой формат Date понимает однозначно и без ловушек.
  //"До" включает весь выбранный день целиком, поэтому сравниваем со строгим "меньше начала следующего дня"
  matchesDateRange(createdAt: string, dateFrom: string, dateTo: string): boolean {
    if (!dateFrom && !dateTo) {
      return true;
    }

    const repairDate = DateUtils.parseDate(createdAt);

    if (dateFrom && repairDate < new Date(dateFrom)) {
      return false;
    }

    if (dateTo) {
      const endOfDay = new Date(dateTo);
      endOfDay.setDate(endOfDay.getDate() + 1);
      if (repairDate >= endOfDay) {
        return false;
      }
    }

    return true;
  }

  resetFilters(): void {
    this.filterForm.reset();
  }

  //Пагинация
  readonly pageSize = 10;
  currentPage = signal<number>(1);

  totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filteredRepairs().length / this.pageSize)),
  );

  paginatedRepairs = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize;
    return this.filteredRepairs().slice(start, start + this.pageSize);
  });

  //При изменении любого из фильтров возвращаемся на страницу 1
  //в противном случае может быть несуществующая страница
  private resetPageOnFilterChange = effect(() => {
    this.searchValue();
    this.dateFromValue();
    this.dateToValue();
    this.currentPage.set(1);
  });

  //Если после удаления записей текущая страница стала несуществующей
  //пример: удалили последнюю запись на последней странице, то сдвигаемся назад
  private clampPageOnDataChange = effect(() => {
    const total = this.totalPages();
    if (this.currentPage() > total) {
      this.currentPage.set(total);
    }
  });

  goToPage(page: number): void {
    this.currentPage.set(Math.min(Math.max(page, 1), this.totalPages()));
  }

  nextPage(): void {
    this.goToPage(this.currentPage() + 1);
  }

  prevPage(): void {
    this.goToPage(this.currentPage() - 1);
  }

  //Добавление новой записи
  async addNewRepair() {
    const currentDate = new Date();

    const id = crypto?.randomUUID() ?? Date.now().toString();
    const { brand, model, licenseNumber, ...restFormValue } = this.repairForm.getRawValue();
    const formValue: RepairFormValue = {
      ...restFormValue,
      licenseNumber: licenseNumber.toUpperCase(),
      auto: `${brand} ${model}`.trim(),
    };
    const newRecord: RepairType = {
      id: id,
      createdAt: DateUtils.formatDate(currentDate),
      ...formValue,
    };

    await this.statisticRepair.addRepair(newRecord);

    //Сбрасываем и сворачиваем форму
    this.repairForm.reset();
    this.isFormOpen.set(false);
  }

  private confirmService = inject(ConfirmService);
  async onDeleteRepair(id: string): Promise<void> {
    const isConfirmed = await this.confirmService.confirm({
      title: 'Удалить запись',
      message: 'Это действие нельзя отменить',
      confirmText: 'Удалить',
      danger: true,
    });
    if (!isConfirmed) return;
    // const isConfirmed = confirm('Удалить эту запись? Это действие нельзя отменить.');
    // if (!isConfirmed) {
    //   return;
    // }

    await this.statisticRepair.deleteRepair(id);
  }
}
