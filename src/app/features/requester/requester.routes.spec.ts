import { REQUESTER_ROUTES } from './requester.routes';

describe('Operation Manager routes', () => {
  it('declares the expected operation manager navigation map and resolves lazy components', async () => {
    expect(REQUESTER_ROUTES[0].redirectTo).toBe('dashboard');
    expect(REQUESTER_ROUTES.map((route) => route.path)).toEqual([
      '',
      'dashboard',
      'add-expense',
      'my-expenses',
      'expenses',
      'my-expenses/:id',
      'expenses/:id',
      'budget',
      'notifications',
      'profile',
    ]);

    const resolved = await Promise.all(
      REQUESTER_ROUTES.filter((route) => route.loadComponent).map((route) => route.loadComponent?.()),
    );

    expect(resolved.every(Boolean)).toBeTrue();
  });
});
