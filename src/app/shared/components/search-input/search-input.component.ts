import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-search-input',
  standalone: true,
  imports: [FormsModule, IconComponent],
  templateUrl: './search-input.component.html',
  styleUrl: './search-input.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchInputComponent {
  readonly value = input('');
  readonly placeholder = input('Search');
  readonly valueChange = output<string>();
}
