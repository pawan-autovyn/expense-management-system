import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

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
  protected readonly directoryService = inject(DirectoryService);
  private readonly expenseRepository = inject(ExpenseRepositoryService);
  protected readonly iconChoices = ['dashboard', 'wallet', 'receipt', 'layers', 'activity', 'settings'];
  protected readonly categorySearchTerm = signal('');
  protected newCategory = {
    name: '',
    description: '',
    monthlyBudget: 5000,
    accent: '#27528a',
    icon: 'wallet',
  };
  protected saveMessage = '';

  protected readonly categories = computed(() =>
    buildCategoryBudgetViews(this.directoryService.categories(), this.expenseRepository.expenses()),
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

  protected addCategory(): void {
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

    this.directoryService.addCategory(category);
    this.newCategory = {
      name: '',
      description: '',
      monthlyBudget: 5000,
      accent: '#27528a',
      icon: 'wallet',
    };
    this.saveMessage = `${category.name} added to the category library.`;
    this.categorySearchTerm.set('');
  }

  private buildCategoryId(name: string): string {
    return `${name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')}-${Date.now().toString(36)}`;
  }
}
