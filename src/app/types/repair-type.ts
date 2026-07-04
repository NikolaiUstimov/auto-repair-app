import { DBSchema } from 'idb';

export interface RepairType {
  number: number;
  id: string;
  createdAt: string;
  nameRepair: string;
  auto: string;
  licenseNumber: string;
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
    };
  };
}
