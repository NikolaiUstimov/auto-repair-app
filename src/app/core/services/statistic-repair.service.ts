import { inject, Injectable, signal } from '@angular/core';
import { RepairType } from '../../types/repair-type';
import { IndexedDBService } from './indexed-db.service';

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
      this._dataRepair.set(repairs);
    } catch (error) {
      console.error('Не удалось загрузить записи из IndexedDB', error);
    } finally {
      this._isLoading.set(false);
    }
  }

  async addRepair(repair: RepairType): Promise<void> {
    await this.indexedDBService.addRepair(repair);
    this._dataRepair.update((list) => [...list, repair]);
  }
}
