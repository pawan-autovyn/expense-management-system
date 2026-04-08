import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { DirectoryService } from '../../../../core/services/directory.service';
import { ExpenseRepositoryService } from '../../../../core/services/expense-repository.service';
import { DataTableComponent, TableAction, TableColumn } from '../../../../shared/components/data-table/data-table.component';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { ReceiptPreviewModalComponent } from '../../../../shared/components/receipt-preview-modal/receipt-preview-modal.component';
import {
  DEFAULT_EXPENSE_FILTERS,
  buildCategoryBudgetViews,
  filterExpenses,
} from '../../../../shared/utils/expense.utils';
import { buildCsvContent, downloadCsv } from '../../../../shared/utils/export.utils';
import { Expense } from '../../../../models/app.models';

interface ExpenseRow {
  id: string;
  expenseCode: string;
  title: string;
  manager: string;
  category: string;
  amount: number;
  date: string;
  status: string;
  budget: string;
  receiptUrl?: string;
}

@Component({
  selector: 'app-admin-expenses',
  standalone: true,
  imports: [FormsModule, DataTableComponent, IconComponent, ReceiptPreviewModalComponent],
  templateUrl: './admin-expenses.component.html',
  styleUrl: './admin-expenses.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminExpensesComponent {
  protected readonly directoryService = inject(DirectoryService);
  private readonly expenseRepository = inject(ExpenseRepositoryService);
  private readonly router = inject(Router);
  protected readonly filters = signal({ ...DEFAULT_EXPENSE_FILTERS });
  protected readonly selectedReceipt = signal<Expense['receipt'] | null>(null);
  protected readonly budgetFilter = signal('all');
  protected readonly managerUsers = computed(() =>
    this.directoryService.users().filter((user) => user.role !== 'admin'),
  );
  protected readonly budgetMap = computed(() => {
    const entries = buildCategoryBudgetViews(
      this.directoryService.categories(),
      this.expenseRepository.expenses(),
    );

    return new Map(entries.map((entry) => [entry.category.id, entry.status]));
  });
  protected readonly rows = computed<ExpenseRow[]>(() =>
    filterExpenses(this.expenseRepository.expenses(), this.filters())
      .map((expense, index) => ({
        id: expense.id,
        expenseCode: `EXP-${String(index + 1).padStart(3, '0')}`,
        title: expense.title,
        manager: this.directoryService.getUserById(expense.managerId)?.name ?? 'Unknown',
        category: this.directoryService.getCategoryById(expense.categoryId)?.name ?? 'Unknown',
        amount: expense.amount,
        date: expense.date,
        status: expense.status,
        budget: this.budgetMap().get(expense.categoryId) ?? 'Within Budget',
        receiptUrl: expense.receipt?.url,
      }))
      .filter((row) => this.budgetFilter() === 'all' || row.budget === this.budgetFilter()),
  );

  protected readonly columns: TableColumn[] = [
    { key: 'expenseCode', label: 'ID' },
    { key: 'title', label: 'Title' },
    { key: 'category', label: 'Category' },
    { key: 'amount', label: 'Amount', type: 'currency' },
    { key: 'date', label: 'Date', type: 'date' },
    { key: 'manager', label: 'Manager' },
    { key: 'status', label: 'Status', type: 'badge' },
    { key: 'budget', label: 'Budget', type: 'badge' },
  ];

  protected readonly actions: TableAction[] = [
    { id: 'view', label: 'View', icon: 'eye' },
    { id: 'edit', label: 'Edit', icon: 'pencil' },
    { id: 'delete', label: 'Delete', icon: 'trash' },
    {
      id: 'receipt',
      label: 'Bill',
      icon: 'receipt',
      visible: (row) => Boolean((row as Record<string, unknown>)['receiptUrl']),
    },
  ];

  protected readonly trackById = (row: unknown) => String((row as Record<string, unknown>)['id']);

  protected handleAction(event: { actionId: string; row: unknown }): void {
    const row = event.row as unknown as ExpenseRow;

    if (event.actionId === 'view' || event.actionId === 'edit') {
      void this.router.navigate(['/admin/expenses', row.id]);

      return;
    }

    if (event.actionId === 'delete') {
      return;
    }

    const record = this.expenseRepository.getExpenseById(row.id);
    this.selectedReceipt.set(record?.receipt ?? null);
  }

  protected patchFilter(key: string, value: string): void {
    this.filters.update((filters) => ({
      ...filters,
      [key]: value,
    }));
  }

  protected patchBudgetFilter(value: string): void {
    this.budgetFilter.set(value);
  }

  protected resetFilters(): void {
    this.filters.set({ ...DEFAULT_EXPENSE_FILTERS });
    this.budgetFilter.set('all');
  }

  protected exportVisibleRows(): void {
    const csv = buildCsvContent(this.rows(), [
      { label: 'ID', key: 'expenseCode' },
      { label: 'Title', key: 'title' },
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
      { label: 'Manager', key: 'manager' },
      { label: 'Status', key: 'status' },
      { label: 'Budget', key: 'budget' },
    ]);

    downloadCsv('expenses.csv', csv);
  }
}
