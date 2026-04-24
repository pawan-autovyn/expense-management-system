import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Category, ExpenseFilters, User } from '../../../models/app.models';
import { SearchInputComponent } from '../search-input/search-input.component';

@Component({
  selector: 'app-expense-filter-bar',
  standalone: true,
  imports: [FormsModule, SearchInputComponent],
  templateUrl: './expense-filter-bar.component.html',
  styleUrl: './expense-filter-bar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExpenseFilterBarComponent {
  readonly filters = input.required<ExpenseFilters>();
  readonly categories = input.required<Category[]>();
  readonly managers = input<User[]>([]);
  readonly showManagerFilter = input(false);
  readonly filtersChange = output<ExpenseFilters>();
  readonly statuses = input([
    'Draft',
    'Submitted',
    'Recommended',
    'Reopened',
    'Under Review',
    'Approved',
    'Rejected',
    'Cancelled',
    'Over Budget',
  ]);

  protected patchFilters(patch: Partial<ExpenseFilters>): void {
    this.filtersChange.emit({ ...this.filters(), ...patch });
  }
}
