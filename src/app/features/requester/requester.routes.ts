import { Routes } from '@angular/router';

export const REQUESTER_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'dashboard',
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('../manager/pages/manager-dashboard/manager-dashboard.component').then(
        (m) => m.ManagerDashboardComponent,
      ),
  },
  {
    path: 'add-expense',
    loadComponent: () =>
      import('../manager/pages/manager-add-expense/manager-add-expense.component').then(
        (m) => m.ManagerAddExpenseComponent,
      ),
  },
  {
    path: 'my-expenses',
    loadComponent: () =>
      import('../manager/pages/manager-expenses/manager-expenses.component').then(
        (m) => m.ManagerExpensesComponent,
      ),
  },
  {
    path: 'expenses',
    loadComponent: () =>
      import('../manager/pages/manager-expenses/manager-expenses.component').then(
        (m) => m.ManagerExpensesComponent,
      ),
  },
  {
    path: 'my-expenses/:id',
    loadComponent: () =>
      import('../shared/expense-details/expense-details.component').then(
        (m) => m.ExpenseDetailsComponent,
      ),
  },
  {
    path: 'expenses/:id',
    loadComponent: () =>
      import('../shared/expense-details/expense-details.component').then(
        (m) => m.ExpenseDetailsComponent,
      ),
  },
  {
    path: 'budget',
    loadComponent: () =>
      import('../manager/pages/manager-budgets/manager-budgets.component').then(
        (m) => m.ManagerBudgetsComponent,
      ),
  },
];
