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

  //Получение всех записей
  private async loadRepairs(): Promise<void> {
    try {
      const repairs = await this.indexedDBService.getAllRepairs();

      this._dataRepair.set(this.toDisplayOrder(repairs));
    } catch (error) {
      console.error('Не удалось загрузить записи из IndexedDB', error);
    } finally {
      this._isLoading.set(false);
    }
  }

  //Метод сортировки по дате создания (хронология)
  private sortByCreatedAt(repairs: RepairType[]): RepairType[] {
    return [...repairs].sort(
      (a, b) =>
        DateUtils.parseDate(a.createdAt).getTime() - DateUtils.parseDate(b.createdAt).getTime(),
    );
  }

  //Порядок отображения в списке - новые записи сверху списка
  private toDisplayOrder(repairs: RepairType[]): RepairType[] {
    return this.sortByCreatedAt(repairs).reverse();
  }

  //Добавление записи
  async addRepair(repair: RepairType): Promise<void> {
    await this.indexedDBService.addRepair(repair);
    //Здесь запись добавляется в начало списка и она уже новая по хронологии
    //поэтому сортировать при обновлении не нужно
    this._dataRepair.update((list) => [repair, ...list]);
  }

  //Удаление записи по id
  async deleteRepair(id: string): Promise<void> {
    await this.indexedDBService.deleteRepair(id);

    this._dataRepair.update((list) => list.filter((repair) => repair.id !== id));
  }

  //Обновление/редактирование существующей записи
  async updateRepair(repair: RepairType): Promise<void> {
    await this.indexedDBService.addRepair(repair); //addRepair делает db.put - это upset по id

    this._dataRepair.update((list) => list.map((item) => (item.id === repair.id ? repair : item)));
  }
}
