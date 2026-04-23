import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { API_CONFIG } from '../constants/api.constants';
import {
  DEMO_BUDGETS,
  DEMO_CATEGORIES,
  DEMO_INSIGHTS,
  DEMO_LOCATIONS,
  DEMO_TRENDS,
  DEMO_USERS,
} from '../../mock-data/demo-data';
import {
  Budget,
  Category,
  InsightCard,
  Location,
  Role,
  TrendPoint,
  User,
} from '../../models/app.models';
import { cloneData } from '../../shared/utils/clone-data.util';
import { isKarmaTestEnvironment } from '../utils/runtime-mode.util';

interface SharedReferenceDataResponse {
  categories: Category[];
  locations: Location[];
  budgets: Budget[];
}

@Injectable({
  providedIn: 'root',
})
export class DirectoryService {
  private readonly http = inject(HttpClient, { optional: true });
  private readonly usersStore = signal<User[]>(
    isKarmaTestEnvironment() ? cloneData(DEMO_USERS) : [],
  );
  private readonly categoriesStore = signal<Category[]>(
    isKarmaTestEnvironment() ? cloneData(DEMO_CATEGORIES) : [],
  );
  private readonly locationsStore = signal<Location[]>(
    isKarmaTestEnvironment() ? cloneData(DEMO_LOCATIONS) : [],
  );
  private readonly budgetsStore = signal<Budget[]>(
    isKarmaTestEnvironment() ? cloneData(DEMO_BUDGETS) : [],
  );
  private readonly trendsStore = signal<TrendPoint[]>(
    isKarmaTestEnvironment() ? cloneData(DEMO_TRENDS) : [],
  );
  private readonly insightsStore = signal<InsightCard[]>(
    isKarmaTestEnvironment() ? cloneData(DEMO_INSIGHTS) : [],
  );

  readonly users = this.usersStore.asReadonly();
  readonly categories = this.categoriesStore.asReadonly();
  readonly locations = this.locationsStore.asReadonly();
  readonly budgets = this.budgetsStore.asReadonly();
  readonly trends = this.trendsStore.asReadonly();
  readonly insights = this.insightsStore.asReadonly();

  async loadWorkspaceData(): Promise<SharedReferenceDataResponse | null> {
    if (!this.http) {
      return null;
    }

    try {
      const [categories, locations, budgets] = await Promise.all([
        firstValueFrom(
          this.http.get<Category[]>(`${API_CONFIG.baseUrl}${API_CONFIG.categoriesPath}`),
        ),
        firstValueFrom(
          this.http.get<Location[]>(`${API_CONFIG.baseUrl}${API_CONFIG.locationsPath}`),
        ),
        firstValueFrom(
          this.http.get<Budget[]>(`${API_CONFIG.baseUrl}${API_CONFIG.budgetsPath}`),
        ),
      ]);
      const response: SharedReferenceDataResponse = {
        categories,
        locations,
        budgets,
      };

      this.categoriesStore.set(response.categories);
      this.locationsStore.set(response.locations);
      this.budgetsStore.set(response.budgets);

      return response;
    } catch {
      return null;
    }
  }

  async loadUsers(): Promise<User[] | null> {
    if (!this.http) {
      return null;
    }

    try {
      const users = await firstValueFrom(
        this.http.get<User[]>(`${API_CONFIG.baseUrl}${API_CONFIG.usersPath}`),
      );

      this.usersStore.set(users);

      return users;
    } catch {
      return null;
    }
  }

  async loadReferenceData(): Promise<{ users: User[] | null; shared: SharedReferenceDataResponse | null }> {
    const [shared, users] = await Promise.all([this.loadWorkspaceData(), this.loadUsers()]);

    return {
      users,
      shared,
    };
  }

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

  getLocationByName(locationName: string): Location | undefined {
    const normalizedName = locationName.trim().toLowerCase();

    return this.locations().find(
      (location) => location.name.trim().toLowerCase() === normalizedName,
    );
  }

  getBudgetById(budgetId: string): Budget | undefined {
    return this.budgets().find((budget) => budget.id === budgetId);
  }

  getBudgetsForLocation(locationId: string): Budget[] {
    return this.budgets().filter((budget) => budget.locationId === locationId);
  }

  getTotalBudgetForLocation(locationId: string): number {
    return this.getBudgetsForLocation(locationId).reduce(
      (total, budget) => total + budget.annualBudget,
      0,
    );
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

    void this.syncCategoryBudget(categoryId, annualBudget);

    return updatedCategory;
  }

  addCategory(category: Category): void {
    this.categoriesStore.update((categories) => [category, ...categories]);
    void this.syncCategory(category);
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

  async createCategory(category: Category): Promise<Category | undefined> {
    this.categoriesStore.update((categories) => [category, ...categories]);

    const createdCategory = await this.syncCategory(category);

    return createdCategory ?? category;
  }

  async saveCategoryBudget(categoryId: string, annualBudget: number): Promise<Category | undefined> {
    const updatedCategory = this.updateCategoryBudget(categoryId, annualBudget);

    if (!updatedCategory) {
      return undefined;
    }

    const syncedCategory = await this.syncCategoryBudget(categoryId, annualBudget);

    return syncedCategory ?? updatedCategory;
  }

  private async syncCategory(category: Category): Promise<Category | undefined> {
    if (!this.http) {
      return category;
    }

    try {
      const createdCategory = await firstValueFrom(
        this.http.post<Category>(`${API_CONFIG.baseUrl}${API_CONFIG.categoriesPath}`, {
          name: category.name,
          description: category.description,
          monthlyBudget: category.monthlyBudget,
          accent: category.accent,
          icon: category.icon,
        }),
      );

      this.categoriesStore.update((categories) =>
        categories.map((entry) => (entry.id === category.id ? createdCategory : entry)),
      );
      return createdCategory;
    } catch {
      return category;
    }
  }

  private async syncCategoryBudget(
    categoryId: string,
    annualBudget: number,
  ): Promise<Category | undefined> {
    if (!this.http) {
      return this.getCategoryById(categoryId);
    }

    try {
      const updatedCategory = await firstValueFrom(
        this.http.patch<Category>(
          `${API_CONFIG.baseUrl}${API_CONFIG.categoriesPath}/${categoryId}/budget`,
          {
            annualBudget,
          },
        ),
      );

      this.categoriesStore.update((categories) =>
        categories.map((category) =>
          category.id === updatedCategory.id ? updatedCategory : category,
        ),
      );
      return updatedCategory;
    } catch {
      return this.getCategoryById(categoryId);
    }
  }
}
