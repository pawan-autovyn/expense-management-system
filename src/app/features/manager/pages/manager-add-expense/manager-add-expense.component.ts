import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { AuthService } from '../../../../core/services/auth.service';
import { DirectoryService } from '../../../../core/services/directory.service';
import { ExpenseRepositoryService } from '../../../../core/services/expense-repository.service';
import { ToastService } from '../../../../core/services/toast.service';
import { Attachment, ExpenseStatus, Role } from '../../../../models/app.models';
import { FileUploadComponent } from '../../../../shared/components/file-upload/file-upload.component';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { calculateCommittedSpend } from '../../../../shared/utils/expense.utils';

@Component({
  selector: 'app-manager-add-expense',
  standalone: true,
  imports: [
    CurrencyPipe,
    ReactiveFormsModule,
    FileUploadComponent,
    IconComponent,
  ],
  templateUrl: './manager-add-expense.component.html',
  styleUrl: './manager-add-expense.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManagerAddExpenseComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  protected readonly directoryService = inject(DirectoryService);
  private readonly expenseRepository = inject(ExpenseRepositoryService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly attachment = signal<Attachment | undefined>(undefined);
  protected readonly editingExpenseId = signal<string | null>(null);
  protected readonly isSubmitting = signal(false);
  protected readonly localValidationError = signal('');
  protected readonly budgetRejectDialogOpen = signal(false);
  protected readonly budgetRejectDialogMessage = signal('');
  protected readonly submitError = this.expenseRepository.mutationError;
  protected readonly form = this.formBuilder.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
    categoryId: ['', Validators.required],
    locationId: [this.directoryService.locations()[0]?.id ?? '', Validators.required],
    amount: [null as number | null, [Validators.required, Validators.min(1)]],
    date: [this.getTodayValue(), Validators.required],
    vendor: ['', Validators.required],
    tags: [''],
    description: ['', [Validators.required, Validators.minLength(8)]],
  });
  protected readonly locations = computed(() => this.directoryService.locations());
  protected readonly currentUser = this.authService.currentUser;
  protected readonly currentTags = computed(() =>
    (this.form.controls.tags.value ?? '')
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean),
  );
  protected readonly committedExpenses = computed(() => {
    const user = this.currentUser();

    if (!user) {
      return [];
    }

    return this.expenseRepository
      .getExpensesForManager(user.id)
      .filter((expense) => expense.id !== this.editingExpenseId());
  });
  protected readonly assignedBudget = computed(() => this.currentUser()?.assignedBudget ?? 0);
  protected readonly committedSpend = computed(() => calculateCommittedSpend(this.committedExpenses()));
  protected readonly remainingAssignedBudget = computed(() =>
    Math.max(this.assignedBudget() - this.committedSpend(), 0),
  );
  protected readonly budgetLockedMessage = computed(() =>
    this.remainingAssignedBudget() <= 0
      ? 'Your assigned budget has been fully used. You cannot raise a new bill until more budget is assigned.'
      : '',
  );
  protected readonly activeSubmitError = computed(
    () => this.localValidationError() || this.submitError() || '',
  );

  constructor() {
    const expenseId = this.route.snapshot.queryParamMap.get('edit');

    if (!expenseId) {
      return;
    }

    const expense = this.expenseRepository.getExpenseById(expenseId);

    if (!expense || ![ExpenseStatus.Draft, ExpenseStatus.Reopened].includes(expense.status)) {
      return;
    }

    this.editingExpenseId.set(expenseId);
    this.attachment.set(expense.receipt);
    this.form.patchValue({
      title: expense.title,
      categoryId: expense.categoryId,
      locationId: expense.locationId,
      amount: expense.amount,
      date: expense.date,
      vendor: expense.vendor,
      tags: expense.tags.join(', '),
      description: expense.description,
    });
  }

  protected async submit(): Promise<void> {
    await this.persistExpense(ExpenseStatus.Submitted);
  }

  protected closeBudgetRejectDialog(): void {
    this.budgetRejectDialogOpen.set(false);
  }

  private async persistExpense(mode: ExpenseStatus.Draft | ExpenseStatus.Submitted): Promise<void> {
    this.localValidationError.set('');

    if (this.form.invalid) {
      this.form.markAllAsTouched();

      return;
    }

    const user = this.authService.currentUser();

    if (!user) {
      return;
    }

    const payload = {
      title: this.form.controls.title.value ?? '',
      categoryId: this.form.controls.categoryId.value ?? '',
      locationId: this.form.controls.locationId.value ?? this.directoryService.locations()[0]?.id ?? '',
      amount: Number(this.form.controls.amount.value ?? 0),
      date: this.form.controls.date.value ?? '',
      vendor: this.form.controls.vendor.value ?? '',
      tags: (this.form.controls.tags.value ?? '')
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
      description: this.form.controls.description.value ?? '',
      receipt: this.attachment(),
    };
    const editingExpenseId = this.editingExpenseId();
    const remainingBudget = this.remainingAssignedBudget();

    if (remainingBudget <= 0) {
      const message = this.budgetLockedMessage();

      this.localValidationError.set(message);
      this.budgetRejectDialogMessage.set(message);
      this.budgetRejectDialogOpen.set(true);
      this.toastService.showError('Request rejected', message);

      return;
    }

    if (payload.amount > remainingBudget) {
      const message = `This bill exceeds your remaining budget of INR ${remainingBudget.toLocaleString('en-IN')}.`;

      this.localValidationError.set(message);
      this.budgetRejectDialogMessage.set(message);
      this.budgetRejectDialogOpen.set(true);
      this.toastService.showError('Request rejected', message);

      return;
    }

    this.isSubmitting.set(true);

    try {
      if (editingExpenseId) {
        await this.expenseRepository.updateDraft(editingExpenseId, payload, mode);
      } else {
        await this.expenseRepository.createExpense(payload, user, mode);
      }
    } catch {
      this.toastService.showError('Expense not saved', this.submitError() ?? 'Please try again.');
      this.isSubmitting.set(false);

      return;
    }

    const prefix =
      user.role === Role.OperationManager
        ? '/operation-manager'
        : user.role === Role.Admin
          ? '/admin'
          : '/recommender';
    const listRoute =
      user.role === Role.OperationManager
        ? 'expenses'
        : user.role === Role.Admin
          ? 'expenses'
          : 'expenses';

    this.isSubmitting.set(false);
    this.toastService.showSuccess(
      editingExpenseId ? 'Expense updated' : 'Expense submitted',
      editingExpenseId
        ? 'Your expense changes were saved successfully.'
        : 'Your bill was submitted into the approval workflow.',
    );
    void this.router.navigateByUrl(`${prefix}/${listRoute}`);
  }

  protected shouldShowError(
    controlName: 'title' | 'categoryId' | 'locationId' | 'amount' | 'date' | 'vendor' | 'description',
  ): boolean {
    const control = this.form.controls[controlName];

    return Boolean(control.invalid && (control.dirty || control.touched));
  }

  protected shouldWarnForAmount(): boolean {
    const amount = Number(this.form.controls.amount.value ?? 0);

    return Boolean(amount > 0 && this.remainingAssignedBudget() > 0 && amount > this.remainingAssignedBudget());
  }

  private getTodayValue(): string {
    return new Date().toISOString().slice(0, 10);
  }
}
