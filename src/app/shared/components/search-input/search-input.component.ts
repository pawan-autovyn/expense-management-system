import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-search-input',
  standalone: true,
  imports: [FormsModule, IconComponent],
  template: `
    <label class="search-field">
      <app-icon name="search" [size]="18" />
      <input
        type="search"
        [ngModel]="value()"
        (ngModelChange)="valueChange.emit($event)"
        [placeholder]="placeholder()"
      />
    </label>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchInputComponent {
  readonly value = input('');
  readonly placeholder = input('Search');
  readonly valueChange = output<string>();
}
