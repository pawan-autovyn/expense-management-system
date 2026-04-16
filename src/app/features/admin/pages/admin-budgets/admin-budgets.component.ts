import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { DirectoryService } from '../../../../core/services/directory.service';
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
  private readonly directoryService = inject(DirectoryService);

  protected readonly financialYearOptions = ['2025-26', '2024-25', '2023-24'];
  protected readonly selectedFinancialYear = signal(this.financialYearOptions[0]);
  protected readonly categories = this.directoryService.categories;
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
    this.categories().map((category) => {
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

  protected selectCategory(categoryId: string): void {
    const category = this.categories().find((entry) => entry.id === categoryId);

    if (!category) {
      return;
    }

    this.selectedCategoryId.set(categoryId);
    this.annualBudgetDraft.set(category.monthlyBudget * 12);
  }

  protected saveBudget(): void {
    const category = this.selectedCategory();

    if (!category) {
      return;
    }

    this.directoryService.updateCategoryBudget(category.id, Number(this.annualBudgetDraft()) || 0);
  }

  protected updateAnnualBudget(value: string | number): void {
    this.annualBudgetDraft.set(Number(value) || 0);
  }

  protected setFinancialYear(value: string): void {
    this.selectedFinancialYear.set(value);
  }
}
