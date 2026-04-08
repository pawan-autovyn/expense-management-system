import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../../../../core/services/auth.service';
import { DirectoryService } from '../../../../core/services/directory.service';
import { ExpenseRepositoryService } from '../../../../core/services/expense-repository.service';
import { Attachment, BudgetStatus, ExpenseStatus } from '../../../../models/app.models';
import { FileUploadComponent } from '../../../../shared/components/file-upload/file-upload.component';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { buildCategoryBudgetViews, resolveBudgetStatus } from '../../../../shared/utils/expense.utils';

@Component({
  selector: 'app-manager-add-expense',
  standalone: true,
  imports: [
    CurrencyPipe,
    ReactiveFormsModule,
    FileUploadComponent,
    IconComponent,
    StatusBadgeComponent,
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

  protected readonly attachment = signal<Attachment | undefined>(undefined);
  protected readonly form = this.formBuilder.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
    categoryId: ['', Validators.required],
    amount: [null as number | null, [Validators.required, Validators.min(1)]],
    date: ['2026-04-06', Validators.required],
    vendor: ['', Validators.required],
    tags: [''],
    description: ['', [Validators.required, Validators.minLength(8)]],
  });
  protected readonly categoryViews = computed(() =>
    buildCategoryBudgetViews(
      this.directoryService.categories(),
      this.expenseRepository.expenses(),
      this.authService.currentUser()?.id,
    ),
  );
  protected readonly selectedCategoryView = computed(() =>
    this.categoryViews().find((item) => item.category.id === this.form.controls.categoryId.value),
  );
  protected readonly budgetStatus = computed(() =>
    this.resolveStatusLabel(
      resolveBudgetStatus(
        (this.selectedCategoryView()?.spend ?? 0) + Number(this.form.controls.amount.value ?? 0),
        this.selectedCategoryView()?.category.monthlyBudget ?? 0,
      ),
    ),
  );
  protected readonly remainingAfterThisExpense = computed(() =>
    (this.selectedCategoryView()?.category.monthlyBudget ?? 0) -
    ((this.selectedCategoryView()?.spend ?? 0) + Number(this.form.controls.amount.value ?? 0)),
  );
  protected readonly currentTags = computed(() =>
    (this.form.controls.tags.value ?? '')
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean),
  );

  protected saveDraft(): void {
    this.persistExpense(ExpenseStatus.Draft);
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

    this.expenseRepository.createExpense(
      {
        title: this.form.controls.title.value ?? '',
        categoryId: this.form.controls.categoryId.value ?? '',
        amount: Number(this.form.controls.amount.value ?? 0),
        date: this.form.controls.date.value ?? '',
        vendor: this.form.controls.vendor.value ?? '',
        tags: (this.form.controls.tags.value ?? '')
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
        description: this.form.controls.description.value ?? '',
        receipt: this.attachment(),
      },
      user,
      mode,
    );

    void this.router.navigateByUrl('/manager/expenses');
  }

  private resolveStatusLabel(status: BudgetStatus): string {
    return status;
  }

  protected shouldShowError(
    controlName: 'title' | 'categoryId' | 'amount' | 'date' | 'vendor' | 'description',
  ): boolean {
    const control = this.form.controls[controlName];

    return Boolean(control.invalid && (control.dirty || control.touched));
  }
}
