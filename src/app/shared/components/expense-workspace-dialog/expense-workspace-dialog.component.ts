import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { DirectoryService } from '../../../core/services/directory.service';
import { ExpenseDialogService } from '../../../core/services/expense-dialog.service';
import { ExpenseRepositoryService } from '../../../core/services/expense-repository.service';
import { ToastService } from '../../../core/services/toast.service';
import { Attachment, ExpenseFormValue, ExpenseStatus } from '../../../models/app.models';
import { FileUploadComponent } from '../file-upload/file-upload.component';
import { IconComponent } from '../icon/icon.component';
import { StatusBadgeComponent } from '../status-badge/status-badge.component';

@Component({
  selector: 'app-expense-workspace-dialog',
  standalone: true,
  imports: [
    CurrencyPipe,
    DatePipe,
    FileUploadComponent,
    IconComponent,
    ReactiveFormsModule,
    StatusBadgeComponent,
  ],
  templateUrl: './expense-workspace-dialog.component.html',
  styleUrl: './expense-workspace-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExpenseWorkspaceDialogComponent {
  private readonly formBuilder = inject(FormBuilder);
  protected readonly dialogService = inject(ExpenseDialogService);
  protected readonly directoryService = inject(DirectoryService);
  private readonly expenseRepository = inject(ExpenseRepositoryService);
  private readonly toastService = inject(ToastService);

  protected readonly mutationError = this.expenseRepository.mutationError;
  protected readonly dialogRequest = this.dialogService.dialogRequest;
  protected readonly activeExpense = this.dialogService.activeExpense;
  protected readonly dialogAttachment = signal<Attachment | undefined>(undefined);
  protected readonly isDialogSaving = signal(false);
  protected readonly expenseForm = this.formBuilder.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
    categoryId: ['', Validators.required],
    locationId: ['', Validators.required],
    amount: [null as number | null, [Validators.required, Validators.min(1)]],
    date: ['', Validators.required],
    vendor: ['', Validators.required],
    tags: [''],
    description: ['', [Validators.required, Validators.minLength(8)]],
  });
  protected readonly isOpen = computed(
    () => Boolean(this.dialogRequest() && this.activeExpense()),
  );
  protected readonly isEditMode = computed(() => this.dialogRequest()?.mode === 'edit');
  protected readonly isAdminContext = computed(() => this.dialogRequest()?.source === 'admin');
  protected readonly dialogTitle = computed(() =>
    this.isEditMode() ? 'Update expense' : 'Expense details',
  );
  protected readonly dialogEyebrow = computed(() => {
    if (this.isEditMode()) {
      return 'Editable record';
    }

    return this.isAdminContext() ? 'Expense register' : 'Expense snapshot';
  });
  protected readonly dialogTags = computed(() =>
    (this.expenseForm.controls.tags.value ?? '')
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean),
  );
  protected readonly selectedExpenseAudit = computed(
    () => this.activeExpense()?.auditTrail ?? [],
  );
  protected readonly expenseCode = computed(
    () => this.dialogRequest()?.expenseCode ?? this.activeExpense()?.id ?? '',
  );
  protected readonly budgetLabel = computed(
    () => this.dialogRequest()?.budgetLabel ?? 'Within Budget',
  );
  protected readonly managerName = computed(() => {
    const expense = this.activeExpense();

    return expense
      ? this.directoryService.getUserById(expense.managerId)?.name ?? 'Unknown manager'
      : 'Unknown manager';
  });

  constructor() {
    effect(() => {
      const expense = this.activeExpense();

      if (!expense) {
        this.dialogAttachment.set(undefined);
        this.expenseForm.reset(this.getEmptyFormValue());

        return;
      }

      this.dialogAttachment.set(expense.receipt);
      this.expenseForm.reset({
        title: expense.title,
        categoryId: expense.categoryId,
        locationId: expense.locationId ?? this.directoryService.locations()[0]?.id ?? '',
        amount: expense.amount,
        date: expense.date,
        vendor: expense.vendor,
        tags: expense.tags.join(', '),
        description: expense.description,
      });
    });
  }

  protected closeDialog(): void {
    this.dialogService.closeExpenseDialog();
  }

  protected shouldShowError(
    controlName: 'title' | 'categoryId' | 'locationId' | 'amount' | 'date' | 'vendor' | 'description',
  ): boolean {
    const control = this.expenseForm.controls[controlName];

    return Boolean(control.invalid && (control.dirty || control.touched));
  }

  protected getCategoryName(categoryId: string): string {
    return this.directoryService.getCategoryById(categoryId)?.name ?? 'Unknown';
  }

  protected getLocationName(locationId: string | undefined): string {
    return this.directoryService.getLocationById(locationId ?? '')?.name ?? 'Head Office';
  }

  protected async saveExpenseChanges(): Promise<void> {
    const expense = this.activeExpense();

    if (!expense || !this.isEditMode()) {
      return;
    }

    if (this.expenseForm.invalid) {
      this.expenseForm.markAllAsTouched();

      return;
    }

    const payload: ExpenseFormValue = {
      title: this.expenseForm.controls.title.value ?? '',
      categoryId: this.expenseForm.controls.categoryId.value ?? '',
      locationId:
        this.expenseForm.controls.locationId.value ?? this.directoryService.locations()[0]?.id ?? '',
      amount: Number(this.expenseForm.controls.amount.value ?? 0),
      date: this.expenseForm.controls.date.value ?? '',
      vendor: this.expenseForm.controls.vendor.value ?? '',
      tags: (this.expenseForm.controls.tags.value ?? '')
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
      description: this.expenseForm.controls.description.value ?? '',
      receipt: this.dialogAttachment(),
    };

    this.isDialogSaving.set(true);

    try {
      await this.expenseRepository.updateDraft(expense.id, payload, ExpenseStatus.Submitted);
      this.toastService.showSuccess(
        'Expense updated',
        'Your changes were saved and moved back into the approval workflow.',
      );
      this.closeDialog();
    } catch {
      this.toastService.showError(
        'Update failed',
        this.expenseRepository.mutationError() ?? 'The expense changes could not be saved.',
      );
    } finally {
      this.isDialogSaving.set(false);
    }
  }

  private getEmptyFormValue() {
    return {
      title: '',
      categoryId: '',
      locationId: this.directoryService.locations()[0]?.id ?? '',
      amount: null,
      date: '',
      vendor: '',
      tags: '',
      description: '',
    };
  }
}
