import {Injectable, signal} from '@angular/core';
import {RepairType} from '../../types/repair-type';
import {LocalStorageUtils} from '../utils/localStorage-utils';

@Injectable({
  providedIn: 'root'
})
export class StatisticRepairService {
  private readonly _dataRepair = signal<RepairType[]>([]);
  readonly dataRepair = this._dataRepair.asReadonly();

  constructor() {
    const dataStorage = LocalStorageUtils.localStorageGetData();
    if (dataStorage.length) {
      this._dataRepair.set(dataStorage);
    }
  }

  addRepair(repair: RepairType) {
    this._dataRepair.update(list => [...list, repair]);
    LocalStorageUtils.localStorageSetData(this._dataRepair());
  }
}
