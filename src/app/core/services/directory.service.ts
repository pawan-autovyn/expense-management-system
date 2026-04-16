import { Injectable, signal } from '@angular/core';

import {
  DEMO_BUDGETS,
  DEMO_CATEGORIES,
  DEMO_INSIGHTS,
  DEMO_LOCATIONS,
  DEMO_TRENDS,
  DEMO_USERS,
} from '../../mock-data/demo-data';
import { Budget, Category, InsightCard, Location, Role, TrendPoint, User } from '../../models/app.models';

@Injectable({
  providedIn: 'root',
})
export class DirectoryService {
  private readonly usersStore = signal<User[]>(DEMO_USERS);
  private readonly categoriesStore = signal<Category[]>(DEMO_CATEGORIES);
  private readonly locationsStore = signal<Location[]>(DEMO_LOCATIONS);
  private readonly budgetsStore = signal<Budget[]>(DEMO_BUDGETS);
  private readonly trendsStore = signal<TrendPoint[]>(DEMO_TRENDS);
  private readonly insightsStore = signal<InsightCard[]>(DEMO_INSIGHTS);

  readonly users = this.usersStore.asReadonly();
  readonly categories = this.categoriesStore.asReadonly();
  readonly locations = this.locationsStore.asReadonly();
  readonly budgets = this.budgetsStore.asReadonly();
  readonly trends = this.trendsStore.asReadonly();
  readonly insights = this.insightsStore.asReadonly();

  getUsers(): User[] {
    return this.users();
  }

  getDefaultUserByRole(role: Role): User {
    const roleMatches = this.users().find((user) => user.role === role);

    if (roleMatches) {
      return roleMatches;
    }

    if (role === Role.OperationManager) {
      return this.users().find((user) => user.role === Role.OperationManager) ?? this.users()[0];
    }

    if (role === Role.Recommender) {
      return this.users().find((user) => user.role === Role.Recommender) ?? this.users()[0];
    }

    return this.users().find((user) => user.role === Role.Admin) ?? this.users()[0];
  }

  getUserById(userId: string): User | undefined {
    return this.users().find((user) => user.id === userId);
  }

  getCategoryById(categoryId: string): Category | undefined {
    return this.categories().find((category) => category.id === categoryId);
  }

  getLocationById(locationId: string): Location | undefined {
    return this.locations().find((location) => location.id === locationId);
  }

  getBudgetById(budgetId: string): Budget | undefined {
    return this.budgets().find((budget) => budget.id === budgetId);
  }

  updateCategoryBudget(categoryId: string, annualBudget: number): Category | undefined {
    const monthlyBudget = annualBudget > 0 ? annualBudget / 12 : 0;
    let updatedCategory: Category | undefined;

    this.categoriesStore.update((categories) =>
      categories.map((category) => {
        if (category.id !== categoryId) {
          return category;
        }

        updatedCategory = {
          ...category,
          monthlyBudget,
        };

        return updatedCategory;
      }),
    );

    return updatedCategory;
  }

  addCategory(category: Category): void {
    this.categoriesStore.update((categories) => [category, ...categories]);
  }

  updateBudget(budgetId: string, patch: Partial<Budget>): Budget | undefined {
    let updatedBudget: Budget | undefined;

    this.budgetsStore.update((budgets) =>
      budgets.map((budget) => {
        if (budget.id !== budgetId) {
          return budget;
        }

        updatedBudget = { ...budget, ...patch };

        return updatedBudget;
      }),
    );

    return updatedBudget;
  }
}
