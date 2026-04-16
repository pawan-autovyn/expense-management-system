import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AuthService } from '../../../../core/services/auth.service';
import { DirectoryService } from '../../../../core/services/directory.service';
import { ExpenseRepositoryService } from '../../../../core/services/expense-repository.service';
import { ApprovalStage, Attachment, ExpenseStatus, Role } from '../../../../models/app.models';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { ReceiptPreviewModalComponent } from '../../../../shared/components/receipt-preview-modal/receipt-preview-modal.component';
import * as exportUtils from '../../../../shared/utils/export.utils';

type ApprovalTabValue = 'l1' | 'l2' | 'rejected' | 'approved';

interface ApprovalRow {
  id: string;
  expenseCode: string;
  title: string;
  amount: number;
  manager: string;
  status: string;
  level: 'L1' | 'L2' | 'L3';
  stageLabel: string;
  category: string;
  date: string;
  vendor: string;
}

@Component({
  selector: 'app-admin-approvals',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, FormsModule, IconComponent, ReceiptPreviewModalComponent],
  templateUrl: './admin-approvals.component.html',
  styleUrl: './admin-approvals.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminApprovalsComponent {
  private readonly authService = inject(AuthService);
  private readonly directoryService = inject(DirectoryService);
  private readonly expenseRepository = inject(ExpenseRepositoryService);
  protected reviewNote = 'Reviewed after verifying the request and budget coverage.';
  protected readonly selectedId = signal<string | null>(null);
  protected readonly selectedReceipt = signal<Attachment | null>(null);
  protected readonly searchTerm = signal('');
  protected readonly selectedTab = signal<ApprovalTabValue>('l2');

  protected readonly approvalRows = computed<ApprovalRow[]>(() =>
    this.expenseRepository
      .expenses()
      .map((expense, index) => {
        const level = this.resolveLevel(expense);
        const stageLabel = this.resolveStageLabel(expense.status, level);

        return {
          id: expense.id,
          expenseCode: `EXP-${String(index + 1).padStart(3, '0')}`,
          title: expense.title,
          amount: expense.amount,
          manager: this.directoryService.getUserById(expense.managerId)?.name ?? 'Manager',
          status: stageLabel,
          level,
          stageLabel,
          category: this.directoryService.getCategoryById(expense.categoryId)?.name ?? 'Unknown',
          date: expense.date,
          vendor: expense.vendor,
        };
      }),
  );

  protected readonly approvalTabs = [
    { label: 'L1 Operation Manager', value: 'l1' },
    { label: 'L2 Recommender', value: 'l2' },
    { label: 'Rejected', value: 'rejected' },
    { label: 'Approved', value: 'approved' },
  ] as const;

  protected readonly filteredRows = computed(() =>
    this.approvalRows().filter((row) => {
      const tab = this.selectedTab();
      const matchesTab =
        tab === 'rejected'
          ? row.status.startsWith('Rejected')
          : tab === 'approved'
            ? row.status.startsWith('Approved') || row.status === 'Final Approved'
            : row.level === tab.toUpperCase();

      if (!matchesTab || row.status === ExpenseStatus.Draft) {
        return false;
      }

      const term = this.searchTerm().trim().toLowerCase();
      if (!term) {
        return true;
      }

      return [row.expenseCode, row.title, row.manager, row.category, row.vendor, row.status, row.level].some(
        (value) => value.toLowerCase().includes(term),
      );
    }),
  );

  protected readonly selectedRow = computed(
    () => this.filteredRows().find((row) => row.id === this.selectedId()) ?? this.filteredRows()[0],
  );
  protected readonly selectedRowId = computed(() => this.selectedRow()?.id ?? '');

  protected readonly selectedExpense = computed(() =>
    this.expenseRepository.getExpenseById(this.selectedRow()?.id ?? ''),
  );

  protected readonly timelineSteps = computed(() => {
    const row = this.selectedRow();
    const isHrApproved =
      row?.level === 'L2' ||
      row?.level === 'L3' ||
      row?.status === 'Recommended, pending admin' ||
      row?.status.startsWith('Approved') === true;
    const isAdminPending = row?.status === 'Recommended, pending admin';
    const isApproved = row?.status.startsWith('Approved') ?? false;

    return [
      { label: 'L1 Operation Manager', owner: row?.manager ?? 'Operation Manager', state: 'Done', active: true },
      {
        label: 'L2 Recommender',
        owner: isHrApproved ? 'Recommendation completed' : 'Waiting',
        state: isHrApproved ? 'Done' : 'Waiting',
        active: row?.level !== 'L1',
      },
      {
        label: 'L3 Admin Approval',
        owner: isAdminPending ? 'Your approval is pending' : isApproved ? 'Completed' : 'Waiting',
        state: isAdminPending ? 'Pending final approval' : isApproved ? 'Done' : 'Waiting',
        active: row?.level === 'L3' || isApproved || isAdminPending,
      },
    ];
  });

  protected readonly primaryActionLabel = computed(() =>
    this.authService.currentUser()?.role === Role.Admin ? 'Approve' : 'Recommend',
  );

  protected approve(): void {
    const expense = this.selectedExpense();
    const reviewer = this.authService.currentUser();

    if (!expense || !reviewer) {
      return;
    }

    this.expenseRepository.approveExpense(expense.id, reviewer, this.reviewNote);
  }

  protected reject(): void {
    const expense = this.selectedExpense();
    const reviewer = this.authService.currentUser();

    if (!expense || !reviewer) {
      return;
    }

    this.expenseRepository.rejectExpense(expense.id, reviewer, this.reviewNote);
  }

  protected reopen(): void {
    const expense = this.selectedExpense();
    const reviewer = this.authService.currentUser();

    if (!expense || !reviewer) {
      return;
    }

    this.expenseRepository.reopenExpense(
      expense.id,
      reviewer,
      'Expense has been moved back into the review stream for reassessment.',
    );
  }

  protected exportVisibleRows(): void {
    const csv = exportUtils.buildCsvContent(this.filteredRows(), [
      { label: 'Expense Code', key: 'expenseCode' },
      { label: 'Title', key: 'title' },
      { label: 'Manager', key: 'manager' },
      { label: 'Category', key: 'category' },
      { label: 'Vendor', key: 'vendor' },
      { label: 'Date', key: 'date' },
      { label: 'Level', key: 'level' },
      { label: 'Status', key: 'status' },
      { label: 'Amount', getValue: (row) => row.amount.toFixed(2) },
    ]);

    exportUtils.downloadCsv(`corework-approvals-${this.selectedTab()}.csv`, csv);
  }

  private resolveLevel(expense: { status: ExpenseStatus; approvalStage?: ApprovalStage }): 'L1' | 'L2' | 'L3' {
    if (expense.status === ExpenseStatus.Approved || expense.status === ExpenseStatus.Rejected) {
      return 'L3';
    }

    if (
      expense.status === ExpenseStatus.Recommended ||
      expense.status === ExpenseStatus.Reopened ||
      expense.status === ExpenseStatus.UnderReview ||
      expense.approvalStage === ApprovalStage.Recommender
    ) {
      return 'L2';
    }

    if (expense.approvalStage === ApprovalStage.Approver) {
      return 'L3';
    }

    if (
      expense.status === ExpenseStatus.Submitted ||
      expense.approvalStage === ApprovalStage.OperationManager
    ) {
      return 'L1';
    }

    return 'L1';
  }

  private resolveStageLabel(status: ExpenseStatus, level: 'L1' | 'L2' | 'L3'): string {
    if (status === ExpenseStatus.Approved) {
      return level === 'L3' ? 'Final Approved' : `Approved by ${level}`;
    }

    if (status === ExpenseStatus.Rejected) {
      return `Rejected by ${level}`;
    }

    if (status === ExpenseStatus.Recommended) {
      return 'Recommended, pending admin';
    }

    if (status === ExpenseStatus.Draft) {
      return ExpenseStatus.Draft;
    }

    if (status === ExpenseStatus.OverBudget) {
      return ExpenseStatus.OverBudget;
    }

    return `Pending ${level}`;
  }
}
