import {FormControl} from '@angular/forms';

export type FormValueType = {
  nameRepair: FormControl<string>,
  auto: FormControl<string>,
  price: FormControl<number | null>,
};
