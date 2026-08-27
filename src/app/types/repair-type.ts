import { DBSchema } from 'idb';

export interface RepairType {
  id: string;
  createdAt: string;
  nameRepair: string;
  auto: string;
  licenseNumber: string;
  price: number;
}

//Отдельный тип для создания записи с фотографией
export interface RepairPhoto {
  id: string;
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
  };
}
