import {FormControl} from '@angular/forms';

export interface FormValueType {
  nameRepair: FormControl<string>,
  auto: FormControl<string>,
  price: FormControl<number | null>,
}
