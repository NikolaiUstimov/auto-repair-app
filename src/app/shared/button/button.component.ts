import {Component, EventEmitter, Input, Output} from '@angular/core';
import {NgClass, NgTemplateOutlet} from '@angular/common';
import {RouterLink} from '@angular/router';

@Component({
  selector: 'app-button',
  imports: [
    NgClass,
    NgTemplateOutlet,
    RouterLink
  ],
  templateUrl: './button.component.html',
  styleUrl: './button.component.scss'
})
export class ButtonComponent {
  @Input() href?: string;
  @Input() routerLink?: string;
  @Input() type: 'button' | 'submit' = 'button';
  @Input() variant: 'primary' | 'secondary' | 'danger' = 'primary';
  @Input() size: 'small' | 'medium' | 'large' = 'medium';
  @Input() disabled = false;
  @Input() target: '_blank' | '_self' | '_parent' | '_top' = '_self';
  @Output() action = new EventEmitter<Event>();

  onClick(event: Event) {
    if (!this.href && !this.routerLink && !this.disabled) {
      this.action.emit(event);
    }
  }
}

