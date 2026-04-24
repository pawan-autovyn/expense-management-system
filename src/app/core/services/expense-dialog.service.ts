import { Injectable, computed, inject, signal } from '@angular/core';

import { ExpenseRepositoryService } from './expense-repository.service';
import { ToastService } from './toast.service';

export interface ExpenseDialogRequest {
  expenseId: string;
  mode: 'view' | 'edit';
  source: 'manager' | 'admin';
  expenseCode?: string;
  budgetLabel?: string;
}

interface DeleteExpenseRequest {
  expenseId: string;
  expenseTitle: string;
}

@Injectable({
  providedIn: 'root',
})
export class ExpenseDialogService {
  private readonly expenseRepository = inject(ExpenseRepositoryService);
  private readonly toastService = inject(ToastService);
  private readonly dialogRequestStore = signal<ExpenseDialogRequest | null>(null);
  private readonly deleteRequestStore = signal<DeleteExpenseRequest | null>(null);

  readonly dialogRequest = this.dialogRequestStore.asReadonly();
  readonly deleteRequest = this.deleteRequestStore.asReadonly();
  readonly activeExpense = computed(() => {
    const request = this.dialogRequest();

    return request ? this.expenseRepository.getExpenseById(request.expenseId) ?? null : null;
  });
  readonly deleteDialogOpen = computed(() => Boolean(this.deleteRequest()));
  readonly deleteDialogMessage = computed(() => {
    const request = this.deleteRequest();

    if (!request) {
      return 'Delete this expense from your workspace?';
    }

    const expenseTitle =
      this.expenseRepository.getExpenseById(request.expenseId)?.title ?? request.expenseTitle;

    return `Delete ${expenseTitle}? This action cannot be undone.`;
  });

  openExpenseDialog(request: ExpenseDialogRequest): void {
    this.deleteRequestStore.set(null);
    this.dialogRequestStore.set(request);
    void this.expenseRepository.fetchExpenseById(request.expenseId);
  }

  closeExpenseDialog(): void {
    this.dialogRequestStore.set(null);
  }

  requestDelete(expenseId: string, expenseTitle: string): void {
    this.deleteRequestStore.set({
      expenseId,
      expenseTitle,
    });
  }

  cancelDelete(): void {
    this.deleteRequestStore.set(null);
  }

  async confirmDelete(): Promise<void> {
    const request = this.deleteRequest();

    if (!request) {
      return;
    }

    try {
      await this.expenseRepository.deleteDraft(request.expenseId);

      if (this.dialogRequest()?.expenseId === request.expenseId) {
        this.closeExpenseDialog();
      }

      this.toastService.showSuccess(
        'Expense deleted',
        'The expense record was removed successfully.',
      );
    } catch {
      this.toastService.showError(
        'Delete failed',
        this.expenseRepository.mutationError() ?? 'The expense could not be deleted.',
      );
    } finally {
      this.deleteRequestStore.set(null);
    }
  }
}
