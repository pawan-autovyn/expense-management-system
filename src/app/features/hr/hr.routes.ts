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
];
