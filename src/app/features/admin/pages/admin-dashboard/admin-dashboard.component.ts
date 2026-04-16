import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CurrencyPipe } from '@angular/common';

import { DirectoryService } from '../../../../core/services/directory.service';
import { ExpenseRepositoryService } from '../../../../core/services/expense-repository.service';
import { buildCategoryBudgetViews, buildManagerSpendSummary } from '../../../../shared/utils/expense.utils';
import { ActivityTimelineComponent, TimelineItem } from '../../../../shared/components/activity-timeline/activity-timeline.component';
import { DonutChartComponent } from '../../../../shared/components/donut-chart/donut-chart.component';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { LineChartComponent } from '../../../../shared/components/line-chart/line-chart.component';
import { StatCardComponent } from '../../../../shared/components/stat-card/stat-card.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { ApprovalStage, ExpenseStatus } from '../../../../models/app.models';

type DashboardRange = 'all' | 'current-year' | 'last-year' | 'last-2-years' | 'custom';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CurrencyPipe,
    FormsModule,
    ActivityTimelineComponent,
    DonutChartComponent,
    IconComponent,
    LineChartComponent,
    StatCardComponent,
    StatusBadgeComponent,
  ],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminDashboardComponent {
  protected readonly directoryService = inject(DirectoryService);
  private readonly expenseRepository = inject(ExpenseRepositoryService);
  protected readonly expenses = this.expenseRepository.expenses;
  protected readonly dashboardRangeOptions = [
    { label: 'Current year', value: 'current-year' },
    { label: 'Last year', value: 'last-year' },
    { label: 'Last 2 years', value: 'last-2-years' },
    { label: 'Custom range', value: 'custom' },
    { label: 'All time', value: 'all' },
  ] as const;
  protected readonly dashboardRange = signal<DashboardRange>('current-year');
  protected readonly dashboardDateFrom = signal('');
  protected readonly dashboardDateTo = signal('');
  protected readonly visibleExpenses = computed(() => {
    const bounds = this.resolveDashboardBounds();

    if (!bounds) {
      return this.expenses();
    }

    return this.expenses().filter((expense) => {
      const expenseDate = new Date(expense.date).getTime();

      return expenseDate >= bounds.start.getTime() && expenseDate <= bounds.end.getTime();
    });
  });
  protected readonly totalExpenseAmount = computed(() =>
    this.visibleExpenses().reduce((total, expense) => total + expense.amount, 0),
  );
  protected readonly allocatedBudget = computed(() =>
    this.directoryService.categories().reduce((total, category) => total + category.monthlyBudget, 0),
  );
  protected readonly remainingBudget = computed(() =>
    Math.max(
      this.allocatedBudget() -
        this.visibleExpenses()
          .filter((expense) => expense.status !== ExpenseStatus.Rejected)
          .reduce((total, expense) => total + expense.amount, 0),
      0,
    ),
  );
  protected readonly pendingCount = computed(
    () =>
      this.visibleExpenses().filter((expense) =>
        [
          ExpenseStatus.Submitted,
          ExpenseStatus.Recommended,
          ExpenseStatus.Reopened,
          ExpenseStatus.UnderReview,
          ExpenseStatus.OverBudget,
        ].includes(expense.status),
      ).length,
  );
  protected readonly approvedCount = computed(
    () => this.visibleExpenses().filter((expense) => expense.status === ExpenseStatus.Approved).length,
  );
  protected readonly rejectedCount = computed(
    () => this.visibleExpenses().filter((expense) => expense.status === ExpenseStatus.Rejected).length,
  );
  protected readonly operationManagerCount = computed(
    () =>
      this.visibleExpenses().filter(
        (expense) =>
          expense.status === ExpenseStatus.Draft ||
          expense.approvalStage === ApprovalStage.OperationManager,
      ).length,
  );
  protected readonly recommenderCount = computed(
    () =>
      this.visibleExpenses().filter(
        (expense) =>
          expense.status === ExpenseStatus.Submitted ||
          expense.status === ExpenseStatus.Recommended ||
          expense.approvalStage === ApprovalStage.Recommender,
      ).length,
  );
  protected readonly approverCount = computed(
    () =>
      this.visibleExpenses().filter(
        (expense) =>
          expense.status === ExpenseStatus.Recommended ||
          expense.status === ExpenseStatus.Reopened ||
          expense.status === ExpenseStatus.UnderReview ||
          expense.approvalStage === ApprovalStage.Approver,
      ).length,
  );
  protected readonly statusSegments = computed(() => [
    { label: 'Approved', value: this.approvedCount(), color: '#22C55E' },
    { label: 'Pending', value: this.pendingCount(), color: '#F59E0B' },
    { label: 'Rejected', value: this.rejectedCount(), color: '#EF4444' },
  ]);
  protected readonly managerSummary = computed(() =>
    buildManagerSpendSummary(this.visibleExpenses(), this.directoryService.users()),
  );
  protected readonly overBudgetCategories = computed(() =>
    buildCategoryBudgetViews(this.directoryService.categories(), this.visibleExpenses()).filter(
      (category) => category.status !== 'Within Budget',
    ),
  );
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
      .sort((left, right) => right.date.localeCompare(left.date))
      .slice(0, 5),
  );

  protected setDashboardRange(value: DashboardRange): void {
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
