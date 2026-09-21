import { Injectable } from '@angular/core';
import { RepairDB, RepairPhoto, RepairType } from '../../types/repair-type';
import { IDBPDatabase, openDB } from 'idb';

@Injectable({
  providedIn: 'root',
})
export class IndexedDBService {
  private readonly dbPromise: Promise<IDBPDatabase<RepairDB>>;
  private readonly DB_NAME = 'repair-db';
  private readonly STORE_NAME = 'repairs';
  private readonly PHOTOS_STORE_NAME = 'photos';
  private readonly DB_VERSION = 4;

  constructor() {
    this.dbPromise = this.initDB();
  }

  //Инициализация БД
  private async initDB(): Promise<IDBPDatabase<RepairDB>> {
    return openDB<RepairDB>(this.DB_NAME, this.DB_VERSION, {
      upgrade: (db, oldVersion, newVersion, transaction) => {
        //Проверяем есть ли база, если нет - создаем
        const store = db.objectStoreNames.contains(this.STORE_NAME)
          ? transaction.objectStore(this.STORE_NAME)
          : db.createObjectStore(this.STORE_NAME, {
              keyPath: 'id',
              autoIncrement: false,
            });

        //Создание индексов для реализации поиска
        if (!store.indexNames.contains('by-date')) {
          store.createIndex('by-date', 'createdAt', { unique: false });
        }
        if (!store.indexNames.contains('by-auto')) {
          store.createIndex('by-auto', 'auto', { unique: false });
        }
        if (!store.indexNames.contains('by-price')) {
          store.createIndex('by-price', 'price', { unique: false });
        }

        //Стор для фото (появился в версии 2)
        const photosStore = db.objectStoreNames.contains(this.PHOTOS_STORE_NAME)
          ? transaction.objectStore(this.PHOTOS_STORE_NAME)
          : db.createObjectStore(this.PHOTOS_STORE_NAME, { keyPath: 'id' });

        //Индекс по repairId (версия 3) — позволяет быстро получать все фото
        //конкретной записи через getAllFromIndex, а не сканировать весь стор
        if (photosStore.indexNames.contains('by-repair')) {
          const existingIndex = photosStore.index('by-repair');
          if (existingIndex.keyPath !== 'repairId') {
            photosStore.deleteIndex('by-repair');
            photosStore.createIndex('by-repair', 'repairId', { unique: false });
          }
        } else {
          photosStore.createIndex('by-repair', 'repairId', { unique: false });
        }

        //Новый стор для фото будет во 2-й версии базы данных
        // if (!db.objectStoreNames.contains(this.PHOTOS_STORE_NAME)) {
        //   db.createObjectStore(this.PHOTOS_STORE_NAME, { keyPath: 'id' });
        // }
      },
      blocked() {
        console.warn('Подключение к базе данных заблокировано');
      },
      blocking() {
        console.warn('База данных блокируется другой вкладкой');
      },
      terminated() {
        console.warn('Подключение к базе данных прервано');
      },
    });
  }

  //Добавление или обновление записи в БД
  async addRepair(repair: RepairType): Promise<string> {
    try {
      const db = await this.dbPromise;
      const id = await db.put(this.STORE_NAME, repair);
      return id as string;
    } catch (error) {
      console.error('Ошибка при сохранении записи', error);
      throw error;
    }
  }

  //Массовое обновление записей (при удалении записи, чтобы восстановить нумерацию)
  async updateRepairs(repairs: RepairType[]): Promise<void> {
    try {
      const db = await this.dbPromise;
      const tx = db.transaction(this.STORE_NAME, 'readwrite');

      await Promise.all([...repairs.map((repair) => tx.store.put(repair)), tx.done]);
    } catch (error) {
      console.error('Ошибка массового обновления записей', error);
      throw error;
    }
  }

  //Получение записи по id
  async getRepairById(id: string): Promise<RepairType | undefined> {
    try {
      const db = await this.dbPromise;
      return await db.get(this.STORE_NAME, id);
    } catch (error) {
      console.error('Ошибка получения записи', error);
      throw error;
    }
  }

  //Получение всех записей
  async getAllRepairs(): Promise<RepairType[]> {
    try {
      const db = await this.dbPromise;
      return await db.getAll(this.STORE_NAME);
    } catch (error) {
      console.error('Ошибка получения записей', error);
      throw error;
    }
  }

  //Удаление записи по id
  async deleteRepair(id: string): Promise<void> {
    try {
      const db = await this.dbPromise;
      await db.delete(this.STORE_NAME, id);
      //Также чистим все фото этой записи
      await this.deletePhotosByRepairId(id);
    } catch (error) {
      console.error('Ошибка удаления записи', error);
      throw error;
    }
  }

  //Добавление или замена фото для записи
  async savePhoto(photo: RepairPhoto): Promise<void> {
    try {
      const db = await this.dbPromise;
      await db.put(this.PHOTOS_STORE_NAME, photo);
    } catch (error) {
      console.error('Ошибка сохранения фото', error);
      throw error;
    }
  }

  //Получение ВСЕХ фото конкретной записи через индекс by-repair
  async getPhotosByRepairId(repairId: string): Promise<RepairPhoto[]> {
    try {
      const db = await this.dbPromise;
      return await db.getAllFromIndex(this.PHOTOS_STORE_NAME, 'by-repair', repairId);
    } catch (error) {
      console.error('Ошибка получения фото', error);
      throw error;
    }
  }

  //Удаление одного конкретного фото по его собственному id
  async deletePhoto(photoId: string): Promise<void> {
    try {
      const db = await this.dbPromise;
      await db.delete(this.PHOTOS_STORE_NAME, photoId);
    } catch (error) {
      console.error('Ошибка удаления фото', error);
      throw error;
    }
  }

  //Удаление ВСЕХ фото конкретной записи (используется при удалении самой записи).
  //Курсор по индексу — эффективнее, чем сначала getAllFromIndex, а потом
  //удалять каждое по отдельному вызову delete().
  private async deletePhotosByRepairId(repairId: string): Promise<void> {
    const db = await this.dbPromise;
    const tx = db.transaction(this.PHOTOS_STORE_NAME, 'readwrite');
    const index = tx.store.index('by-repair');

    let cursor = await index.openCursor(IDBKeyRange.only(repairId));
    while (cursor) {
      await cursor.delete();
      cursor = await cursor.continue();
    }

    await tx.done;
  }

  //Удаление всех записей БД
  async deleteAllRepairs(): Promise<void> {
    try {
      const db = await this.dbPromise;
      await db.clear(this.STORE_NAME);
      //Удаляем также стор с фото
      await db.clear(this.PHOTOS_STORE_NAME);
    } catch (error) {
      console.error('Ошибка удаления записей', error);
      throw error;
    }
  }

  //Получение количества записей
  async getRepairsCount(): Promise<number> {
    try {
      const db = await this.dbPromise;
      return await db.count(this.STORE_NAME);
    } catch (error) {
      console.error('Ошибка подсчёта записей', error);
      throw error;
    }
  }

  //Закрытие соединения с базой
  async closeConnectionDB(): Promise<void> {
    try {
      const db = await this.dbPromise;
      db.close();
    } catch (error) {
      console.error('Ошибка при закрытии соединения', error);
    }
  }
}
