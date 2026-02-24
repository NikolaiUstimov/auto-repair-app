import {RepairType} from '../../types/repair-type'

export class LocalStorageUtils {
  static localStorageRepairKey = "repairList";
  static repairs = localStorage.getItem(this.localStorageRepairKey);

  static localStorageSetData(value: RepairType[]) {
    localStorage.setItem(this.localStorageRepairKey, JSON.stringify(value));
  }

  static localStorageGetData() {
    return this.repairs ? JSON.parse(this.repairs) : [];
  }
}
