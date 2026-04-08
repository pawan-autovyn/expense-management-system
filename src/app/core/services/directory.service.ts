import { Injectable, signal } from '@angular/core';

import { DEMO_CATEGORIES, DEMO_INSIGHTS, DEMO_TRENDS, DEMO_USERS } from '../../mock-data/demo-data';
import { Category, InsightCard, Role, TrendPoint, User } from '../../models/app.models';

@Injectable({
  providedIn: 'root',
})
export class DirectoryService {
  private readonly usersStore = signal<User[]>(DEMO_USERS);
  private readonly categoriesStore = signal<Category[]>(DEMO_CATEGORIES);
  private readonly trendsStore = signal<TrendPoint[]>(DEMO_TRENDS);
  private readonly insightsStore = signal<InsightCard[]>(DEMO_INSIGHTS);

  readonly users = this.usersStore.asReadonly();
  readonly categories = this.categoriesStore.asReadonly();
  readonly trends = this.trendsStore.asReadonly();
  readonly insights = this.insightsStore.asReadonly();

  getDefaultUserByRole(role: Role): User {
    return this.users().find((user) => user.role === role) ?? this.users()[0];
  }

  getUserById(userId: string): User | undefined {
    return this.users().find((user) => user.id === userId);
  }

  getCategoryById(categoryId: string): Category | undefined {
    return this.categories().find((category) => category.id === categoryId);
  }

  addCategory(category: Category): void {
    this.categoriesStore.update((categories) => [category, ...categories]);
  }
}
