import { Routes } from '@angular/router';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'dashboard',
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./pages/admin-dashboard/admin-dashboard.component').then(
        (m) => m.AdminDashboardComponent,
      ),
  },
  {
    path: 'expenses',
    loadComponent: () =>
      import('./pages/admin-expenses/admin-expenses.component').then(
        (m) => m.AdminExpensesComponent,
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
    path: 'approvals',
    loadComponent: () =>
      import('./pages/admin-approvals/admin-approvals.component').then(
        (m) => m.AdminApprovalsComponent,
      ),
  },
  {
    path: 'approval',
    loadComponent: () =>
      import('./pages/admin-approvals/admin-approvals.component').then(
        (m) => m.AdminApprovalsComponent,
      ),
  },
  {
    path: 'audit-trail',
    loadComponent: () =>
      import('./pages/admin-audit-trail/admin-audit-trail.component').then(
        (m) => m.AdminAuditTrailComponent,
      ),
  },
  {
    path: 'audit',
    loadComponent: () =>
      import('./pages/admin-audit-trail/admin-audit-trail.component').then(
        (m) => m.AdminAuditTrailComponent,
      ),
  },
  {
    path: 'categories',
    loadComponent: () =>
      import('./pages/admin-categories/admin-categories.component').then(
        (m) => m.AdminCategoriesComponent,
      ),
  },
  {
    path: 'category',
    loadComponent: () =>
      import('./pages/admin-categories/admin-categories.component').then(
        (m) => m.AdminCategoriesComponent,
      ),
  },
  {
    path: 'budgets',
    loadComponent: () =>
      import('./pages/admin-budgets/admin-budgets.component').then((m) => m.AdminBudgetsComponent),
  },
  {
    path: 'budget',
    loadComponent: () =>
      import('./pages/admin-budgets/admin-budgets.component').then((m) => m.AdminBudgetsComponent),
  },
  {
    path: 'reports',
    loadComponent: () =>
      import('./pages/admin-reports/admin-reports.component').then(
        (m) => m.AdminReportsComponent,
      ),
  },
  {
    path: 'notifications',
    loadComponent: () =>
      import('./pages/admin-notifications/admin-notifications.component').then(
        (m) => m.AdminNotificationsComponent,
      ),
  },
  {
    path: 'settings',
    loadComponent: () =>
      import('./pages/admin-settings/admin-settings.component').then(
        (m) => m.AdminSettingsComponent,
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
