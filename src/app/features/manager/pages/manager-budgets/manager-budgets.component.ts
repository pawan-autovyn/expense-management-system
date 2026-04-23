import { DatePipe, CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { AnalyticsApiService } from '../../../../core/services/analytics-api.service';
import { AuthService } from '../../../../core/services/auth.service';
import { DirectoryService } from '../../../../core/services/directory.service';
import { ExpenseRepositoryService } from '../../../../core/services/expense-repository.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { Role } from '../../../../models/app.models';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { SearchInputComponent } from '../../../../shared/components/search-input/search-input.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { buildCategoryBudgetViews } from '../../../../shared/utils/expense.utils';

@Component({
  selector: 'app-manager-budgets',
  standalone: true,
  imports: [
    CurrencyPipe,
    DatePipe,
    EmptyStateComponent,
    IconComponent,
    SearchInputComponent,
    StatusBadgeComponent,
  ],
  templateUrl: './manager-budgets.component.html',
  styleUrl: './manager-budgets.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManagerBudgetsComponent {
  private readonly analyticsApi = inject(AnalyticsApiService);
  private readonly authService = inject(AuthService);
  protected readonly directoryService = inject(DirectoryService);
  private readonly expenseRepository = inject(ExpenseRepositoryService);
  private readonly notificationService = inject(NotificationService);
  protected readonly searchTerm = signal('');
  private readonly apiCategoryViews = signal<
    Array<{
      category: {
        id: string;
        name: string;
        description: string;
        icon: string;
        accent: string;
        monthlyBudget: number;
        previousSpend: number;
      };
      spend: number;
      remaining: number;
      usage: number;
      status: 'Within Budget' | 'Near Limit' | 'Over Budget';
      previousSpend: number;
    }>
  >([]);

  constructor() {
    void this.loadBudgets();
  }
  protected readonly categoryViews = computed(() =>
    this.apiCategoryViews().length > 0
      ? this.apiCategoryViews()
      : buildCategoryBudgetViews(
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
  protected readonly latestBudgetNotification = computed(
    () =>
      this.notificationService
        .getNotificationsForRole(Role.OperationManager)
        .find((notification) =>
          `${notification.title} ${notification.message}`.toLowerCase().includes('budget'),
        ) ?? null,
  );

  private async loadBudgets(): Promise<void> {
    try {
      const response = await firstValueFrom(this.analyticsApi.getManagerBudgets());
      this.apiCategoryViews.set(response.categoryViews);
    } catch {
      return;
    }
  }
}
