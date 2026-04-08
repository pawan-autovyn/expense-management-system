import { ADMIN_ROUTES } from './admin.routes';

describe('ADMIN_ROUTES', () => {
  it('declares the expected admin navigation map and resolves lazy components', async () => {
    expect(ADMIN_ROUTES[0].redirectTo).toBe('dashboard');
    expect(ADMIN_ROUTES.map((route) => route.path)).toEqual([
      '',
      'dashboard',
      'expenses',
      'expenses/:id',
      'approvals',
      'audit-trail',
      'categories',
      'budgets',
      'reports',
      'notifications',
      'settings',
    ]);

    const resolved = await Promise.all(
      ADMIN_ROUTES.filter((route) => route.loadComponent).map((route) => route.loadComponent?.()),
    );

    expect(resolved.every(Boolean)).toBeTrue();
  });
});
