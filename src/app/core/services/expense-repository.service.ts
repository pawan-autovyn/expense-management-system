import { Injectable, computed, inject, signal } from '@angular/core';

import { DEMO_EXPENSES } from '../../mock-data/demo-data';
import {
  Attachment,
  ApprovalStage,
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

  getExpensesForUser(userId: string): Expense[] {
    return this.expenses().filter(
      (expense) => expense.employeeId === userId || expense.managerId === userId,
    );
  }

  approveExpense(expenseId: string, reviewer: User, note: string): Expense | undefined {
    const expense = this.getExpenseById(expenseId);

    if (!expense || [ExpenseStatus.Draft, ExpenseStatus.Cancelled].includes(expense.status)) {
      return undefined;
    }

    if (expense.status === ExpenseStatus.Approved || expense.status === ExpenseStatus.Rejected) {
      return expense;
    }

    const currentStage = expense.approvalStage ?? ApprovalStage.OperationManager;

    if (reviewer.role === Role.Recommender && currentStage === ApprovalStage.OperationManager) {
      return this.updateExpenseWorkflow(expenseId, reviewer, note, {
        status: ExpenseStatus.Recommended,
        approvalStage: ApprovalStage.Recommender,
        action: 'Recommended by recommender',
        notePrefix: 'Recommendation completed and forwarded to admin.',
        tone: 'warning',
      });
    }

    if (
      reviewer.role === Role.Admin &&
      (currentStage === ApprovalStage.Recommender || expense.status === ExpenseStatus.Recommended)
    ) {
      return this.updateExpenseWorkflow(expenseId, reviewer, note, {
        status: ExpenseStatus.Approved,
        approvalStage: ApprovalStage.Approver,
        action: 'Approved by admin',
        notePrefix: 'Final approval completed.',
        tone: 'success',
      });
    }

    return expense;
  }

  rejectExpense(expenseId: string, reviewer: User, note: string): Expense | undefined {
    return this.updateExpenseStatus(expenseId, ExpenseStatus.Rejected, reviewer, note, 'danger');
  }

  reopenExpense(expenseId: string, reviewer: User, note: string): Expense | undefined {
    return this.updateExpenseStatus(expenseId, ExpenseStatus.Reopened, reviewer, note, 'warning');
  }

  cancelExpense(expenseId: string, reviewer: User, note: string): Expense | undefined {
    return this.updateExpenseStatus(expenseId, ExpenseStatus.Cancelled, reviewer, note, 'danger');
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
      locationId: value.locationId,
      employeeId: manager.id,
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
      approvalStage: ApprovalStage.OperationManager,
      auditTrail: [
        {
          id: `audit-${Date.now()}`,
          action: mode === ExpenseStatus.Draft ? 'Draft saved' : 'Expense submitted',
          actor: manager.name,
          actorRole: manager.role,
          date: timestamp,
            note:
              mode === ExpenseStatus.Draft
                ? 'Saved locally for later review.'
              : 'Submitted into the approval workflow.',
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
        if (
          expense.id !== expenseId ||
          ![ExpenseStatus.Draft, ExpenseStatus.Reopened].includes(expense.status)
        ) {
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
          approvalStage: ApprovalStage.OperationManager,
          updatedAt: timestamp,
          auditTrail: [
            {
              id: `audit-${Date.now()}`,
              action: mode === ExpenseStatus.Draft ? 'Draft updated' : 'Draft submitted',
              actor: expense.auditTrail[0]?.actor ?? 'Operation Manager',
              actorRole: expense.auditTrail[0]?.actorRole ?? Role.OperationManager,
              date: timestamp,
              note: 'Local record updated.',
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
        (expense) =>
          !(
            expense.id === expenseId &&
            [ExpenseStatus.Draft, ExpenseStatus.Reopened].includes(expense.status)
          ),
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
          approvalStage:
            status === ExpenseStatus.Reopened ? ApprovalStage.OperationManager : expense.approvalStage,
          updatedAt: timestamp,
          auditTrail: [
            {
              id: `audit-${Date.now()}`,
              action:
                status === ExpenseStatus.Approved
                  ? 'Final approved'
                  : status === ExpenseStatus.Rejected
                    ? 'Rejected by admin'
                    : status === ExpenseStatus.Cancelled
                      ? 'Cancelled by operation manager'
                      : 'Reopened for review',
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

  private updateExpenseWorkflow(
    expenseId: string,
    reviewer: User,
    note: string,
    workflow: {
      status: ExpenseStatus;
      approvalStage: ApprovalStage;
      action: string;
      notePrefix: string;
      tone: 'success' | 'danger' | 'warning' | 'info';
    },
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
          status: workflow.status,
          approvalStage: workflow.approvalStage,
          updatedAt: timestamp,
          auditTrail: [
            {
              id: `audit-${Date.now()}`,
              action: workflow.action,
              actor: reviewer.name,
              actorRole: reviewer.role,
              date: timestamp,
              note: `${workflow.notePrefix} ${note}`.trim(),
              tone: workflow.tone,
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
