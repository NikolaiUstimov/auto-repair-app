import { DBSchema } from 'idb';

export interface RepairType {
  id: string;
  createdAt: string;
  nameRepair: string;
  auto: string;
  licenseNumber: string;
  price: number;
  comment?: string;
}

//Отдельный тип для создания записи с фотографией
//id — собственный уникальный ключ каждого фото (не равен id записи, раз фото
//теперь может быть несколько). repairId — связь с конкретной записью о ремонте.
export interface RepairPhoto {
  id: string;
  repairId: string;
  photo: Blob;
  mimeType: string; //MIME после сжатия: формат фото
  size: number; //размер Blob в байтах - для отображения "150 КБ"
  width: number; //ширина в пикселях после сжатия
  height: number; //высота в пикселях после сжатия
  createdAt: number; //когда фото было загружено/заменено (Date.now())
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
  photos: {
    key: string;
    value: RepairPhoto;
    indexes: {
      'by-repair': string;
    };
  };
}
