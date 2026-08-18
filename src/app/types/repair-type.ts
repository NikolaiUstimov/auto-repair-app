import { DBSchema } from 'idb';

export interface RepairType {
  id: string;
  createdAt: string;
  nameRepair: string;
  auto: string;
  licenseNumber: string;
  price: number;
}

export interface RepairPhoto {
  id: string;
  photo: Blob;
}

export interface RepairDB extends DBSchema {
  repairs: {
    key: string;
    value: RepairType;
    indexes: {
      'by-date': string;
      'by-auto': string;
      'by-price': number;
    };
  };
}
