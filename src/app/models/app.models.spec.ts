import { BudgetStatus, ExpenseStatus, Role, ThemeMode } from './app.models';

describe('app models enums', () => {
  it('keeps the canonical role and status values', () => {
    expect(Role.Admin).toBe('admin');
    expect(Role.OperationManager).toBe('operation-manager');
    expect(ThemeMode.Dark).toBe('dark');
    expect(BudgetStatus.NearLimit).toBe('Near Limit');
    expect(ExpenseStatus.OverBudget).toBe('Over Budget');
  });
});
