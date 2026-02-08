import {Component, Input} from '@angular/core';

@Component({
  selector: '[icon]',
  standalone: true,
  template: '<svg:use [attr.href]="href"></svg:use>',
  styles: ['']
})

export class SvgIconComponent {
  @Input() icon = '';

  get href() {
    return `icons/svg/${this.icon}.svg#${this.icon}`;
  }
}

