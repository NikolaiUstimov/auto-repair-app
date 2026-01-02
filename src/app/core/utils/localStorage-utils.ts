import {RepairType} from '../../types/repair-type';

export class LocalStorageUtils {
  static localStorageRepairKey: string = "repairList";
  static repairs = localStorage.getItem(this.localStorageRepairKey);

  static localStorageSetData(value: RepairType[]) {
    localStorage.setItem(this.localStorageRepairKey, JSON.stringify(value));
  }

  static localStorageAddRepairs(formValue: {}, date: string) {
    const repairsData = this.repairs ? JSON.parse(this.repairs) : [];

    const nextNumber = repairsData.length > 1
      ? repairsData[repairsData.length - 1]
      : repairsData.length + 1;

    const newRecord: RepairType = {
      number: nextNumber,
      id: crypto?.randomUUID() ?? Date.now().toString(),
      ...formValue,
      createdAt: date
    }

    const updatedRepairsData: RepairType[] = [...repairsData, newRecord];
    localStorage.setItem(this.localStorageRepairKey, JSON.stringify(updatedRepairsData));
  }

  static localStorageGetData() {
    return this.repairs ? JSON.parse(this.repairs) : [];
  }
}
