import { MANAGER_ROUTES } from './manager.routes';

describe('MANAGER_ROUTES', () => {
  it('declares the expected manager navigation map and resolves lazy components', async () => {
    expect(MANAGER_ROUTES[0].redirectTo).toBe('dashboard');
    expect(MANAGER_ROUTES.map((route) => route.path)).toEqual([
      '',
      'dashboard',
      'add-expense',
      'expenses',
      'expenses/:id',
      'budgets',
      'notifications',
      'profile',
    ]);

    const resolved = await Promise.all(
      MANAGER_ROUTES.filter((route) => route.loadComponent).map((route) => route.loadComponent?.()),
    );

    expect(resolved.every(Boolean)).toBeTrue();
  });
});
