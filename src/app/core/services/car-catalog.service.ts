import { Injectable } from '@angular/core';
import carCatalogData from '../data/car-catalog.json';

interface CarCatalogEntry {
  brand: string;
  models: string[];
}

@Injectable({
  providedIn: 'root',
})
export class CarCatalogService {
  private readonly catalog: CarCatalogEntry[] = carCatalogData;
  readonly brands: string[] = this.catalog.map((entry) => entry.brand);

  //Метод возвращает список моделей для конкретной марки
  getModelsForBrand(brand: string): string[] {
    const entry = this.catalog.find(
      (item) => item.brand.toLowerCase() === brand.trim().toLowerCase(),
    );

    return entry ? entry.models : [];
  }
}
