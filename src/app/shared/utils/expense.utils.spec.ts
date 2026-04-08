import { DEMO_CATEGORIES, DEMO_EXPENSES, DEMO_USERS } from '../../mock-data/demo-data';
import { Category, Expense, ExpenseStatus, Role, User } from '../../models/app.models';
import {
  DEFAULT_EXPENSE_FILTERS,
  buildCategoryBudgetViews,
  buildManagerSpendSummary,
  calculatePercentageDelta,
  computeExpenseStatus,
  filterExpenses,
  resolveBudgetStatus,
} from './expense.utils';

describe('expense utils', () => {
  it('resolves budget status by thresholds', () => {
    expect(resolveBudgetStatus(50, 100)).toBe('Within Budget');
    expect(resolveBudgetStatus(85, 100)).toBe('Near Limit');
    expect(resolveBudgetStatus(120, 100)).toBe('Over Budget');
    expect(resolveBudgetStatus(10, 0)).toBe('Over Budget');
  });

  it('filters expenses by search and sort options', () => {
    const results = filterExpenses(DEMO_EXPENSES, {
      ...DEFAULT_EXPENSE_FILTERS,
      searchTerm: 'pantry',
      dateRange: 'all',
    });

    expect(results.length).toBeGreaterThan(0);
    expect(
      results.every((expense) =>
        [expense.title, expense.vendor, expense.description, expense.status, ...expense.tags]
          .join(' ')
          .toLowerCase()
          .includes('pantry'),
      ),
    ).toBeTrue();
  });

  it('covers category, manager, status and sort filters', () => {
    const manager = DEMO_USERS.find((user) => user.role === Role.OperationManager) as User;
    const expenses: Expense[] = [
      {
        id: 'exp-a',
        title: 'Alpha pantry',
        categoryId: 'cat-1',
        amount: 300,
        date: '2026-04-02',
        description: 'Alpha',
        vendor: 'Vendor A',
        tags: ['alpha'],
        managerId: manager.id,
        status: ExpenseStatus.Submitted,
        createdAt: '2026-04-02T09:00:00+05:30',
        updatedAt: '2026-04-02T09:00:00+05:30',
        auditTrail: [],
      },
      {
        id: 'exp-b',
        title: 'Beta pantry',
        categoryId: 'cat-1',
        amount: 100,
        date: '2026-03-28',
        description: 'Beta',
        vendor: 'Vendor B',
        tags: ['beta'],
        managerId: manager.id,
        status: ExpenseStatus.Approved,
        createdAt: '2026-03-28T09:00:00+05:30',
        updatedAt: '2026-03-28T09:00:00+05:30',
        auditTrail: [],
      },
      {
        id: 'exp-c',
        title: 'Gamma pantry',
        categoryId: 'cat-2',
        amount: 50,
        date: '2026-01-05',
        description: 'Gamma',
        vendor: 'Vendor C',
        tags: ['gamma'],
        managerId: 'usr-mgr-2',
        status: ExpenseStatus.Rejected,
        createdAt: '2026-01-05T09:00:00+05:30',
        updatedAt: '2026-01-05T09:00:00+05:30',
        auditTrail: [],
      },
    ];

    expect(
      filterExpenses(expenses, {
        ...DEFAULT_EXPENSE_FILTERS,
        searchTerm: ' alpha ',
        dateRange: 'all',
      }).length,
    ).toBe(1);

    expect(
      filterExpenses(expenses, {
        ...DEFAULT_EXPENSE_FILTERS,
        categoryId: 'cat-1',
        managerId: manager.id,
        dateRange: '30d',
        sortBy: 'amount-asc',
      }),
    ).toEqual([expenses[1], expenses[0]]);

    expect(
      filterExpenses(expenses, {
        ...DEFAULT_EXPENSE_FILTERS,
        categoryId: 'cat-1',
        status: ExpenseStatus.Approved,
        managerId: manager.id,
        dateRange: '30d',
        sortBy: 'amount-asc',
      }),
    ).toEqual([expenses[1]]);

    expect(
      filterExpenses(expenses, {
        ...DEFAULT_EXPENSE_FILTERS,
        dateRange: '7d',
        sortBy: 'amount-desc',
      }),
    ).toEqual([expenses[0], expenses[1]]);

    expect(
      filterExpenses(expenses, {
        ...DEFAULT_EXPENSE_FILTERS,
        dateRange: '90d',
        sortBy: 'date-asc',
      }),
    ).toEqual([expenses[2], expenses[1], expenses[0]]);

    expect(
      filterExpenses(expenses, {
        ...DEFAULT_EXPENSE_FILTERS,
        dateRange: 'all',
        sortBy: 'date-desc',
      }),
    ).toEqual([expenses[0], expenses[1], expenses[2]]);
  });

  it('builds category and manager summaries', () => {
    const categoryViews = buildCategoryBudgetViews(DEMO_CATEGORIES, DEMO_EXPENSES);
    const managerViews = buildManagerSpendSummary(DEMO_EXPENSES, DEMO_USERS);

    expect(categoryViews[0].spend).toBeGreaterThanOrEqual(categoryViews[1].spend);
    expect(managerViews.every((item) => item.user.role === Role.OperationManager)).toBeTrue();
  });

  it('builds category and manager summaries with exclusion branches', () => {
    const categories: Category[] = [
      {
        id: 'cat-1',
        name: 'Category One',
        description: 'First synthetic category',
        icon: 'cup',
        accent: '#06B6D4',
        monthlyBudget: 100,
        previousSpend: 20,
      },
      {
        id: 'cat-2',
        name: 'Category Two',
        description: 'Second synthetic category',
        icon: 'wallet',
        accent: '#8B5CF6',
        monthlyBudget: 50,
        previousSpend: 10,
      },
      {
        id: 'cat-zero',
        name: 'Zero Budget',
        description: 'Zero budget category',
        icon: 'alert',
        accent: '#EF4444',
        monthlyBudget: 0,
        previousSpend: 0,
      },
    ];
    const users: User[] = [
      DEMO_USERS.find((user) => user.role === Role.OperationManager) as User,
      DEMO_USERS.find((user) => user.role === Role.Admin) as User,
    ];
    const expenses: Expense[] = [
      {
        id: 'cat-1-approved',
        title: 'Approved spend',
        categoryId: 'cat-1',
        amount: 40,
        date: '2026-04-01',
        description: 'Approved spend',
        vendor: 'Vendor A',
        tags: [],
        managerId: users[0].id,
        status: ExpenseStatus.Approved,
        createdAt: '2026-04-01T09:00:00+05:30',
        updatedAt: '2026-04-01T09:00:00+05:30',
        auditTrail: [],
      },
      {
        id: 'cat-1-rejected',
        title: 'Rejected spend',
        categoryId: 'cat-1',
        amount: 60,
        date: '2026-04-01',
        description: 'Rejected spend',
        vendor: 'Vendor B',
        tags: [],
        managerId: users[0].id,
        status: ExpenseStatus.Rejected,
        createdAt: '2026-04-01T09:00:00+05:30',
        updatedAt: '2026-04-01T09:00:00+05:30',
        auditTrail: [],
      },
      {
        id: 'cat-2-approved',
        title: 'Secondary spend',
        categoryId: 'cat-2',
        amount: 20,
        date: '2026-04-01',
        description: 'Secondary spend',
        vendor: 'Vendor C',
        tags: [],
        managerId: users[0].id,
        status: ExpenseStatus.Approved,
        createdAt: '2026-04-01T09:00:00+05:30',
        updatedAt: '2026-04-01T09:00:00+05:30',
        auditTrail: [],
      },
    ];

    expect(buildCategoryBudgetViews(categories, expenses)).toEqual([
      jasmine.objectContaining({
        category: categories[0],
        spend: 40,
        remaining: 60,
        status: 'Within Budget',
      }),
      jasmine.objectContaining({
        category: categories[1],
        spend: 20,
        remaining: 30,
        status: 'Within Budget',
      }),
      jasmine.objectContaining({
        category: categories[2],
        spend: 0,
        remaining: 0,
        status: 'Over Budget',
      }),
    ]);

    expect(buildCategoryBudgetViews(categories, expenses, users[0].id)[0].spend).toBe(40);
    expect(buildManagerSpendSummary(expenses, users)[0].spend).toBe(60);
    expect(buildManagerSpendSummary(expenses, users)[0].approvedCount).toBe(2);
  });

  it('marks submitted expenses as over budget when they exceed category limits', () => {
    const status = computeExpenseStatus(
      100000,
      DEMO_CATEGORIES[0].id,
      DEMO_EXPENSES,
      DEMO_CATEGORIES,
      ExpenseStatus.Submitted,
    );

    expect(status).toBe(ExpenseStatus.OverBudget);
  });

  it('computes deltas and status branches for drafts and missing categories', () => {
    const categories: Category[] = [
      {
        id: 'cat-1',
        name: 'Category One',
        description: 'First synthetic category',
        icon: 'cup',
        accent: '#06B6D4',
        monthlyBudget: 100,
        previousSpend: 20,
      },
    ];
    const expenses: Expense[] = [
      {
        id: 'cat-1-spend',
        title: 'Spend',
        categoryId: 'cat-1',
        amount: 90,
        date: '2026-04-01',
        description: 'Spend',
        vendor: 'Vendor A',
        tags: [],
        managerId: 'usr-mgr-1',
        status: ExpenseStatus.Approved,
        createdAt: '2026-04-01T09:00:00+05:30',
        updatedAt: '2026-04-01T09:00:00+05:30',
        auditTrail: [],
      },
    ];

    expect(calculatePercentageDelta(0, 0)).toBe(0);
    expect(calculatePercentageDelta(25, 0)).toBe(100);
    expect(calculatePercentageDelta(120, 100)).toBe(20);

    expect(
      computeExpenseStatus(10, 'cat-1', expenses, categories, ExpenseStatus.Draft),
    ).toBe(ExpenseStatus.Draft);
    expect(
      computeExpenseStatus(10, 'missing', expenses, categories, ExpenseStatus.Submitted),
    ).toBe(ExpenseStatus.Submitted);
    expect(
      computeExpenseStatus(5, 'cat-1', expenses, categories, ExpenseStatus.Submitted),
    ).toBe(ExpenseStatus.Submitted);
    expect(
      computeExpenseStatus(20, 'cat-1', expenses, categories, ExpenseStatus.Submitted),
    ).toBe(ExpenseStatus.OverBudget);
  });
});
