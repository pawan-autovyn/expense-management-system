import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
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
import { ExpenseStatus } from '../../../../models/app.models';

interface ApprovalLevelSummary {
  label: string;
  value: number;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CurrencyPipe,
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
  protected readonly totalAmount = computed(() =>
    this.expenses().reduce((total, expense) => total + expense.amount, 0),
  );
  protected readonly pendingCount = computed(
    () =>
      this.expenses().filter((expense) =>
        [ExpenseStatus.Submitted, ExpenseStatus.UnderReview, ExpenseStatus.OverBudget].includes(
          expense.status,
        ),
      ).length,
  );
  protected readonly approvedCount = computed(
    () =>
      this.expenses().filter((expense) => expense.status === ExpenseStatus.Approved).length,
  );
  protected readonly rejectedCount = computed(
    () =>
      this.expenses().filter((expense) => expense.status === ExpenseStatus.Rejected).length,
  );
  protected readonly statusSegments = computed(() => [
    { label: 'Approved', value: this.approvedCount(), color: '#22C55E' },
    { label: 'Pending', value: this.pendingCount(), color: '#F59E0B' },
    { label: 'Rejected', value: this.rejectedCount(), color: '#EF4444' },
  ]);
  protected readonly approvalStatusCards = computed<ApprovalLevelSummary[]>(() => [
    { label: 'Total', value: this.expenses().length },
    { label: 'Pending at L1', value: 4 },
    { label: 'Rejected by L1', value: 1 },
    { label: 'Approved by L1', value: 6 },
    { label: 'Pending at L2', value: 3 },
    { label: 'Rejected by L2', value: 1 },
    { label: 'Approved by L2', value: 4 },
    { label: 'Pending at L3', value: 2 },
    { label: 'Rejected by L3', value: 1 },
    { label: 'Approved by L3', value: 5 },
  ]);
  protected readonly managerSummary = computed(() =>
    buildManagerSpendSummary(this.expenses(), this.directoryService.users()),
  );
  protected readonly overBudgetCategories = computed(() =>
    buildCategoryBudgetViews(this.directoryService.categories(), this.expenses()).filter(
      (category) => category.status !== 'Within Budget',
    ),
  );
  protected readonly timelineItems = computed<TimelineItem[]>(() =>
    this.expenses()
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
  protected readonly latestBills = computed(() =>
    this.expenses()
      .filter((expense) => expense.receipt)
      .slice(0, 4),
  );

}
