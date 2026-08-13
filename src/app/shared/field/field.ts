import { Component, forwardRef, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

type FieldValue = string | number | null;

@Component({
  selector: 'app-field',
  imports: [],
  templateUrl: './field.html',
  styleUrl: './field.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => Field),
      multi: true,
    },
  ],
})
export class Field implements ControlValueAccessor {
  label = input<string | '' | null>(null);
  type = input<'text' | 'number' | 'search'>('text');
  id = input<string | null>(null);

  value = signal<FieldValue>('');

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private onChange = (value: FieldValue) => {
    /* empty */
  };
  private onTouched = () => {
    /* empty */
  };

  writeValue(value: FieldValue): void {
    this.value.set(value);
  }

  registerOnChange(fn: (value: FieldValue) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  handleInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    const newValue: FieldValue =
      this.type() === 'number' ? (target.value === '' ? null : Number(target.value)) : target.value;

    this.value.set(newValue);
    this.onChange(newValue);
    this.onTouched();
  }
}
