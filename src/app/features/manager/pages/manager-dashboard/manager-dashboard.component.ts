import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { signal } from '@angular/core';

import { AuthService } from '../../../../core/services/auth.service';
import { DirectoryService } from '../../../../core/services/directory.service';
import { ExpenseRepositoryService } from '../../../../core/services/expense-repository.service';
import { buildCategoryBudgetViews, calculatePercentageDelta } from '../../../../shared/utils/expense.utils';
import { ActivityTimelineComponent, TimelineItem } from '../../../../shared/components/activity-timeline/activity-timeline.component';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { StatCardComponent } from '../../../../shared/components/stat-card/stat-card.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { BudgetStatus } from '../../../../models/app.models';

interface VendorSummary {
  vendor: string;
  spend: number;
  count: number;
}

interface OverBudgetSummary {
  categoryId: string;
  categoryName: string;
  spend: number;
  budget: number;
  overBy: number;
  usage: number;
}

@Component({
  selector: 'app-manager-dashboard',
  standalone: true,
  imports: [
    CurrencyPipe,
    DatePipe,
    FormsModule,
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
  protected readonly directoryService = inject(DirectoryService);
  private readonly expenseRepository = inject(ExpenseRepositoryService);
  private readonly managerId = computed(() => this.authService.currentUser()?.id ?? '');
  protected readonly dashboardRangeOptions = [
    { label: 'Current year', value: 'current-year' },
    { label: 'Last year', value: 'last-year' },
    { label: 'Last 2 years', value: 'last-2-years' },
    { label: 'Custom range', value: 'custom' },
    { label: 'All time', value: 'all' },
  ] as const;
  protected readonly dashboardRange = signal<'current-year' | 'last-year' | 'last-2-years' | 'custom' | 'all'>(
    'current-year',
  );
  protected readonly dashboardDateFrom = signal('');
  protected readonly dashboardDateTo = signal('');

  protected readonly myExpenses = computed(() =>
    this.expenseRepository.getExpensesForManager(this.managerId()),
  );
  protected readonly visibleExpenses = computed(() => {
    const bounds = this.resolveDashboardBounds();

    if (!bounds) {
      return this.myExpenses();
    }

    return this.myExpenses().filter((expense) => {
      const expenseDate = new Date(expense.date).getTime();

      return expenseDate >= bounds.start.getTime() && expenseDate <= bounds.end.getTime();
    });
  });
  protected readonly topCategories = computed(() =>
    buildCategoryBudgetViews(
      this.directoryService.categories(),
      this.visibleExpenses(),
      this.managerId(),
    )
      .filter((category) => category.spend > 0)
      .slice(0, 5),
  );
  protected readonly budgetOutCategories = computed(() =>
    buildCategoryBudgetViews(
      this.directoryService.categories(),
      this.visibleExpenses(),
      this.managerId(),
    )
      .filter((category) => category.status === BudgetStatus.OverBudget)
      .slice(0, 5),
  );
  protected readonly budgetOutSummary = computed<OverBudgetSummary[]>(() =>
    this.budgetOutCategories().map((category) => ({
      categoryId: category.category.id,
      categoryName: category.category.name,
      spend: category.spend,
      budget: category.category.monthlyBudget,
      overBy: category.spend - category.category.monthlyBudget,
      usage: category.usage,
    })),
  );
  protected readonly recentExpenses = computed(() =>
    [...this.visibleExpenses()]
      .sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime())
      .slice(0, 5),
  );
  protected readonly totalBudget = computed(() => this.authService.currentUser()?.assignedBudget ?? 0);
  protected readonly topVendors = computed<VendorSummary[]>(() => {
    const summary = new Map<string, VendorSummary>();

    for (const expense of this.visibleExpenses()) {
      const vendor = expense.vendor.trim() || 'Vendor';
      const current = summary.get(vendor) ?? { vendor, spend: 0, count: 0 };

      current.spend += expense.amount;
      current.count += 1;
      summary.set(vendor, current);
    }

    return [...summary.values()].sort((left, right) => right.spend - left.spend).slice(0, 5);
  });
  protected readonly remainingBudget = computed(() => {
    const budget = this.authService.currentUser()?.assignedBudget ?? 0;
    const spent = this.visibleExpenses().reduce((total, expense) => total + expense.amount, 0);

    return budget - spent;
  });
  protected readonly pendingCount = computed(
    () =>
      this.visibleExpenses().filter((expense) =>
        ['Submitted', 'Recommended', 'Reopened', 'Under Review', 'Over Budget'].includes(
          expense.status,
        ),
      ).length,
  );
  protected readonly monthDelta = computed(() => calculatePercentageDelta(15400, 13220));
  protected readonly approvalSummary = computed(() => [
      {
        label: 'Draft',
        value: this.visibleExpenses().filter((expense) => expense.status === 'Draft').length,
      },
        {
          label: 'Pending',
          value: this.visibleExpenses().filter((expense) =>
            ['Submitted', 'Recommended', 'Reopened', 'Under Review', 'Over Budget'].includes(
              expense.status,
            ),
          ).length,
        },
      {
        label: 'Approved',
        value: this.visibleExpenses().filter((expense) => expense.status === 'Approved').length,
      },
      {
        label: 'Rejected',
        value: this.visibleExpenses().filter((expense) => expense.status === 'Rejected').length,
      },
  ]);
  protected readonly timelineItems = computed<TimelineItem[]>(() =>
    this.visibleExpenses()
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

  protected setDashboardRange(value: 'current-year' | 'last-year' | 'last-2-years' | 'custom' | 'all'): void {
    this.dashboardRange.set(value);
  }

  protected setDashboardDateFrom(value: string): void {
    this.dashboardDateFrom.set(value);
  }

  protected setDashboardDateTo(value: string): void {
    this.dashboardDateTo.set(value);
  }

  private resolveDashboardBounds(): { start: Date; end: Date } | null {
    const range = this.dashboardRange();
    const now = new Date('2026-04-02T23:59:59+05:30');

    if (range === 'all') {
      return null;
    }

    if (range === 'current-year') {
      return {
        start: new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0),
        end: now,
      };
    }

    if (range === 'last-year') {
      const year = now.getFullYear() - 1;

      return {
        start: new Date(year, 0, 1, 0, 0, 0, 0),
        end: new Date(year, 11, 31, 23, 59, 59, 999),
      };
    }

    if (range === 'last-2-years') {
      return {
        start: new Date(now.getFullYear() - 2, 0, 1, 0, 0, 0, 0),
        end: new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999),
      };
    }

    if (!this.dashboardDateFrom() && !this.dashboardDateTo()) {
      return null;
    }

    const start = this.dashboardDateFrom()
      ? new Date(`${this.dashboardDateFrom()}T00:00:00`)
      : new Date(now.getFullYear() - 2, 0, 1, 0, 0, 0, 0);
    const end = this.dashboardDateTo()
      ? new Date(`${this.dashboardDateTo()}T23:59:59.999`)
      : now;

    return { start, end };
  }
}
