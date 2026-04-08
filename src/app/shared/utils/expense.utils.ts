import {
  BudgetStatus,
  Category,
  CategoryBudgetView,
  Expense,
  ExpenseFilters,
  ExpenseStatus,
  ManagerSpendSummary,
  Role,
  User,
} from '../../models/app.models';

const DAY_MS = 24 * 60 * 60 * 1000;

export const DEFAULT_EXPENSE_FILTERS: ExpenseFilters = {
  searchTerm: '',
  categoryId: 'all',
  status: 'all',
  managerId: 'all',
  dateRange: '30d',
  sortBy: 'date-desc',
};

export function resolveBudgetStatus(spend: number, budget: number): BudgetStatus {
  if (budget <= 0) {
    return BudgetStatus.OverBudget;
  }

  const usage = spend / budget;

  if (usage > 1) {
    return BudgetStatus.OverBudget;
  }

  if (usage >= 0.8) {
    return BudgetStatus.NearLimit;
  }

  return BudgetStatus.WithinBudget;
}

export function buildCategoryBudgetViews(
  categories: Category[],
  expenses: Expense[],
  managerId?: string,
): CategoryBudgetView[] {
  return categories
    .map((category) => {
      const spend = expenses
        .filter((expense) => expense.categoryId === category.id)
        .filter((expense) => !managerId || expense.managerId === managerId)
        .filter((expense) => expense.status !== ExpenseStatus.Rejected)
        .reduce((total, expense) => total + expense.amount, 0);

      return {
        category,
        spend,
        remaining: category.monthlyBudget - spend,
        usage: category.monthlyBudget ? Math.min(spend / category.monthlyBudget, 1.25) : 0,
        status: resolveBudgetStatus(spend, category.monthlyBudget),
        previousSpend: category.previousSpend,
      };
    })
    .sort((left, right) => right.spend - left.spend);
}

export function filterExpenses(expenses: Expense[], filters: ExpenseFilters): Expense[] {
  const now = new Date('2026-04-02T23:59:59+05:30');
  const rangeMap: Record<ExpenseFilters['dateRange'], number> = {
    '7d': 7,
    '30d': 30,
    '90d': 90,
    all: Number.POSITIVE_INFINITY,
  };
  const searchTerm = filters.searchTerm.trim().toLowerCase();

  return expenses
    .filter((expense) => {
      const searchable = [
        expense.title,
        expense.vendor,
        expense.description,
        expense.status,
        ...expense.tags,
      ]
        .join(' ')
        .toLowerCase();
      const withinDate =
        Math.abs(now.getTime() - new Date(expense.date).getTime()) / DAY_MS <=
        rangeMap[filters.dateRange];

      return (
        (!searchTerm || searchable.includes(searchTerm)) &&
        (filters.categoryId === 'all' || expense.categoryId === filters.categoryId) &&
        (filters.status === 'all' || expense.status === filters.status) &&
        (filters.managerId === 'all' || expense.managerId === filters.managerId) &&
        withinDate
      );
    })
    .sort((left, right) => {
      switch (filters.sortBy) {
        case 'amount-asc':
          return left.amount - right.amount;
        case 'amount-desc':
          return right.amount - left.amount;
        case 'date-asc':
          return new Date(left.date).getTime() - new Date(right.date).getTime();
        case 'date-desc':
        default:
          return new Date(right.date).getTime() - new Date(left.date).getTime();
      }
    });
}

export function buildManagerSpendSummary(expenses: Expense[], users: User[]): ManagerSpendSummary[] {
  return users
    .filter((user) => user.role === Role.OperationManager)
    .map((user) => {
      const userExpenses = expenses.filter(
        (expense) => expense.managerId === user.id && expense.status !== ExpenseStatus.Rejected,
      );

      return {
        user,
        spend: userExpenses.reduce((total, expense) => total + expense.amount, 0),
        budget: user.assignedBudget,
        approvedCount: userExpenses.filter((expense) => expense.status === ExpenseStatus.Approved)
          .length,
      };
    })
    .sort((left, right) => right.spend - left.spend);
}

export function calculatePercentageDelta(current: number, previous: number): number {
  if (previous === 0) {
    return current === 0 ? 0 : 100;
  }

  return Number((((current - previous) / previous) * 100).toFixed(1));
}

export function computeExpenseStatus(
  amount: number,
  categoryId: string,
  expenses: Expense[],
  categories: Category[],
  requestedStatus: ExpenseStatus.Draft | ExpenseStatus.Submitted,
): ExpenseStatus {
  if (requestedStatus === ExpenseStatus.Draft) {
    return ExpenseStatus.Draft;
  }

  const category = categories.find((entry) => entry.id === categoryId);

  if (!category) {
    return requestedStatus;
  }

  const currentSpend = expenses
    .filter((expense) => expense.categoryId === categoryId)
    .filter((expense) => expense.status !== ExpenseStatus.Rejected)
    .reduce((total, expense) => total + expense.amount, 0);

  return currentSpend + amount > category.monthlyBudget
    ? ExpenseStatus.OverBudget
    : ExpenseStatus.Submitted;
}
