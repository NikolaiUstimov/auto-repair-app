import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';

const SUGGESTIONS_LIMIT = 10;

@Component({
  selector: 'app-combobox',
  imports: [],
  templateUrl: './combobox.component.html',
  styleUrl: './combobox.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ComboboxComponent {
  label = input<string | '' | null>(null);
  id = input<string | null>(null);
  //Список вариантов для подсказок выбора моделей, зависит от выбранной марки в родителе
  options = input<string[]>([]);

  value = signal<string>('');
  isOpen = signal<boolean>(false);

  //Метод для фильтрации подсказок по введённому тексту
  filteredOptions = computed(() => {
    const query = this.value().trim().toLowerCase();
    const availableOptions = this.options();

    const matches = query
      ? availableOptions.filter((option) => option.toLowerCase().includes(query))
      : availableOptions;

    return matches.slice(0, SUGGESTIONS_LIMIT);
  });

  private onChange = (value: string) => {
    /* заглушка, будет перезаписана через registerOnChange */
  };

  private onTouched = () => {
    /* заглушка, будет перезаписана через registerOnTouched */
  };

  writeValue = (value: string | null): void => {
    this.value.set(value ?? '');
  };

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  handleInput(event: Event): void {
    const target = event.target as HTMLInputElement;

    this.value.set(target.value);
    this.onChange(target.value);
    this.isOpen.set(true);
  }

  handleFocus(): void {
    this.isOpen.set(true);
  }

  handleBlur(): void {
    //Обработка свободного ввода, если машины нет, то текст будет отформатирован с заглавной буквы
    const formattedValue = this.capitalizeFirstLetter(this.value());

    this.value.set(formattedValue);
    this.onChange(formattedValue);
    this.onTouched();
    this.isOpen.set(false);
  }

  //mousedown вместо click + preventDefault: клик по подсказке не должен красть фокус
  //с инпута раньше времени, иначе сработает (blur) и список закроется до того,
  //как успеет обработаться выбор варианта.
  handleOptionMouseDown(event: MouseEvent, option: string): void {
    event.preventDefault();
    this.selectOption(option);
  }

  private selectOption(option: string): void {
    this.value.set(option);
    this.onChange(option);
    this.onTouched();
    this.isOpen.set(false);
  }

  private capitalizeFirstLetter(text: string): string {
    if (!text) {
      return text;
    }

    return text.charAt(0).toUpperCase() + text.slice(1);
  }
}
