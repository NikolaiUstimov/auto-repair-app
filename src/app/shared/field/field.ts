import {Component, forwardRef, input, signal} from '@angular/core';
import {ControlValueAccessor, NG_VALUE_ACCESSOR} from '@angular/forms';

type value = string | number | null;

@Component({
  selector: 'app-field',
  imports: [],
  templateUrl: './field.html',
  styleUrl: './field.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => Field),
      multi: true
    }
  ]
})
export class Field implements ControlValueAccessor {
  label = input<string | '' | null>(null);
  type = input<'text'| 'number' | 'search' | 'radio' | 'checkbox'>('text');
  id = input<string | null>(null);

  value = signal<value>('');

  private onChange = (value: value) => {};
  private onTouched = () => {};

  writeValue(value: any): void {
    this.value.set(value);
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  handleInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.value.set(target.value);

    this.onChange(target.value);
    this.onTouched();
  }
}
