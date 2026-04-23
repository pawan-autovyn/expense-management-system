import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';

import { ActivityTimelineComponent, TimelineItem } from '../../../../shared/components/activity-timeline/activity-timeline.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { StatCardComponent } from '../../../../shared/components/stat-card/stat-card.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { AnalyticsApiService, AuditEntryView } from '../../../../core/services/analytics-api.service';
import { DirectoryService } from '../../../../core/services/directory.service';
import { ExpenseRepositoryService } from '../../../../core/services/expense-repository.service';
import { AuditTrailEntry, Expense, ExpenseStatus, NotificationTone, Role } from '../../../../models/app.models';
import { buildCsvContent, downloadCsv } from '../../../../shared/utils/export.utils';

type AuditActionGroup = 'all' | 'submission' | 'approval' | 'review' | 'draft';
type AuditRoleFilter = 'all' | Role.Admin | Role.OperationManager;

interface AuditFilters {
  searchTerm: string;
  actionGroup: AuditActionGroup;
  role: AuditRoleFilter;
}

interface AuditSummaryCard {
  title: string;
  value: string;
  subtitle: string;
  icon: string;
  tone: 'brand' | 'success' | 'warning' | 'danger';
}

interface ActionBreakdownItem {
  label: string;
  description: string;
  value: number;
  percent: number;
  tone: NotificationTone;
}

const DEFAULT_FILTERS: AuditFilters = {
  searchTerm: '',
  actionGroup: 'all',
  role: 'all',
};

@Component({
  selector: 'app-admin-audit-trail',
  standalone: true,
  imports: [
    DatePipe,
    DecimalPipe,
    FormsModule,
    ActivityTimelineComponent,
    EmptyStateComponent,
    IconComponent,
    StatCardComponent,
    StatusBadgeComponent,
  ],
  templateUrl: './admin-audit-trail.component.html',
  styleUrl: './admin-audit-trail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminAuditTrailComponent {
  private readonly analyticsApi = inject(AnalyticsApiService);
  protected readonly directoryService = inject(DirectoryService);
  private readonly expenseRepository = inject(ExpenseRepositoryService);
  protected readonly filters = signal<AuditFilters>({ ...DEFAULT_FILTERS });
  protected readonly page = signal(1);
  protected readonly pageSize = 6;
  private readonly apiAuditEntries = signal<AuditEntryView[]>([]);

  constructor() {
    void this.directoryService.loadUsers();
    void this.loadAuditTrail();
  }

  protected readonly auditEntries = computed<AuditEntryView[]>(() => {
    if (this.apiAuditEntries().length > 0) {
      return this.apiAuditEntries();
    }

    return this.expenseRepository
      .expenses()
      .flatMap((expense, expenseIndex) => this.mapExpenseAuditEntries(expense, expenseIndex))
      .sort((left, right) => right.date.localeCompare(left.date));
  });

  protected readonly visibleEntries = computed(() =>
    this.auditEntries().filter((entry) => {
      const filters = this.filters();
      const searchTerm = filters.searchTerm.trim().toLowerCase();

      return (
        (filters.actionGroup === 'all' || entry.actionGroup === filters.actionGroup) &&
        (filters.role === 'all' || entry.actorRole === filters.role) &&
        (!searchTerm || entry.searchBlob.includes(searchTerm))
      );
    }),
  );

  protected readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.visibleEntries().length / this.pageSize)),
  );

  protected readonly pagedEntries = computed(() => {
    const currentPage = Math.min(this.page(), this.totalPages());
    const start = (currentPage - 1) * this.pageSize;

    return this.visibleEntries().slice(start, start + this.pageSize);
  });

  protected readonly pageWindow = computed(() => {
    const total = this.visibleEntries().length;

    if (!total) {
      return { start: 0, end: 0, total };
    }

    const currentPage = Math.min(this.page(), this.totalPages());

    return {
      start: (currentPage - 1) * this.pageSize + 1,
      end: Math.min(currentPage * this.pageSize, total),
      total,
    };
  });

  protected readonly summaryCards = computed<AuditSummaryCard[]>(() => {
    const entries = this.visibleEntries();
    const total = entries.length;
    const adminActions = entries.filter((entry) => entry.actorRole === Role.Admin).length;
    const managerActions = entries.filter(
      (entry) => entry.actorRole === Role.OperationManager,
    ).length;
    const touchedExpenses = new Set(entries.map((entry) => entry.expenseId)).size;

    return [
      {
        title: 'Visible Events',
        value: total.toString(),
        subtitle: 'Current filter set',
        icon: 'activity',
        tone: 'brand',
      },
      {
        title: 'Admin Actions',
        value: adminActions.toString(),
        subtitle: 'Audit notes, approvals, and reviews',
        icon: 'users',
        tone: 'success',
      },
      {
        title: 'Manager Actions',
        value: managerActions.toString(),
        subtitle: 'Submissions and draft updates',
        icon: 'user-circle',
        tone: 'warning',
      },
      {
        title: 'Tracked Expenses',
        value: touchedExpenses.toString(),
        subtitle: 'Unique records represented here',
        icon: 'layers',
        tone: 'brand',
      },
    ];
  });

  protected readonly actionBreakdown = computed<ActionBreakdownItem[]>(() => {
    const entries = this.visibleEntries();
    const total = entries.length || 1;

    return [
      this.buildActionBreakdown('Submission', 'Draft saves and expense submissions', 'submission', entries, total, 'info'),
      this.buildActionBreakdown('Approvals', 'Approve or reject decisions', 'approval', entries, total, 'success'),
      this.buildActionBreakdown('Review returns', 'Moved back into the review stream', 'review', entries, total, 'warning'),
      this.buildActionBreakdown('Draft updates', 'Local changes saved before submission', 'draft', entries, total, 'info'),
    ];
  });

  protected readonly timelineItems = computed<TimelineItem[]>(() =>
    this.visibleEntries().slice(0, 5).map((entry) => ({
      id: entry.id,
      title: entry.action,
      description: `${entry.expenseCode} • ${entry.userName} • ${entry.note}`,
      date: entry.date,
      tone: entry.tone,
    })),
  );

  protected readonly actionFilters: { label: string; value: AuditActionGroup }[] = [
    { label: 'All actions', value: 'all' },
    { label: 'Submission', value: 'submission' },
    { label: 'Approval', value: 'approval' },
    { label: 'Review return', value: 'review' },
    { label: 'Draft update', value: 'draft' },
  ];

  protected readonly roleFilters: { label: string; value: AuditRoleFilter }[] = [
    { label: 'All roles', value: 'all' },
    { label: 'Admin', value: Role.Admin },
    { label: 'Operation Manager', value: Role.OperationManager },
  ];

  protected readonly pageSummary = computed(() => {
    const entries = this.visibleEntries();
    const latest = entries[0];
    const latestUser = latest ? `${latest.userName} • ${latest.actorRoleLabel}` : 'No activity yet';

    return {
      latestUser,
      eventCount: entries.length,
      touchedExpenseCount: new Set(entries.map((entry) => entry.expenseId)).size,
    };
  });

  protected patchFilter<Key extends keyof AuditFilters>(key: Key, value: AuditFilters[Key]): void {
    this.filters.update((filters) => ({
      ...filters,
      [key]: value,
    }));
    this.page.set(1);
  }

  protected resetFilters(): void {
    this.filters.set({ ...DEFAULT_FILTERS });
    this.page.set(1);
  }

  protected previousPage(): void {
    this.page.update((value) => Math.max(1, value - 1));
  }

  protected nextPage(): void {
    this.page.update((value) => Math.min(this.totalPages(), value + 1));
  }

  protected exportVisibleRows(): void {
    const csv = buildCsvContent(this.visibleEntries(), [
      { label: 'Time', key: 'date' },
      { label: 'Expense Code', key: 'expenseCode' },
      { label: 'Title', key: 'title' },
      { label: 'Category', key: 'category' },
      { label: 'Vendor', key: 'vendor' },
      { label: 'Amount', getValue: (row) => row.amount.toFixed(2) },
      { label: 'Action', key: 'action' },
      { label: 'User', key: 'userName' },
      { label: 'Role', key: 'actorRoleLabel' },
      { label: 'Note', key: 'note' },
    ]);

    const suffix = this.filters().actionGroup === 'all' ? 'all' : this.filters().actionGroup;

    downloadCsv(`corework-audit-trail-${suffix}.csv`, csv);
  }
  private buildActionBreakdown(
    label: string,
    description: string,
    group: Exclude<AuditActionGroup, 'all'>,
    entries: AuditEntryView[],
    total: number,
    tone: NotificationTone,
  ): ActionBreakdownItem {
    const value = entries.filter((entry) => entry.actionGroup === group).length;

    return {
      label,
      description,
      value,
      percent: (value / total) * 100,
      tone,
    };
  }

  private mapExpenseAuditEntries(expense: Expense, expenseIndex: number): AuditEntryView[] {
    const category = this.directoryService.getCategoryById(expense.categoryId);
    const manager = this.directoryService.getUserById(expense.managerId);
    const expenseCode = `EXP-${String(expenseIndex + 1).padStart(3, '0')}`;
    const auditTrail = expense.auditTrail?.length
      ? expense.auditTrail
      : [this.buildFallbackEntry(expense, manager?.name ?? 'Operation Manager')];

    return auditTrail.map((entry, auditIndex) => ({
      id: `${expense.id}-${entry.id}-${auditIndex}`,
      expenseId: expense.id,
      expenseCode,
      title: expense.title,
      vendor: expense.vendor,
      category: category?.name ?? 'Unknown',
      amount: expense.amount,
      action: entry.action,
      actionGroup: this.classifyAction(entry.action),
      userName: entry.actor,
      actorRole: entry.actorRole,
      actorRoleLabel: this.resolveRoleLabel(entry.actorRole),
      date: entry.date,
      note: entry.note,
      tone: entry.tone,
      searchBlob: '',
    }));
  }

  private buildFallbackEntry(expense: Expense, actor: string): AuditTrailEntry {
    const tone: NotificationTone =
      expense.status === ExpenseStatus.Approved
        ? 'success'
        : expense.status === ExpenseStatus.Rejected
          ? 'danger'
          : [ExpenseStatus.Recommended, ExpenseStatus.Reopened, ExpenseStatus.UnderReview].includes(
              expense.status,
            )
            ? 'warning'
            : 'info';

    return {
      id: `audit-${expense.id}-snapshot`,
      action:
        expense.status === ExpenseStatus.Approved
          ? 'Approved by finance'
          : expense.status === ExpenseStatus.Rejected
            ? 'Rejected by finance'
            : expense.status === ExpenseStatus.Draft
              ? 'Draft saved'
              : 'Expense submitted',
      actor,
      actorRole: Role.OperationManager,
      date: expense.updatedAt ?? expense.createdAt,
      note: 'Imported record without a stored trail. Showing the current workflow state.',
      tone,
    };
  }

  private classifyAction(action: string): Exclude<AuditActionGroup, 'all'> {
    const normalized = action.toLowerCase();

    if (normalized.includes('approved') || normalized.includes('rejected')) {
      return 'approval';
    }

    if (normalized.includes('re-open') || normalized.includes('reopened') || normalized.includes('review')) {
      return 'review';
    }

    if (normalized.includes('draft')) {
      return 'draft';
    }

    return 'submission';
  }

  private resolveRoleLabel(role: Role): string {
    if (role === Role.Admin) {
      return 'Admin';
    }

    if (role === Role.Recommender) {
      return 'Recommender';
    }

    return 'Operation Manager';
  }

  private async loadAuditTrail(): Promise<void> {
    try {
      const response = await firstValueFrom(this.analyticsApi.getAdminAuditTrail());
      this.apiAuditEntries.set(response.entries);
    } catch {
      return;
    }
  }
}
