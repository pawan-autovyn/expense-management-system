import { routes } from './app.routes';

describe('app routes', () => {
  it('wires the public shell and lazy feature areas', async () => {
    expect(routes[0].redirectTo).toBe('login');

    const loginComponent = await routes[1].loadComponent?.();
    const unauthorizedComponent = await routes[2].loadComponent?.();
    const shellComponent = await routes[3].loadComponent?.();
    const shellRoute = routes[3] as {
      children: [
        { loadChildren: () => Promise<{ path?: string }[]> },
        { loadChildren: () => Promise<{ path?: string }[]> },
      ];
    };
    const adminRoutes = await shellRoute.children[0].loadChildren();
    const managerRoutes = await shellRoute.children[1].loadChildren();
    const notFoundComponent = await routes[4].loadComponent?.();

    expect(loginComponent).toBeTruthy();
    expect(unauthorizedComponent).toBeTruthy();
    expect(shellComponent).toBeTruthy();
    expect(adminRoutes.some((route) => route.path === 'dashboard')).toBeTrue();
    expect(managerRoutes.some((route) => route.path === 'dashboard')).toBeTrue();
    expect(notFoundComponent).toBeTruthy();
  });
});
