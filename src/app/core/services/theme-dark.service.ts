import { effect, Injectable, signal } from '@angular/core';

type Theme = 'light' | 'dark';
const STORAGE_KEY = 'theme';

@Injectable({
  providedIn: 'root',
})
export class ThemeDarkService {
  private readonly _theme = signal<Theme>(this.resolveInitialTheme());
  readonly theme = this._theme.asReadonly();

  constructor() {
    //Используем effect, он автоматически перезапускается при смене темы
    //и применяет атрибут к <html>
    effect(() => {
      document.documentElement.setAttribute('data-theme', this._theme());
      localStorage.setItem(STORAGE_KEY, this._theme());
    });
  }

  toggleTheme(): void {
    this._theme.update((current) => (current === 'light' ? 'dark' : 'light'));
  }

  setTheme(theme: Theme): void {
    this._theme.set(theme);
  }

  private resolveInitialTheme(): Theme {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') {
      return saved;
    }
    //Если пользователь ничего не выбирал, применяем системную тему
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
}
