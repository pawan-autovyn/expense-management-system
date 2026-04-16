import { DEMO_CATEGORIES, DEMO_EXPENSES, DEMO_NOTIFICATIONS, DEMO_USERS } from './demo-data';
import { ExpenseStatus, Role } from '../models/app.models';

describe('enterprise seed data', () => {
  it('exposes the seeded enterprise experience data', () => {
    expect(DEMO_USERS.length).toBeGreaterThan(0);
    expect(DEMO_CATEGORIES.length).toBeGreaterThan(0);
    expect(DEMO_EXPENSES.length).toBeGreaterThan(0);
    expect(DEMO_NOTIFICATIONS.length).toBeGreaterThan(0);
    expect(DEMO_USERS.some((user) => user.role === Role.Admin)).toBeTrue();
    expect(DEMO_USERS.some((user) => user.role === Role.OperationManager)).toBeTrue();
    expect(DEMO_USERS.some((user) => user.role === Role.Recommender)).toBeTrue();
    expect(DEMO_USERS.some((user) => user.role === Role.OperationManager)).toBeTrue();
    expect(DEMO_EXPENSES.some((expense) => expense.status === ExpenseStatus.Approved)).toBeTrue();
    expect(DEMO_EXPENSES.some((expense) => expense.status === ExpenseStatus.Recommended)).toBeTrue();
    expect(DEMO_EXPENSES.some((expense) => expense.status === ExpenseStatus.Cancelled)).toBeTrue();
  });
});
