import { Routes } from '@angular/router';

export const HR_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'dashboard',
  },
  {
    path: 'dashboard',
    data: { page: 'dashboard' },
    loadComponent: () =>
      import('./pages/hr-workspace/hr-workspace.component').then((m) => m.HrWorkspaceComponent),
  },
  {
    path: 'queue',
    data: { page: 'queue' },
    loadComponent: () =>
      import('./pages/hr-workspace/hr-workspace.component').then((m) => m.HrWorkspaceComponent),
  },
  {
    path: 'recommendation',
    data: { page: 'queue' },
    loadComponent: () =>
      import('./pages/hr-workspace/hr-workspace.component').then((m) => m.HrWorkspaceComponent),
  },
  {
    path: 'review',
    data: { page: 'queue' },
    loadComponent: () =>
      import('./pages/hr-workspace/hr-workspace.component').then((m) => m.HrWorkspaceComponent),
  },
  {
    path: 'expenses',
    data: { page: 'queue' },
    loadComponent: () =>
      import('./pages/hr-workspace/hr-workspace.component').then((m) => m.HrWorkspaceComponent),
  },
  {
    path: 'expenses/:id',
    loadComponent: () =>
      import('../shared/expense-details/expense-details.component').then(
        (m) => m.ExpenseDetailsComponent,
      ),
  },
  {
    path: 'reports',
    data: { page: 'reports' },
    loadComponent: () =>
      import('./pages/hr-workspace/hr-workspace.component').then((m) => m.HrWorkspaceComponent),
  },
  {
    path: 'budget',
    loadComponent: () =>
      import('../manager/pages/manager-budgets/manager-budgets.component').then(
        (m) => m.ManagerBudgetsComponent,
      ),
  },
  {
    path: 'profile',
    loadComponent: () =>
      import('../manager/pages/manager-profile/manager-profile.component').then(
        (m) => m.ManagerProfileComponent,
      ),
  },
];
