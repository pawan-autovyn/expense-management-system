import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';

import { AnalyticsApiService } from '../../../../core/services/analytics-api.service';
import { DirectoryService } from '../../../../core/services/directory.service';
import { ExpenseRepositoryService } from '../../../../core/services/expense-repository.service';
import { Category } from '../../../../models/app.models';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { buildCategoryBudgetViews } from '../../../../shared/utils/expense.utils';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-admin-categories',
  standalone: true,
  imports: [CurrencyPipe, FormsModule, IconComponent, StatusBadgeComponent],
  templateUrl: './admin-categories.component.html',
  styleUrl: './admin-categories.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminCategoriesComponent {
  private readonly analyticsApi = inject(AnalyticsApiService);
  protected readonly directoryService = inject(DirectoryService);
  private readonly expenseRepository = inject(ExpenseRepositoryService);
  protected readonly iconChoices = ['dashboard', 'wallet', 'receipt', 'layers', 'activity', 'settings'];
  protected readonly categorySearchTerm = signal('');
  protected readonly isRefreshing = signal(false);
  protected newCategory = {
    name: '',
    description: '',
    monthlyBudget: 5000,
    accent: '#27528a',
    icon: 'wallet',
  };
  protected saveMessage = '';
  private readonly apiCategoryViews = signal<ReturnType<typeof buildCategoryBudgetViews>>([]);

  protected readonly categories = computed(() =>
    this.apiCategoryViews().length > 0
      ? this.apiCategoryViews()
      : buildCategoryBudgetViews(this.directoryService.categories(), this.expenseRepository.expenses()),
  );
  protected readonly filteredCategories = computed(() => {
    const term = this.categorySearchTerm().trim().toLowerCase();

    if (!term) {
      return this.categories();
    }

    return this.categories().filter((entry) =>
      [entry.category.name, entry.category.description, entry.status].some((value) =>
        value.toLowerCase().includes(term),
      ),
    );
  });

  protected async addCategory(): Promise<void> {
    const name = this.newCategory.name.trim();
    const description = this.newCategory.description.trim();

    if (!name || !description) {
      this.saveMessage = 'Please add both a name and description.';
      return;
    }

    const category: Category = {
      id: this.buildCategoryId(name),
      name,
      description,
      monthlyBudget: Number(this.newCategory.monthlyBudget) || 0,
      accent: this.newCategory.accent,
      icon: this.newCategory.icon,
      previousSpend: 0,
    };

    this.isRefreshing.set(true);

    try {
      const createdCategory = await this.directoryService.createCategory(category);

      if (!createdCategory) {
        this.saveMessage = 'Category could not be saved. Please try again.';
        return;
      }

      await this.directoryService.loadWorkspaceData();
      await this.expenseRepository.loadExpenses();
      await this.loadCategories();

      this.newCategory = {
        name: '',
        description: '',
        monthlyBudget: 5000,
        accent: '#27528a',
        icon: 'wallet',
      };
      this.saveMessage = `${createdCategory.name} added to the live category library.`;
      this.categorySearchTerm.set('');
    } finally {
      this.isRefreshing.set(false);
    }
  }

  constructor() {
    void this.loadCategories();
  }

  private buildCategoryId(name: string): string {
    return `${name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')}-${Date.now().toString(36)}`;
  }

  private async loadCategories(): Promise<void> {
    try {
      const response = await firstValueFrom(this.analyticsApi.getAdminCategories());
      this.apiCategoryViews.set(response.categoryViews as ReturnType<typeof buildCategoryBudgetViews>);
    } catch {
      this.apiCategoryViews.set([]);
    }
  }
}
