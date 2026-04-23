import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { AuthService } from '../../../../core/services/auth.service';
import { DirectoryService } from '../../../../core/services/directory.service';
import { ExpenseRepositoryService } from '../../../../core/services/expense-repository.service';
import { Attachment, ExpenseStatus, Role } from '../../../../models/app.models';
import { FileUploadComponent } from '../../../../shared/components/file-upload/file-upload.component';
import { IconComponent } from '../../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-manager-add-expense',
  standalone: true,
  imports: [
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
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly attachment = signal<Attachment | undefined>(undefined);
  protected readonly editingExpenseId = signal<string | null>(null);
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
  protected readonly currentTags = computed(() =>
    (this.form.controls.tags.value ?? '')
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean),
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

  protected submit(): void {
    this.persistExpense(ExpenseStatus.Submitted);
  }

  private persistExpense(mode: ExpenseStatus.Draft | ExpenseStatus.Submitted): void {
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

    if (editingExpenseId) {
      this.expenseRepository.updateDraft(editingExpenseId, payload, mode);
    } else {
      this.expenseRepository.createExpense(payload, user, mode);
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

    void this.router.navigateByUrl(`${prefix}/${listRoute}`);
  }

  protected shouldShowError(
    controlName: 'title' | 'categoryId' | 'locationId' | 'amount' | 'date' | 'vendor' | 'description',
  ): boolean {
    const control = this.form.controls[controlName];

    return Boolean(control.invalid && (control.dirty || control.touched));
  }

  private getTodayValue(): string {
    return new Date().toISOString().slice(0, 10);
  }
}
