import { HR_ROUTES } from './hr.routes';

describe('Recommender routes', () => {
  it('declares the expected recommender navigation map and resolves lazy components', async () => {
    expect(HR_ROUTES[0].redirectTo).toBe('dashboard');
    expect(HR_ROUTES.map((route) => route.path)).toEqual([
      '',
      'dashboard',
      'queue',
      'recommendation',
      'review',
      'expenses',
      'expenses/:id',
      'reports',
      'budget',
      'profile',
    ]);

    const resolved = await Promise.all(
      HR_ROUTES.filter((route) => route.loadComponent).map((route) => route.loadComponent?.()),
    );

    expect(resolved.every(Boolean)).toBeTrue();
  });
});
