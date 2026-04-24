import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import {
  Attachment,
  ApprovalStage,
  Expense,
  ExpenseFormValue,
  ExpenseStatus,
  Role,
  User,
} from '../../models/app.models';
import { DEMO_EXPENSES } from '../../mock-data/demo-data';
import { cloneData } from '../../shared/utils/clone-data.util';
import { computeExpenseStatus } from '../../shared/utils/expense.utils';
import { API_CONFIG } from '../constants/api.constants';
import { STORAGE_KEYS } from '../constants/app.constants';
import { isKarmaTestEnvironment } from '../utils/runtime-mode.util';
import { DirectoryService } from './directory.service';

@Injectable({
  providedIn: 'root',
})
export class ExpenseRepositoryService {
  private readonly http = inject(HttpClient, { optional: true });
  private readonly expensesStore = signal<Expense[]>(this.restoreExpenses());
  private readonly mutationErrorStore = signal<string | null>(null);
  private readonly directoryService = inject(DirectoryService);

  readonly expenses = this.expensesStore.asReadonly();
  readonly mutationError = this.mutationErrorStore.asReadonly();
  readonly totalExpenseCount = computed(() => this.expenses().length);

  async loadExpenses(): Promise<Expense[]> {
    if (!this.http) {
      return this.expenses();
    }

    try {
      const expenses = await firstValueFrom(
        this.http.get<Expense[]>(`${API_CONFIG.baseUrl}/expenses`),
      );
      this.expensesStore.set(expenses);
      this.persist();

      return expenses;
    } catch {
      return this.expenses();
    }
  }

  getExpenseById(expenseId: string): Expense | undefined {
    return this.expenses().find((expense) => expense.id === expenseId);
  }

  async fetchExpenseById(expenseId: string): Promise<Expense | undefined> {
    if (!this.http) {
      return this.getExpenseById(expenseId);
    }

    try {
      const expense = await firstValueFrom(
        this.http.get<Expense>(`${API_CONFIG.baseUrl}/expenses/${expenseId}`),
      );
      this.replaceExpense(expenseId, expense);

      return expense;
    } catch {
      return this.getExpenseById(expenseId);
    }
  }

  getExpensesForManager(managerId: string): Expense[] {
    return this.expenses().filter((expense) => expense.managerId === managerId);
  }

  getExpensesForUser(userId: string): Expense[] {
    return this.expenses().filter(
      (expense) => expense.employeeId === userId || expense.managerId === userId,
    );
  }

  async approveExpense(
    expenseId: string,
    reviewer: User,
    note: string,
  ): Promise<Expense | undefined> {
    this.mutationErrorStore.set(null);

    if (this.http) {
      return this.syncAction(expenseId, reviewer.role === Role.Admin ? 'approve' : 'recommend', note);
    }

    const expense = this.getExpenseById(expenseId);

    if (!expense || [ExpenseStatus.Draft, ExpenseStatus.Cancelled].includes(expense.status)) {
      return undefined;
    }

    if (expense.status === ExpenseStatus.Approved || expense.status === ExpenseStatus.Rejected) {
      return expense;
    }

    const currentStage = expense.approvalStage ?? ApprovalStage.OperationManager;

    if (reviewer.role === Role.Recommender && currentStage === ApprovalStage.OperationManager) {
      const updatedExpense = this.updateExpenseWorkflow(expenseId, reviewer, note, {
        status: ExpenseStatus.Recommended,
        approvalStage: ApprovalStage.Recommender,
        action: 'Recommended by recommender',
        notePrefix: 'Recommendation completed and forwarded to admin.',
        tone: 'warning',
      });
      this.syncAction(expenseId, 'recommend', note);

      return updatedExpense;
    }

    if (
      reviewer.role === Role.Admin &&
      (currentStage === ApprovalStage.Recommender || expense.status === ExpenseStatus.Recommended)
    ) {
      const updatedExpense = this.updateExpenseWorkflow(expenseId, reviewer, note, {
        status: ExpenseStatus.Approved,
        approvalStage: ApprovalStage.Approver,
        action: 'Approved by admin',
        notePrefix: 'Final approval completed.',
        tone: 'success',
      });
      this.syncAction(expenseId, 'approve', note);

      return updatedExpense;
    }

    return expense;
  }

  async rejectExpense(
    expenseId: string,
    reviewer: User,
    note: string,
  ): Promise<Expense | undefined> {
    this.mutationErrorStore.set(null);

    if (this.http) {
      return this.syncAction(expenseId, 'reject', note);
    }

    return this.updateExpenseStatus(expenseId, ExpenseStatus.Rejected, reviewer, note, 'danger');
  }

  async reopenExpense(
    expenseId: string,
    reviewer: User,
    note: string,
  ): Promise<Expense | undefined> {
    this.mutationErrorStore.set(null);

    if (this.http) {
      return this.syncAction(expenseId, 'reopen', note);
    }

    return this.updateExpenseStatus(expenseId, ExpenseStatus.Reopened, reviewer, note, 'warning');
  }

  async cancelExpense(
    expenseId: string,
    reviewer: User,
    note: string,
  ): Promise<Expense | undefined> {
    this.mutationErrorStore.set(null);

    if (this.http) {
      return this.syncAction(expenseId, 'cancel', note);
    }

    return this.updateExpenseStatus(expenseId, ExpenseStatus.Cancelled, reviewer, note, 'danger');
  }

  async createExpense(
    value: ExpenseFormValue,
    manager: User,
    mode: ExpenseStatus.Draft | ExpenseStatus.Submitted,
  ): Promise<Expense> {
    this.mutationErrorStore.set(null);

    if (this.http) {
      return this.syncCreateExpense(value, mode);
    }

    const nextStatus = computeExpenseStatus(
      value.amount,
      value.categoryId,
      this.expenses(),
      this.directoryService.categories(),
      mode,
    );
    const timestamp = new Date().toISOString();
    const expense: Expense = {
      id: `tmp-${Date.now()}`,
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

  async updateDraft(
    expenseId: string,
    value: ExpenseFormValue,
    mode: ExpenseStatus.Draft | ExpenseStatus.Submitted,
  ): Promise<Expense | undefined> {
    this.mutationErrorStore.set(null);

    if (this.http) {
      return this.syncUpdateDraft(expenseId, value, mode);
    }

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

  async deleteDraft(expenseId: string): Promise<void> {
    this.mutationErrorStore.set(null);

    if (this.http) {
      await this.syncDeleteDraft(expenseId);
      this.expensesStore.update((expenses) => expenses.filter((expense) => expense.id !== expenseId));
      this.persist();

      return;
    }

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
    await this.syncDeleteDraft(expenseId);
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
      return isKarmaTestEnvironment() ? cloneData(DEMO_EXPENSES) : [];
    }

    try {
      return JSON.parse(value) as Expense[];
    } catch {
      localStorage.removeItem(STORAGE_KEYS.expenses);

      return isKarmaTestEnvironment() ? cloneData(DEMO_EXPENSES) : [];
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
              note: note ? `${workflow.notePrefix} ${note}` : workflow.notePrefix,
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

  private async syncCreateExpense(
    value: ExpenseFormValue,
    mode: ExpenseStatus.Draft | ExpenseStatus.Submitted,
  ): Promise<Expense> {
    if (!this.http) {
      throw new Error('HTTP client unavailable.');
    }

    try {
      const createdExpense = await firstValueFrom(
        this.http.post<Expense>(`${API_CONFIG.baseUrl}/expenses`, {
          ...value,
          mode,
        }),
      );
      this.replaceExpense(createdExpense.id, createdExpense);

      return createdExpense;
    } catch (error) {
      this.handleMutationError(error, 'Unable to create the expense right now.');
      throw error;
    }
  }

  private async syncAction(
    expenseId: string,
    action: 'recommend' | 'approve' | 'reject' | 'reopen' | 'cancel',
    note: string,
  ): Promise<Expense | undefined> {
    if (!this.http) {
      return this.getExpenseById(expenseId);
    }

    try {
      const updatedExpense = await firstValueFrom(
        this.http.post<Expense>(`${API_CONFIG.baseUrl}/expenses/${expenseId}/actions/${action}`, {
          note,
        }),
      );
      this.replaceExpense(expenseId, updatedExpense);

      return updatedExpense;
    } catch (error) {
      this.handleMutationError(error, 'Unable to update the approval workflow right now.');
      throw error;
    }
  }

  private async syncUpdateDraft(
    expenseId: string,
    value: ExpenseFormValue,
    mode: ExpenseStatus.Draft | ExpenseStatus.Submitted,
  ): Promise<Expense | undefined> {
    if (!this.http) {
      return this.getExpenseById(expenseId);
    }

    try {
      const updatedExpense = await firstValueFrom(
        this.http.patch<Expense>(`${API_CONFIG.baseUrl}/expenses/${expenseId}`, {
          ...value,
          mode,
        }),
      );
      this.replaceExpense(expenseId, updatedExpense);

      return updatedExpense;
    } catch (error) {
      this.handleMutationError(error, 'Unable to save the expense changes right now.');
      throw error;
    }
  }

  private async syncDeleteDraft(expenseId: string): Promise<void> {
    if (!this.http) {
      return;
    }

    try {
      await firstValueFrom(
        this.http.delete<Expense>(`${API_CONFIG.baseUrl}/expenses/${expenseId}`),
      );
    } catch (error) {
      this.handleMutationError(error, 'Unable to delete the draft right now.');
      throw error;
    }
  }

  private handleMutationError(error: unknown, fallbackMessage: string): void {
    if (error instanceof HttpErrorResponse) {
      const apiMessage = error.error?.message;

      if (typeof apiMessage === 'string' && apiMessage.trim()) {
        this.mutationErrorStore.set(apiMessage);

        return;
      }
    }

    if (error instanceof Error && error.message.trim()) {
      this.mutationErrorStore.set(error.message);

      return;
    }

    this.mutationErrorStore.set(fallbackMessage);
  }

  private replaceExpense(expenseId: string, expense: Expense): void {
    let found = false;

    this.expensesStore.update((expenses) =>
      expenses.map((entry) => {
        if (entry.id !== expenseId) {
          return entry;
        }

        found = true;

        return expense;
      }),
    );

    if (!found) {
      this.expensesStore.update((expenses) => [expense, ...expenses]);
    }

    this.persist();
  }
}
