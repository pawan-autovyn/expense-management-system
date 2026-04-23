import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';

import { AnalyticsApiService, AdminReportRow } from '../../../../core/services/analytics-api.service';
import { DirectoryService } from '../../../../core/services/directory.service';
import { ExpenseRepositoryService } from '../../../../core/services/expense-repository.service';
import { ExpenseStatus } from '../../../../models/app.models';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { StatCardComponent } from '../../../../shared/components/stat-card/stat-card.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { buildCsvContent, downloadCsv } from '../../../../shared/utils/export.utils';

interface ReportFilters {
  fromDate: string;
  toDate: string;
  status: 'all' | 'pending' | 'approved' | 'rejected' | 'draft';
  templateId: string;
  branch: string;
  searchTerm: string;
}

interface TemplateReportRow {
  id: string;
  date: string;
  employeeName: string;
  templateName: string;
  items: number;
  amount: number;
  remarks: string;
  branch: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Draft';
  requester: string;
  recommender: string;
  adminApprover: string;
  description: string;
  itemAmount: number;
  vendor: string;
  searchBlob: string;
}

interface BranchSummary {
  name: string;
  total: number;
  pending: number;
  approved: number;
}

const DEFAULT_REPORT_FILTERS: ReportFilters = {
  fromDate: '',
  toDate: '',
  status: 'all',
  templateId: 'all',
  branch: 'all',
  searchTerm: '',
};

@Component({
  selector: 'app-admin-reports',
  standalone: true,
  imports: [
    CurrencyPipe,
    DatePipe,
    FormsModule,
    EmptyStateComponent,
    IconComponent,
    StatCardComponent,
    StatusBadgeComponent,
  ],
  templateUrl: './admin-reports.component.html',
  styleUrl: './admin-reports.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminReportsComponent {
  private readonly analyticsApi = inject(AnalyticsApiService);
  protected readonly directoryService = inject(DirectoryService);
  private readonly expenseRepository = inject(ExpenseRepositoryService);
  protected readonly filters = signal<ReportFilters>({ ...DEFAULT_REPORT_FILTERS });
  private readonly apiReportRows = signal<AdminReportRow[]>([]);

  constructor() {
    void this.directoryService.loadUsers();
    void this.loadReports();
  }

  protected readonly reportRows = computed<TemplateReportRow[]>(() => {
    if (this.apiReportRows().length > 0) {
      return this.apiReportRows();
    }

    return this.expenseRepository
      .expenses()
      .map((expense) => {
        const category = this.directoryService.getCategoryById(expense.categoryId);
        const manager = this.directoryService.getUserById(expense.managerId);
        const branch = this.resolveBranch(manager?.location ?? manager?.department ?? 'Head Office');
        const status = this.normalizeStatus(expense.status);
        const workflowActors = this.resolveWorkflowActors(expense, manager?.name ?? 'Operations Manager');
        const remarks = expense.auditTrail[0]?.note ?? expense.description;

        return {
          id: expense.id,
          date: expense.date,
          employeeName: manager?.name ?? 'Unknown',
          templateName: category?.name ?? 'Untitled Template',
          items: Math.max(1, expense.tags.length),
          amount: expense.amount,
          remarks,
          branch,
          status,
          requester: workflowActors[0],
          recommender: workflowActors[1],
          adminApprover: workflowActors[2],
          description: expense.description,
          itemAmount: expense.amount,
          vendor: expense.vendor,
          searchBlob: [
            expense.title,
            expense.vendor,
            expense.description,
            category?.name ?? '',
            manager?.name ?? '',
            branch,
            status,
            remarks,
            ...workflowActors,
          ]
            .join(' ')
            .toLowerCase(),
        };
      })
      .sort((left, right) => {
        if (left.date === right.date) {
          return right.amount - left.amount;
        }

        return right.date.localeCompare(left.date);
      });
  });

  protected readonly visibleRows = computed(() =>
    this.reportRows()
      .filter((row) => {
        const filters = this.filters();
        const searchTerm = filters.searchTerm.trim().toLowerCase();

        return (
          (!filters.fromDate || row.date >= filters.fromDate) &&
          (!filters.toDate || row.date <= filters.toDate) &&
          (filters.status === 'all' || row.status.toLowerCase() === filters.status) &&
          (filters.templateId === 'all' ||
            this.directoryService.getCategoryById(filters.templateId)?.name === row.templateName) &&
          (filters.branch === 'all' || row.branch === filters.branch) &&
          (!searchTerm || row.searchBlob.includes(searchTerm))
        );
      })
      .map((row, index) => ({
        ...row,
        index: index + 1,
      })),
  );

  protected readonly pendingCount = computed(
    () => this.visibleRows().filter((row) => row.status === 'Pending').length,
  );
  protected readonly approvedCount = computed(
    () => this.visibleRows().filter((row) => row.status === 'Approved').length,
  );
  protected readonly branchSummaries = computed<BranchSummary[]>(() => {
    const summaries = new Map<string, BranchSummary>();

    for (const row of this.visibleRows()) {
      const current = summaries.get(row.branch) ?? {
        name: row.branch,
        total: 0,
        pending: 0,
        approved: 0,
      };

      current.total += 1;
      current.pending += row.status === 'Pending' ? 1 : 0;
      current.approved += row.status === 'Approved' ? 1 : 0;
      summaries.set(row.branch, current);
    }

    return Array.from(summaries.values()).sort((left, right) => right.total - left.total);
  });

  protected readonly summaryCards = computed(() => {
    const totalAmount = this.visibleRows().reduce((total, row) => total + row.amount, 0);
    const averageTicket = this.visibleRows().length
      ? totalAmount / this.visibleRows().length
      : 0;

    return [
      {
        title: 'Visible Records',
        value: this.visibleRows().length.toString(),
        subtitle: 'Current filter set',
        icon: 'layers',
        tone: 'brand' as const,
      },
      {
        title: 'Pending Review',
        value: this.pendingCount().toString(),
        subtitle: 'Awaiting admin action',
        icon: 'clock',
        tone: 'warning' as const,
      },
      {
        title: 'Approved',
        value: this.approvedCount().toString(),
        subtitle: 'Cleared by finance',
        icon: 'check-circle',
        tone: 'success' as const,
      },
      {
        title: 'Total Amount',
        value: totalAmount.toLocaleString('en-IN', {
          style: 'currency',
          currency: 'INR',
          maximumFractionDigits: 0,
        }),
        subtitle: `Average ticket ${averageTicket.toLocaleString('en-IN', {
          style: 'currency',
          currency: 'INR',
          maximumFractionDigits: 0,
        })}`,
        icon: 'wallet',
        tone: 'brand' as const,
      },
      {
        title: 'Branches',
        value: this.branchSummaries().length.toString(),
        subtitle: 'Active locations represented',
        icon: 'activity',
        tone: 'brand' as const,
      },
    ];
  });

  protected readonly branchNames = computed(() =>
    Array.from(new Set(this.reportRows().map((row) => row.branch))).sort(),
  );

  protected patchFilter(key: keyof ReportFilters, value: string): void {
    this.filters.update((filters) => ({
      ...filters,
      [key]: value,
    }));
  }

  protected resetFilters(): void {
    this.filters.set({ ...DEFAULT_REPORT_FILTERS });
  }

  protected exportVisibleRows(): void {
    const csv = buildCsvContent(this.visibleRows(), [
      { label: 'Sr.', key: 'index' },
      { label: 'Date', key: 'date' },
      { label: 'Employee Name', key: 'employeeName' },
      { label: 'Template Name', key: 'templateName' },
      { label: 'Items', key: 'items' },
      {
        label: 'Amount',
        getValue: (row) =>
          row.amount.toLocaleString('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
          }),
      },
      { label: 'Remarks', key: 'remarks' },
      { label: 'Branch', key: 'branch' },
      { label: 'Status', key: 'status' },
      { label: 'Requester', key: 'requester' },
      { label: 'Recommender', key: 'recommender' },
      { label: 'Admin Approval', key: 'adminApprover' },
      { label: 'Description', key: 'description' },
      {
        label: 'Item Amount',
        getValue: (row) =>
          row.itemAmount.toLocaleString('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
          }),
      },
    ]);

    downloadCsv('corework-reports.csv', csv);
  }

  protected readonly workflowLegend = [
    {
      label: 'Requester',
      description: 'Expense submitted by the employee or operation owner.',
    },
    {
      label: 'Recommender',
      description: 'Second review step before final admin approval.',
    },
    {
      label: 'Admin Approval',
      description: 'Final approval or rejection step.',
    },
  ] as const;

  protected normalizeStatus(status: ExpenseStatus): TemplateReportRow['status'] {
    if (status === ExpenseStatus.Approved) {
      return 'Approved';
    }

    if (status === ExpenseStatus.Rejected) {
      return 'Rejected';
    }

    if (status === ExpenseStatus.Draft) {
      return 'Draft';
    }

    return 'Pending';
  }

  protected resolveWorkflowActors(
    expense: { auditTrail: { actor?: string }[] },
    managerName: string,
  ): string[] {
    const fallback = ['Finance Desk', 'Audit Lead', 'Leadership Review'];
    const actors = [managerName];

    for (const actor of expense.auditTrail.map((entry) => entry.actor).filter(Boolean) as string[]) {
      if (actors.length === 3) {
        break;
      }

      if (!actors.includes(actor)) {
        actors.push(actor);
      }
    }

    while (actors.length < 3) {
      actors.push(fallback[actors.length - 1]);
    }

    return actors.slice(0, 3);
  }

  private resolveBranch(location: string): string {
    const [branch] = location.split(',');

    return branch.trim();
  }

  private async loadReports(): Promise<void> {
    try {
      const response = await firstValueFrom(this.analyticsApi.getAdminReports());
      this.apiReportRows.set(response.rows);
    } catch {
      return;
    }
  }
}
