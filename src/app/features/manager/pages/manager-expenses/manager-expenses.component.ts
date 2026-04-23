import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';

import { AuthService } from '../../../../core/services/auth.service';
import { DirectoryService } from '../../../../core/services/directory.service';
import { ExpenseDialogService } from '../../../../core/services/expense-dialog.service';
import { ExpenseRepositoryService } from '../../../../core/services/expense-repository.service';
import { ExpenseStatus } from '../../../../models/app.models';
import { DataTableComponent, TableAction, TableColumn } from '../../../../shared/components/data-table/data-table.component';
import { ExpenseFilterBarComponent } from '../../../../shared/components/expense-filter-bar/expense-filter-bar.component';
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
}

@Component({
  selector: 'app-manager-expenses',
  standalone: true,
  imports: [
    DataTableComponent,
    ExpenseFilterBarComponent,
    IconComponent,
  ],
  templateUrl: './manager-expenses.component.html',
  styleUrl: './manager-expenses.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManagerExpensesComponent {
  private static readonly PAGE_SIZE = 8;
  private readonly authService = inject(AuthService);
  private readonly expenseDialogService = inject(ExpenseDialogService);
  protected readonly directoryService = inject(DirectoryService);
  private readonly expenseRepository = inject(ExpenseRepositoryService);
  protected readonly filters = signal({ ...DEFAULT_EXPENSE_FILTERS, managerId: 'all' });
  protected readonly page = signal(1);
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
      }),
    );
  });
  protected readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.rows().length / ManagerExpensesComponent.PAGE_SIZE)),
  );
  protected readonly visibleStatuses = [
    'Submitted',
    'Recommended',
    'Reopened',
    'Under Review',
    'Approved',
    'Rejected',
    'Cancelled',
    'Over Budget',
  ];
  protected readonly pagedRows = computed(() => {
    const start = (this.page() - 1) * ManagerExpensesComponent.PAGE_SIZE;

    return this.rows().slice(start, start + ManagerExpensesComponent.PAGE_SIZE);
  });

  protected readonly columns: TableColumn[] = [
    { key: 'title', label: 'Expense' },
    { key: 'category', label: 'Category' },
    { key: 'amount', label: 'Amount', type: 'currency', noWrap: true },
    { key: 'date', label: 'Date', type: 'date', noWrap: true },
    { key: 'status', label: 'Status', type: 'badge', noWrap: true },
  ];
  protected readonly actions: TableAction[] = [
    { id: 'view', label: 'View', icon: 'eye' },
    {
      id: 'edit',
      label: 'Edit',
      icon: 'edit',
      visible: (row) =>
        [ExpenseStatus.Draft, ExpenseStatus.Reopened].includes(
          (row as Record<string, unknown>)['status'] as ExpenseStatus,
        ),
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: 'trash',
      visible: (row) =>
        [ExpenseStatus.Draft, ExpenseStatus.Reopened].includes(
          (row as Record<string, unknown>)['status'] as ExpenseStatus,
        ),
    },
  ];
  protected readonly trackById = (row: unknown) => String((row as Record<string, unknown>)['id']);

  constructor() {
    effect(() => {
      const totalPages = this.totalPages();
      const currentPage = this.page();

      if (currentPage > totalPages) {
        this.page.set(totalPages);
      }
    });
  }

  protected handleAction(event: { actionId: string; row: unknown }): void {
    const row = event.row as unknown as MyExpenseRow;

    if (event.actionId === 'view') {
      this.expenseDialogService.openExpenseDialog({
        expenseId: row.id,
        mode: 'view',
        source: 'manager',
      });

      return;
    }

    if (event.actionId === 'edit') {
      this.expenseDialogService.openExpenseDialog({
        expenseId: row.id,
        mode: 'edit',
        source: 'manager',
      });

      return;
    }

    if (event.actionId === 'delete') {
      this.expenseDialogService.requestDelete(row.id, row.title);

      return;
    }
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

  protected previousPage(): void {
    this.page.set(Math.max(1, this.page() - 1));
  }

  protected nextPage(): void {
    this.page.set(Math.min(this.totalPages(), this.page() + 1));
  }

  protected updateFilters(filters: typeof DEFAULT_EXPENSE_FILTERS): void {
    this.filters.set(filters);
    this.page.set(1);
  }

}
