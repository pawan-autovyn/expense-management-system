import { Injectable, computed, inject, signal } from '@angular/core';

import { DEMO_EXPENSES } from '../../mock-data/demo-data';
import {
  Attachment,
  Expense,
  ExpenseFormValue,
  ExpenseStatus,
  Role,
  User,
} from '../../models/app.models';
import { computeExpenseStatus } from '../../shared/utils/expense.utils';
import { STORAGE_KEYS } from '../constants/app.constants';
import { DirectoryService } from './directory.service';

@Injectable({
  providedIn: 'root',
})
export class ExpenseRepositoryService {
  private readonly expensesStore = signal<Expense[]>(this.restoreExpenses());
  private readonly directoryService = inject(DirectoryService);

  readonly expenses = this.expensesStore.asReadonly();
  readonly totalExpenseCount = computed(() => this.expenses().length);

  getExpenseById(expenseId: string): Expense | undefined {
    return this.expenses().find((expense) => expense.id === expenseId);
  }

  getExpensesForManager(managerId: string): Expense[] {
    return this.expenses().filter((expense) => expense.managerId === managerId);
  }

  approveExpense(expenseId: string, reviewer: User, note: string): Expense | undefined {
    return this.updateExpenseStatus(expenseId, ExpenseStatus.Approved, reviewer, note, 'success');
  }

  rejectExpense(expenseId: string, reviewer: User, note: string): Expense | undefined {
    return this.updateExpenseStatus(expenseId, ExpenseStatus.Rejected, reviewer, note, 'danger');
  }

  reopenExpense(expenseId: string, reviewer: User, note: string): Expense | undefined {
    return this.updateExpenseStatus(expenseId, ExpenseStatus.UnderReview, reviewer, note, 'warning');
  }

  createExpense(
    value: ExpenseFormValue,
    manager: User,
    mode: ExpenseStatus.Draft | ExpenseStatus.Submitted,
  ): Expense {
    const nextStatus = computeExpenseStatus(
      value.amount,
      value.categoryId,
      this.expenses(),
      this.directoryService.categories(),
      mode,
    );
    const timestamp = new Date().toISOString();
    const expense: Expense = {
      id: `exp-${Date.now()}`,
      title: value.title,
      categoryId: value.categoryId,
      amount: value.amount,
      date: value.date,
      description: value.description,
      vendor: value.vendor,
      tags: value.tags,
      managerId: manager.id,
      status: nextStatus,
      createdAt: timestamp,
      updatedAt: timestamp,
      receipt: value.receipt,
      auditTrail: [
        {
          id: `audit-${Date.now()}`,
          action: mode === ExpenseStatus.Draft ? 'Draft saved' : 'Expense submitted',
          actor: manager.name,
          actorRole: Role.OperationManager,
          date: timestamp,
          note:
            mode === ExpenseStatus.Draft
              ? 'Saved locally for later review.'
              : 'Submitted into mock approval workflow.',
          tone: mode === ExpenseStatus.Draft ? 'info' : 'success',
        },
      ],
    };

    this.expensesStore.update((expenses) => [expense, ...expenses]);
    this.persist();

    return expense;
  }

  updateDraft(
    expenseId: string,
    value: ExpenseFormValue,
    mode: ExpenseStatus.Draft | ExpenseStatus.Submitted,
  ): Expense | undefined {
    const categories = this.directoryService.categories();
    let updatedExpense: Expense | undefined;

    this.expensesStore.update((expenses) =>
      expenses.map((expense) => {
        if (expense.id !== expenseId || expense.status !== ExpenseStatus.Draft) {
          return expense;
        }

        const timestamp = new Date().toISOString();
        const nextStatus = computeExpenseStatus(
          value.amount,
          value.categoryId,
          expenses.filter((entry) => entry.id !== expenseId),
          categories,
          mode,
        );
        updatedExpense = {
          ...expense,
          ...value,
          status: nextStatus,
          updatedAt: timestamp,
          auditTrail: [
            {
              id: `audit-${Date.now()}`,
              action: mode === ExpenseStatus.Draft ? 'Draft updated' : 'Draft submitted',
              actor: expense.auditTrail[0]?.actor ?? 'Operation Manager',
              actorRole: Role.OperationManager,
              date: timestamp,
              note: 'Local mock record updated.',
              tone: 'info',
            },
            ...expense.auditTrail,
          ],
        };

        return updatedExpense;
      }),
    );

    this.persist();

    return updatedExpense;
  }

  deleteDraft(expenseId: string): void {
    this.expensesStore.update((expenses) =>
      expenses.filter(
        (expense) => !(expense.id === expenseId && expense.status === ExpenseStatus.Draft),
      ),
    );
    this.persist();
  }

  attachReceipt(name: string, dataUrl: string): Attachment {
    return {
      id: `att-${Date.now()}`,
      name,
      url: dataUrl,
      mimeType: 'image/*',
    };
  }

  private restoreExpenses(): Expense[] {
    const value = localStorage.getItem(STORAGE_KEYS.expenses);

    if (!value) {
      return DEMO_EXPENSES;
    }

    try {
      return JSON.parse(value) as Expense[];
    } catch {
      localStorage.removeItem(STORAGE_KEYS.expenses);

      return DEMO_EXPENSES;
    }
  }

  private persist(): void {
    localStorage.setItem(STORAGE_KEYS.expenses, JSON.stringify(this.expenses()));
  }

  private updateExpenseStatus(
    expenseId: string,
    status: ExpenseStatus,
    reviewer: User,
    note: string,
    tone: 'success' | 'danger' | 'warning',
  ): Expense | undefined {
    let updatedExpense: Expense | undefined;
    const timestamp = new Date().toISOString();

    this.expensesStore.update((expenses) =>
      expenses.map((expense) => {
        if (expense.id !== expenseId) {
          return expense;
        }

        updatedExpense = {
          ...expense,
          status,
          updatedAt: timestamp,
          auditTrail: [
            {
              id: `audit-${Date.now()}`,
              action:
                status === ExpenseStatus.Approved
                  ? 'Approved by finance'
                  : status === ExpenseStatus.Rejected
                    ? 'Rejected by finance'
                    : 'Re-opened for review',
              actor: reviewer.name,
              actorRole: reviewer.role,
              date: timestamp,
              note,
              tone,
            },
            ...expense.auditTrail,
          ],
        };

        return updatedExpense;
      }),
    );

    this.persist();

    return updatedExpense;
  }
}
