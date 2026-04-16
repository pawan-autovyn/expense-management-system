import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import { AuthService } from '../../../../core/services/auth.service';
import { DirectoryService } from '../../../../core/services/directory.service';
import { ExpenseRepositoryService } from '../../../../core/services/expense-repository.service';
import { Attachment, ExpenseStatus, Role } from '../../../../models/app.models';
import { DataTableComponent, TableAction, TableColumn } from '../../../../shared/components/data-table/data-table.component';
import { ExpenseFilterBarComponent } from '../../../../shared/components/expense-filter-bar/expense-filter-bar.component';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { ReceiptPreviewModalComponent } from '../../../../shared/components/receipt-preview-modal/receipt-preview-modal.component';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { DEFAULT_EXPENSE_FILTERS, filterExpenses } from '../../../../shared/utils/expense.utils';
import { buildCsvContent, downloadCsv } from '../../../../shared/utils/export.utils';

interface MyExpenseRow {
  id: string;
  title: string;
  category: string;
  amount: number;
  date: string;
  status: string;
  receiptUrl?: string;
}

@Component({
  selector: 'app-manager-expenses',
  standalone: true,
  imports: [
    ConfirmDialogComponent,
    DataTableComponent,
    ExpenseFilterBarComponent,
    ReceiptPreviewModalComponent,
    IconComponent,
  ],
  templateUrl: './manager-expenses.component.html',
  styleUrl: './manager-expenses.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManagerExpensesComponent {
  private readonly authService = inject(AuthService);
  protected readonly directoryService = inject(DirectoryService);
  private readonly expenseRepository = inject(ExpenseRepositoryService);
  private readonly router = inject(Router);
  protected readonly filters = signal({ ...DEFAULT_EXPENSE_FILTERS, managerId: 'all' });
  protected readonly selectedReceipt = signal<Attachment | null>(null);
  protected readonly deleteDialogOpen = signal(false);
  protected readonly draftToDelete = signal<string | null>(null);
  protected readonly rows = computed<MyExpenseRow[]>(() => {
    const managerId = this.authService.currentUser()?.id ?? '';

    return filterExpenses(this.expenseRepository.getExpensesForManager(managerId), this.filters()).map(
      (expense) => ({
        id: expense.id,
        title: expense.title,
        category: this.directoryService.getCategoryById(expense.categoryId)?.name ?? 'Unknown',
        amount: expense.amount,
        date: expense.date,
        status: expense.status,
        receiptUrl: expense.receipt?.url,
      }),
    );
  });

  protected readonly columns: TableColumn[] = [
    { key: 'title', label: 'Expense' },
    { key: 'category', label: 'Category' },
    { key: 'amount', label: 'Amount', type: 'currency' },
    { key: 'date', label: 'Date', type: 'date' },
    { key: 'status', label: 'Status', type: 'badge' },
  ];
  protected readonly actions: TableAction[] = [
    { id: 'view', label: 'View', icon: 'eye' },
    {
      id: 'receipt',
      label: 'Bill',
      icon: 'receipt',
      visible: (row) => Boolean((row as Record<string, unknown>)['receiptUrl']),
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: 'trash',
      visible: (row) => (row as Record<string, unknown>)['status'] === ExpenseStatus.Draft,
    },
  ];
  protected readonly trackById = (row: unknown) => String((row as Record<string, unknown>)['id']);

  protected handleAction(event: { actionId: string; row: unknown }): void {
    const row = event.row as unknown as MyExpenseRow;
    const currentUser = this.authService.currentUser();
    const listRoute =
      currentUser?.role === Role.OperationManager
        ? '/operation-manager/my-expenses'
        : '/operation-manager/expenses';

    if (event.actionId === 'view') {
      void this.router.navigate([listRoute, row.id]);

      return;
    }

    if (event.actionId === 'delete') {
      this.draftToDelete.set(row.id);
      this.deleteDialogOpen.set(true);

      return;
    }

    this.selectedReceipt.set(this.expenseRepository.getExpenseById(row.id)?.receipt ?? null);
  }

  protected deleteDraft(): void {
    const expenseId = this.draftToDelete();

    if (!expenseId) {
      return;
    }

    this.expenseRepository.deleteDraft(expenseId);
    this.deleteDialogOpen.set(false);
    this.draftToDelete.set(null);
  }

  protected exportVisibleRows(): void {
    const csv = buildCsvContent(this.rows(), [
      { label: 'ID', key: 'id' },
      { label: 'Expense', key: 'title' },
      { label: 'Category', key: 'category' },
      {
        label: 'Amount',
        getValue: (row) =>
          row.amount.toLocaleString('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
          }),
      },
      { label: 'Date', key: 'date' },
      { label: 'Status', key: 'status' },
    ]);

    downloadCsv('my-expenses.csv', csv);
  }
}
