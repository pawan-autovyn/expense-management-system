import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AuthService } from '../../../../core/services/auth.service';
import { DirectoryService } from '../../../../core/services/directory.service';
import { ExpenseRepositoryService } from '../../../../core/services/expense-repository.service';
import { Attachment, ExpenseStatus } from '../../../../models/app.models';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { ReceiptPreviewModalComponent } from '../../../../shared/components/receipt-preview-modal/receipt-preview-modal.component';
import * as exportUtils from '../../../../shared/utils/export.utils';

interface ApprovalRow {
  id: string;
  expenseCode: string;
  title: string;
  amount: number;
  manager: string;
  status: string;
  level: 'L1' | 'L2' | 'L3';
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
  protected reviewNote = 'Approved in mock workflow after verifying uploaded bill and budget coverage.';
  protected readonly selectedId = signal<string | null>(null);
  protected readonly selectedReceipt = signal<Attachment | null>(null);
  protected readonly selectedTab = signal('all');

  protected readonly approvalRows = computed<ApprovalRow[]>(() =>
    this.expenseRepository
      .expenses()
      .map((expense, index) => {
        const level = this.resolveLevel(index, expense.status);

        return {
          id: expense.id,
          expenseCode: `EXP-${String(index + 2).padStart(3, '0')}`,
          title: expense.title,
          amount: expense.amount,
          manager: this.directoryService.getUserById(expense.managerId)?.name ?? 'Manager',
          status: this.resolveStageLabel(expense.status, level),
          level,
          category: this.directoryService.getCategoryById(expense.categoryId)?.name ?? 'Unknown',
          date: expense.date,
          vendor: expense.vendor,
        };
      }),
  );

  protected readonly approvalTabs = computed(() => [
    { label: 'All Pending', value: 'all' },
    { label: 'Pending L1', value: 'l1' },
    { label: 'Pending L2', value: 'l2' },
    { label: 'Pending L3', value: 'l3' },
    { label: 'Rejected', value: 'rejected' },
    { label: 'Approved', value: 'approved' },
  ]);

  protected readonly filteredRows = computed(() =>
    this.approvalRows().filter((row) => {
      if (this.selectedTab() === 'all') {
        return row.status.startsWith('Pending') || row.status === ExpenseStatus.OverBudget;
      }

      if (this.selectedTab() === 'rejected') {
        return row.status.startsWith('Rejected');
      }

      if (this.selectedTab() === 'approved') {
        return row.status.startsWith('Approved') || row.status === 'Final Approved';
      }

      return row.status === `Pending ${this.selectedTab().toUpperCase()}`;
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

    return [
      { label: 'Submitted', owner: row?.manager ?? 'Manager', state: 'Done', active: true },
      {
        label: 'L1 Review',
        owner: row?.level === 'L1' ? 'Priya M.' : 'Completed',
        state: row?.level === 'L1' ? 'Pending' : 'Done',
        active: true,
      },
      {
        label: 'L2 Review',
        owner: row?.level === 'L2' ? 'Pending' : 'Waiting',
        state: row?.level === 'L2' ? 'Pending' : 'Waiting',
        active: row?.level !== 'L1',
      },
      {
        label: 'L3 Final',
        owner: row?.level === 'L3' ? 'Pending' : 'Waiting',
        state: row?.level === 'L3' ? 'Pending' : 'Waiting',
        active: row?.level === 'L3',
      },
    ];
  });

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
      'Expense has been moved back into the review stream for mock reassessment.',
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

    const suffix = this.selectedTab() === 'all' ? 'all' : this.selectedTab();

    exportUtils.downloadCsv(`corework-approvals-${suffix}.csv`, csv);
  }

  private resolveLevel(index: number, status: ExpenseStatus): 'L1' | 'L2' | 'L3' {
    if (status === ExpenseStatus.OverBudget) {
      return 'L3';
    }

    return index % 3 === 0 ? 'L1' : index % 3 === 1 ? 'L2' : 'L3';
  }

  private resolveStageLabel(status: ExpenseStatus, level: 'L1' | 'L2' | 'L3'): string {
    if (status === ExpenseStatus.Approved) {
      return level === 'L3' ? 'Final Approved' : `Approved by ${level}`;
    }

    if (status === ExpenseStatus.Rejected) {
      return `Rejected by ${level}`;
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
