import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CurrencyPipe } from '@angular/common';

import { AuthService } from '../../../../core/services/auth.service';
import { DirectoryService } from '../../../../core/services/directory.service';
import { ExpenseRepositoryService } from '../../../../core/services/expense-repository.service';
import { buildCategoryBudgetViews, calculatePercentageDelta } from '../../../../shared/utils/expense.utils';
import { ActivityTimelineComponent, TimelineItem } from '../../../../shared/components/activity-timeline/activity-timeline.component';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { StatCardComponent } from '../../../../shared/components/stat-card/stat-card.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-manager-dashboard',
  standalone: true,
  imports: [
    CurrencyPipe,
    ActivityTimelineComponent,
    IconComponent,
    StatCardComponent,
    StatusBadgeComponent,
  ],
  templateUrl: './manager-dashboard.component.html',
  styleUrl: './manager-dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManagerDashboardComponent {
  private readonly authService = inject(AuthService);
  private readonly directoryService = inject(DirectoryService);
  private readonly expenseRepository = inject(ExpenseRepositoryService);
  private readonly managerId = computed(() => this.authService.currentUser()?.id ?? '');

  protected readonly myExpenses = computed(() =>
    this.expenseRepository.getExpensesForManager(this.managerId()),
  );
  protected readonly topCategories = computed(() =>
    buildCategoryBudgetViews(
      this.directoryService.categories(),
      this.expenseRepository.expenses(),
      this.managerId(),
    )
      .filter((category) => category.spend > 0)
      .slice(0, 5),
  );
  protected readonly remainingBudget = computed(() => {
    const budget = this.authService.currentUser()?.assignedBudget ?? 0;
    const spent = this.myExpenses().reduce((total, expense) => total + expense.amount, 0);

    return budget - spent;
  });
  protected readonly pendingCount = computed(
    () =>
      this.myExpenses().filter((expense) => ['Submitted', 'Under Review', 'Over Budget'].includes(expense.status))
        .length,
  );
  protected readonly monthDelta = computed(() => calculatePercentageDelta(15400, 13220));
  protected readonly approvalSummary = computed(() => [
    {
      label: 'Draft',
      value: this.myExpenses().filter((expense) => expense.status === 'Draft').length,
    },
    {
      label: 'Pending',
      value: this.myExpenses().filter((expense) =>
        ['Submitted', 'Under Review', 'Over Budget'].includes(expense.status),
      ).length,
    },
    {
      label: 'Approved',
      value: this.myExpenses().filter((expense) => expense.status === 'Approved').length,
    },
    {
      label: 'Rejected',
      value: this.myExpenses().filter((expense) => expense.status === 'Rejected').length,
    },
  ]);
  protected readonly timelineItems = computed<TimelineItem[]>(() =>
    this.myExpenses()
      .flatMap((expense) =>
        expense.auditTrail.map((entry) => ({
          id: entry.id,
          title: `${expense.title} • ${entry.action}`,
          description: entry.note,
          date: entry.date,
          tone: entry.tone,
        })),
      )
      .slice(0, 5),
  );
  protected readonly recentBills = computed(() =>
    this.myExpenses()
      .filter((expense) => expense.receipt)
      .slice(0, 4),
  );

}
