import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { signal } from '@angular/core';

import { AuthService } from '../../../../core/services/auth.service';
import { DirectoryService } from '../../../../core/services/directory.service';
import { ExpenseRepositoryService } from '../../../../core/services/expense-repository.service';
import { buildCategoryBudgetViews } from '../../../../shared/utils/expense.utils';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { SearchInputComponent } from '../../../../shared/components/search-input/search-input.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-manager-budgets',
  standalone: true,
  imports: [CurrencyPipe, EmptyStateComponent, SearchInputComponent, StatusBadgeComponent],
  templateUrl: './manager-budgets.component.html',
  styleUrl: './manager-budgets.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManagerBudgetsComponent {
  private readonly authService = inject(AuthService);
  protected readonly directoryService = inject(DirectoryService);
  private readonly expenseRepository = inject(ExpenseRepositoryService);
  protected readonly searchTerm = signal('');
  protected readonly categoryViews = computed(() =>
    buildCategoryBudgetViews(
      this.directoryService.categories(),
      this.expenseRepository.expenses(),
      this.authService.currentUser()?.id,
    ),
  );
  protected readonly visibleCategoryViews = computed(() => {
    const query = this.searchTerm().trim().toLowerCase();

    if (!query) {
      return this.categoryViews();
    }

    return this.categoryViews().filter((category) =>
      [
        category.category.name,
        category.category.description,
        category.status,
      ]
        .join(' ')
        .toLowerCase()
        .includes(query),
    );
  });
}
