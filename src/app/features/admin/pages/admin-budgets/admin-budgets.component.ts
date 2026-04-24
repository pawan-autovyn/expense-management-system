import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';

import { AdminBudgetsResponse, AnalyticsApiService } from '../../../../core/services/analytics-api.service';
import { DirectoryService } from '../../../../core/services/directory.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { Role } from '../../../../models/app.models';
import { IconComponent } from '../../../../shared/components/icon/icon.component';

interface BudgetCardView {
  id: string;
  title: string;
  assignee: string;
  used: number;
  budget: number;
  percent: number;
  tone: 'success' | 'warning' | 'danger';
}

interface MonthlyBudgetBar {
  label: string;
  budget: number;
  annualBudget: number;
}

const FINANCIAL_MONTHS = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];

@Component({
  selector: 'app-admin-budgets',
  standalone: true,
  imports: [CurrencyPipe, FormsModule, IconComponent],
  templateUrl: './admin-budgets.component.html',
  styleUrl: './admin-budgets.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminBudgetsComponent {
  private readonly analyticsApi = inject(AnalyticsApiService);
  private readonly directoryService = inject(DirectoryService);
  private readonly notificationService = inject(NotificationService);
  private readonly budgetsData = signal<AdminBudgetsResponse | null>(null);
  protected readonly isSaving = signal(false);
  protected readonly saveMessage = signal('');

  protected readonly financialYearOptions = ['2025-26', '2024-25', '2023-24'];
  protected readonly selectedFinancialYear = signal(this.financialYearOptions[0]);
  protected readonly categories = computed(
    () => this.budgetsData()?.categories ?? this.directoryService.categories(),
  );
  protected readonly selectedCategoryId = signal(this.categories()[0]?.id ?? '');
  protected readonly annualBudgetDraft = signal(
    this.categories()[0] ? this.categories()[0].monthlyBudget * 12 : 0,
  );

  protected readonly selectedCategory = computed(
    () => this.categories().find((category) => category.id === this.selectedCategoryId()) ?? null,
  );

  protected readonly monthlyAllocation = computed(() => Math.round(this.annualBudgetDraft() / 12));
  protected readonly monthlyBreakdown = computed<MonthlyBudgetBar[]>(() => {
    const annualBudget = Math.max(Number(this.annualBudgetDraft()) || 0, 0);
    const monthlyBudget = Math.round(annualBudget / 12);

    return FINANCIAL_MONTHS.map((label) => ({
      label,
      budget: monthlyBudget,
      annualBudget,
    }));
  });

  protected readonly featuredBudgets = computed<BudgetCardView[]>(() =>
    this.budgetsData()?.featuredBudgets ?? this.categories().map((category) => {
      const annualBudget = category.monthlyBudget * 12;
      const used = category.previousSpend;
      const usage = annualBudget ? used / annualBudget : 0;

      return {
        id: category.id,
        title: category.name,
        assignee: 'Shared category',
        used,
        budget: annualBudget,
        percent: annualBudget ? Math.min(Math.round(usage * 100), 125) : 0,
        tone: used > annualBudget ? 'danger' : usage >= 0.8 ? 'warning' : 'success',
      };
    }),
  );

  constructor() {
    void this.loadBudgets();
  }

  protected selectCategory(categoryId: string): void {
    const category = this.categories().find((entry) => entry.id === categoryId);

    if (!category) {
      return;
    }

    this.selectedCategoryId.set(categoryId);
    this.annualBudgetDraft.set(category.monthlyBudget * 12);
  }

  protected async saveBudget(): Promise<void> {
    const category = this.selectedCategory();

    if (!category) {
      return;
    }

    this.isSaving.set(true);
    this.saveMessage.set('');

    try {
      const annualBudget = Number(this.annualBudgetDraft()) || 0;
      const previousAnnualBudget = Math.round(category.monthlyBudget * 12);
      const updatedCategory = await this.directoryService.saveCategoryBudget(
        category.id,
        annualBudget,
      );

      if (!updatedCategory) {
        this.saveMessage.set('Budget could not be saved. Please try again.');
        return;
      }

      await this.directoryService.loadWorkspaceData();
      await this.loadBudgets();
      this.notificationService.createNotification({
        title: 'Budget updated by admin',
        message: this.buildBudgetNotificationMessage(
          updatedCategory.name,
          previousAnnualBudget,
          annualBudget,
        ),
        tone: annualBudget >= previousAnnualBudget ? 'success' : 'warning',
        audience: Role.OperationManager,
      });
      this.saveMessage.set(
        `${updatedCategory.name} budget saved. Managers now see ${this.formatCurrency(
          annualBudget,
        )} yearly and ${this.formatCurrency(Math.round(annualBudget / 12))} monthly.`,
      );
    } finally {
      this.isSaving.set(false);
    }
  }

  protected updateAnnualBudget(value: string | number): void {
    this.annualBudgetDraft.set(Number(value) || 0);
  }

  protected setBudgetPreset(multiplier: number): void {
    const currentAnnual = this.selectedCategory() ? this.selectedCategory()!.monthlyBudget * 12 : 0;
    this.annualBudgetDraft.set(Math.max(0, Math.round(currentAnnual * multiplier)));
  }

  protected setFinancialYear(value: string): void {
    this.selectedFinancialYear.set(value);
  }

  private async loadBudgets(): Promise<void> {
    try {
      this.budgetsData.set(await firstValueFrom(this.analyticsApi.getAdminBudgets()));
    } catch {
      this.budgetsData.set(null);
    }
  }

  private buildBudgetNotificationMessage(
    categoryName: string,
    previousAnnualBudget: number,
    nextAnnualBudget: number,
  ): string {
    const monthlyBudget = Math.round(nextAnnualBudget / 12);

    if (previousAnnualBudget === nextAnnualBudget) {
      return `Admin kept ${categoryName} at ${this.formatCurrency(
        nextAnnualBudget,
      )} yearly. Your live monthly limit is ${this.formatCurrency(monthlyBudget)}.`;
    }

    return `Admin updated ${categoryName} from ${this.formatCurrency(
      previousAnnualBudget,
    )} to ${this.formatCurrency(nextAnnualBudget)} yearly. Your live monthly limit is ${this.formatCurrency(
      monthlyBudget,
    )}.`;
  }

  private formatCurrency(value: number): string {
    return value.toLocaleString('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    });
  }
}
