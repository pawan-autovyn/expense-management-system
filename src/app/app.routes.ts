import { Routes } from '@angular/router';

import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';
import { roleGuard } from './core/guards/role.guard';
import { Role } from './models/app.models';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'login',
  },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/public/pages/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'ems/login',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/public/pages/ems-login/ems-login.component').then(
        (m) => m.EmsLoginComponent,
      ),
  },
  {
    path: 'unauthorized',
    loadComponent: () =>
      import('./features/public/pages/unauthorized/unauthorized.component').then(
        (m) => m.UnauthorizedComponent,
      ),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./layout/app-shell/app-shell.component').then((m) => m.AppShellComponent),
    children: [
      {
        path: 'operation-manager',
        canActivate: [roleGuard],
        data: { roles: [Role.OperationManager] },
        loadChildren: () =>
          import('./features/requester/requester.routes').then((m) => m.REQUESTER_ROUTES),
      },
      {
        path: 'recommender',
        canActivate: [roleGuard],
        data: { roles: [Role.Recommender] },
        loadChildren: () => import('./features/hr/hr.routes').then((m) => m.HR_ROUTES),
      },
      {
        path: 'admin',
        canActivate: [roleGuard],
        data: { roles: [Role.Admin] },
        loadChildren: () =>
          import('./features/admin/admin.routes').then((m) => m.ADMIN_ROUTES),
      },
    ],
  },
  {
    path: '**',
    loadComponent: () =>
      import('./features/public/pages/not-found/not-found.component').then(
        (m) => m.NotFoundComponent,
      ),
  },
];
