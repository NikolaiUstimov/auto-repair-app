import {DBSchema} from 'idb'

export type RepairType = {
  number: number;
  id: string,
  createdAt: string;
  nameRepair: string;
  auto: string;
  price: number;
}

export interface RepairDB extends DBSchema {
  repairs: {
    key: string;
    value: RepairType;
    indexes: {
      'by-number': number;
      'by-date': string;
      'by-auto': string;
      'by-price': number;
    }
  }
}
