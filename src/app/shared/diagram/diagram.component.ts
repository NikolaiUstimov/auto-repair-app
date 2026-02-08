import {ChangeDetectionStrategy, Component} from '@angular/core';

@Component({
  selector: 'app-diagram',
  imports: [],
  templateUrl: './diagram.component.html',
  styleUrl: './diagram.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DiagramComponent {
  view: [number, number] = [400, 200];


}
