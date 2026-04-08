import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CurrencyPipe } from '@angular/common';

import { AuthService } from '../../../../core/services/auth.service';
import { DirectoryService } from '../../../../core/services/directory.service';
import { ExpenseRepositoryService } from '../../../../core/services/expense-repository.service';
import { buildCategoryBudgetViews } from '../../../../shared/utils/expense.utils';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-manager-budgets',
  standalone: true,
  imports: [CurrencyPipe, StatusBadgeComponent],
  templateUrl: './manager-budgets.component.html',
  styleUrl: './manager-budgets.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManagerBudgetsComponent {
  private readonly authService = inject(AuthService);
  protected readonly directoryService = inject(DirectoryService);
  private readonly expenseRepository = inject(ExpenseRepositoryService);
  protected readonly categoryViews = computed(() =>
    buildCategoryBudgetViews(
      this.directoryService.categories(),
      this.expenseRepository.expenses(),
      this.authService.currentUser()?.id,
    ),
  );
}
