import {
  Budget,
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
const NON_COMMITTED_EXPENSE_STATUSES = [
  ExpenseStatus.Rejected,
  ExpenseStatus.Cancelled,
  ExpenseStatus.Draft,
];

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
        .filter((expense) => countsAgainstBudget(expense))
        .reduce((total, expense) => total + expense.amount, 0);

      return {
        category,
        spend,
        remaining: Math.max(category.monthlyBudget - spend, 0),
        usage: category.monthlyBudget ? Math.min(spend / category.monthlyBudget, 1.25) : 0,
        status: resolveBudgetStatus(spend, category.monthlyBudget),
        previousSpend: category.previousSpend,
      };
    })
    .sort((left, right) => right.spend - left.spend);
}

export function filterExpenses(expenses: Expense[], filters: ExpenseFilters): Expense[] {
  const now = new Date();
  const searchTerm = filters.searchTerm.trim().toLowerCase();
  const rangeBounds = resolveDateBounds(filters, now);

  return expenses
    .filter((expense) => {
      const searchable = [
        expense.title,
        expense.vendor,
        expense.description,
        expense.status,
        ...(expense.remarks ?? []),
        ...expense.tags,
      ]
        .join(' ')
        .toLowerCase();
      const expenseDate = new Date(expense.date);
      const withinDate =
        !rangeBounds ||
        (expenseDate.getTime() >= rangeBounds.start.getTime() &&
          expenseDate.getTime() <= rangeBounds.end.getTime());

      return (
        (!searchTerm || searchable.includes(searchTerm)) &&
        (filters.categoryId === 'all' || expense.categoryId === filters.categoryId) &&
        (filters.status === 'all' || expense.status === filters.status) &&
        (filters.managerId === 'all' || expense.managerId === filters.managerId) &&
        (!filters.locationId || expense.locationId === filters.locationId) &&
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

function resolveDateBounds(
  filters: ExpenseFilters,
  now: Date,
): { start: Date; end: Date } | null {
  if (filters.dateRange === 'all') {
    return null;
  }

  if (filters.dateRange === 'custom') {
    if (!filters.dateFrom && !filters.dateTo) {
      return null;
    }

    const start = filters.dateFrom ? startOfDay(new Date(filters.dateFrom)) : startOfYear(now);
    const end = filters.dateTo ? endOfDay(new Date(filters.dateTo)) : endOfDay(now);

    return { start, end };
  }

  if (filters.dateRange === 'last-year') {
    const year = now.getFullYear() - 1;

    return {
      start: new Date(year, 0, 1, 0, 0, 0, 0),
      end: new Date(year, 11, 31, 23, 59, 59, 999),
    };
  }

  if (filters.dateRange === 'current-year') {
    return {
      start: new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0),
      end: endOfDay(now),
    };
  }

  if (filters.dateRange === 'last-2-years') {
    return {
      start: new Date(now.getFullYear() - 2, 0, 1, 0, 0, 0, 0),
      end: new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999),
    };
  }

  if (filters.dateRange === 'last-month') {
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    return { start, end };
  }

  const dayCountMap: Record<
    Exclude<
      ExpenseFilters['dateRange'],
      'all' | 'custom' | 'last-month' | 'last-year' | 'current-year' | 'last-2-years'
    >,
    number
  > = {
    '7d': 7,
    '30d': 30,
    '90d': 90,
  };
  const days = dayCountMap[filters.dateRange as '7d' | '30d' | '90d'];
  const start = new Date(now.getTime() - days * DAY_MS);

  return { start: startOfDay(start), end: endOfDay(now) };
}

function startOfDay(value: Date): Date {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate(), 0, 0, 0, 0);
}

function endOfDay(value: Date): Date {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate(), 23, 59, 59, 999);
}

function startOfYear(value: Date): Date {
  return new Date(value.getFullYear(), 0, 1, 0, 0, 0, 0);
}

export function buildManagerSpendSummary(
  expenses: Expense[],
  users: User[],
  budgets: Budget[] = [],
): ManagerSpendSummary[] {
  return users
    .filter((user) => user.role === Role.OperationManager)
    .map((user) => {
      const userExpenses = expenses.filter(
        (expense) =>
          expense.managerId === user.id &&
          ![ExpenseStatus.Rejected, ExpenseStatus.Cancelled].includes(expense.status),
      );
      const locationId = user.location.trim().toLowerCase().replace(/\s+/g, '-');
      const totalBudget = budgets
        .filter((budget) => budget.locationId === locationId)
        .reduce((total, budget) => total + budget.annualBudget, 0);

      return {
        user,
        spend: userExpenses.reduce((total, expense) => total + expense.amount, 0),
        budget: totalBudget,
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
    .filter((expense) => countsAgainstBudget(expense))
    .reduce((total, expense) => total + expense.amount, 0);

  return currentSpend + amount > category.monthlyBudget
    ? ExpenseStatus.OverBudget
    : ExpenseStatus.Submitted;
}

export function countsAgainstBudget(expense: Pick<Expense, 'status'>): boolean {
  return !NON_COMMITTED_EXPENSE_STATUSES.includes(expense.status);
}

export function calculateCommittedSpend(expenses: Expense[]): number {
  return expenses
    .filter((expense) => countsAgainstBudget(expense))
    .reduce((total, expense) => total + expense.amount, 0);
}
