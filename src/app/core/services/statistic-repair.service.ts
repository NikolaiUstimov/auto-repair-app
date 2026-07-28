import { inject, Injectable, signal } from '@angular/core';
import { RepairType } from '../../types/repair-type';
import { IndexedDBService } from './indexed-db.service';
import { DateUtils } from '../utils/date-utils';

@Injectable({
  providedIn: 'root',
})
export class StatisticRepairService {
  private readonly indexedDBService = inject(IndexedDBService);

  private readonly _dataRepair = signal<RepairType[]>([]);
  readonly dataRepair = this._dataRepair.asReadonly();

  private readonly _isLoading = signal<boolean>(true);
  readonly isLoading = this._isLoading.asReadonly();

  constructor() {
    this.loadRepairs().then();
  }

  private async loadRepairs(): Promise<void> {
    try {
      const repairs = await this.indexedDBService.getAllRepairs();
      //Сортируем записи по дате создания
      const sortedRepairs = this.sortByCreatedAt(repairs);

      this._dataRepair.set(sortedRepairs);
    } catch (error) {
      console.error('Не удалось загрузить записи из IndexedDB', error);
    } finally {
      this._isLoading.set(false);
    }
  }

  //Метод сортировки по дате создания
  private sortByCreatedAt(repairs: RepairType[]): RepairType[] {
    return [...repairs].sort(
      (a, b) =>
        DateUtils.parseDate(a.createdAt).getTime() - DateUtils.parseDate(b.createdAt).getTime(),
    );
  }

  //Добавление записи
  async addRepair(repair: RepairType): Promise<void> {
    await this.indexedDBService.addRepair(repair);
    this._dataRepair.update((list) => [...list, repair]);
  }

  //Удаление записи по id с восстановлением нумерации по порядку
  async deleteRepair(id: string): Promise<void> {
    await this.indexedDBService.deleteRepair(id);

    const remainingRepairs = this._dataRepair().filter((repair) => repair.id !== id);
    const renumberedRepairs = this.sortByCreatedAt(remainingRepairs).map((repair, index) => ({
      ...repair,
      number: index + 1,
    }));

    await this.indexedDBService.updateRepairs(renumberedRepairs);

    this._dataRepair.set(renumberedRepairs);
  }
}
