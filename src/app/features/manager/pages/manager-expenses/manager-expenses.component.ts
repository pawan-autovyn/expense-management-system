import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

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
  private static readonly PAGE_SIZE = 8;
  private readonly authService = inject(AuthService);
  protected readonly directoryService = inject(DirectoryService);
  private readonly expenseRepository = inject(ExpenseRepositoryService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  protected readonly filters = signal({ ...DEFAULT_EXPENSE_FILTERS, managerId: 'all' });
  protected readonly selectedReceipt = signal<Attachment | null>(null);
  protected readonly deleteDialogOpen = signal(false);
  protected readonly draftToDelete = signal<string | null>(null);
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
        receiptUrl: expense.receipt?.url,
      }),
    );
  });
  protected readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.rows().length / ManagerExpensesComponent.PAGE_SIZE)),
  );
  protected readonly pagedRows = computed(() => {
    const start = (this.page() - 1) * ManagerExpensesComponent.PAGE_SIZE;

    return this.rows().slice(start, start + ManagerExpensesComponent.PAGE_SIZE);
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
      id: 'edit',
      label: 'Edit',
      icon: 'edit',
      visible: (row) =>
        [ExpenseStatus.Draft, ExpenseStatus.Reopened].includes(
          (row as Record<string, unknown>)['status'] as ExpenseStatus,
        ),
    },
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

    if (event.actionId === 'view') {
      void this.router.navigate([this.resolveDetailRoute(), row.id]);

      return;
    }

    if (event.actionId === 'edit') {
      void this.router.navigate([this.resolveCreateRoute()], {
        queryParams: { edit: row.id },
      });

      return;
    }

    if (event.actionId === 'delete') {
      this.draftToDelete.set(row.id);
      this.deleteDialogOpen.set(true);

      return;
    }

    this.selectedReceipt.set(this.expenseRepository.getExpenseById(row.id)?.receipt ?? null);
  }

  protected async deleteDraft(): Promise<void> {
    const expenseId = this.draftToDelete();

    if (!expenseId) {
      return;
    }

    await this.expenseRepository.deleteDraft(expenseId);
    this.deleteDialogOpen.set(false);
    this.draftToDelete.set(null);
    this.page.set(Math.min(this.page(), this.totalPages()));
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

  private resolveBaseRoute(): string {
    const role = this.authService.currentUser()?.role;

    if (role === Role.Admin) {
      return '/admin';
    }

    if (role === Role.Recommender) {
      return '/recommender';
    }

    return '/operation-manager';
  }

  private resolveDetailRoute(): string {
    const currentPath = this.route.snapshot.routeConfig?.path ?? '';

    if (currentPath === 'my-expenses') {
      return `${this.resolveBaseRoute()}/my-expenses`;
    }

    return `${this.resolveBaseRoute()}/expenses`;
  }

  private resolveCreateRoute(): string {
    return `${this.resolveBaseRoute()}/add-expense`;
  }
}
