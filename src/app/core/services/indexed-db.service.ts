import {Injectable} from '@angular/core'
import {RepairDB, RepairType} from '../../types/repair-type'
import {IDBPDatabase, openDB} from 'idb'

@Injectable({
  providedIn: 'root'
})
export class IndexedDBService {
  private dbPromise: Promise<IDBPDatabase<RepairDB>>;
  private readonly DB_NAME = 'repair-db';
  private readonly STORE_NAME = 'repairs';
  private readonly DB_VERSION = 1;

  constructor() {
    this.dbPromise = this.initDB();
  }

  //Инициализация БД
  private async initDB(): Promise<IDBPDatabase<RepairDB>> {
    return openDB<RepairDB>(this.DB_NAME, this.DB_VERSION, {
      upgrade(db) {
        if (db.objectStoreNames.contains('repairs')) {
          db.deleteObjectStore('repairs');
        }

        const store = db.createObjectStore('repairs' as const, {
          keyPath: 'id',
          autoIncrement: false
        });

        //Создание индексов для реализации поиска
        store.createIndex('by-number', 'number', {unique: false});
        store.createIndex('by-date', 'createdAt', {unique: false});
        store.createIndex('by-auto', 'auto', {unique: false});
        store.createIndex('by-price', 'price', {unique: false});
      },
      blocked() {
        console.warn('Подключение к базе данных заблокировано');
      },
      blocking() {
        console.warn('База данных блокируется другой вкладкой');
      },
      terminated() {
        console.warn('Подключение к базе данных прервано');
      }
    });
  }

  //Добавление или обновление записи в БД
  async addRepair(repair: RepairType): Promise<string> {
    try {
      const db = await this.dbPromise;
      const id = await  db.put(this.STORE_NAME, repair);
      return id as string;
    } catch (error) {
      console.error('Ошибка при сохраниении записи', error);
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
    } catch (error) {
      console.error('Ошибка удаления записи', error);
      throw error;
    }
  }

  //Удаление всех записей БД
  async deleteAllRepairs(id: string): Promise<void> {
    try {
      const db = await this.dbPromise;
      await db.clear(this.STORE_NAME);
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
