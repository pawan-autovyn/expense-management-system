import { routes } from './app.routes';

describe('app routes', () => {
  it('wires the public shell and lazy feature areas', async () => {
    const loginRoute = routes.find((route) => route.path === 'login');
    const emsLoginRoute = routes.find((route) => route.path === 'ems/login');
    const unauthorizedRoute = routes.find((route) => route.path === 'unauthorized');
    const shellRouteConfig = routes.find((route) => route.path === '' && 'children' in route);
    const notFoundRoute = routes.find((route) => route.path === '**');

    const loginComponent = await loginRoute?.loadComponent?.();
    const emsLoginComponent = await emsLoginRoute?.loadComponent?.();
    const unauthorizedComponent = await unauthorizedRoute?.loadComponent?.();
    if (!shellRouteConfig) {
      fail('Expected the authenticated shell route to exist.');

      return;
    }

    const shellRoute = shellRouteConfig as {
      children: { path?: string; loadChildren: () => Promise<{ path?: string }[]> }[];
    };
    const operationManagerRoute = shellRoute.children.find((route) => route.path === 'operation-manager');
    const recommenderRoute = shellRoute.children.find((route) => route.path === 'recommender');
    const adminRoute = shellRoute.children.find((route) => route.path === 'admin');
    const operationManagerRoutes = await operationManagerRoute?.loadChildren();
    const recommenderRoutes = await recommenderRoute?.loadChildren();
    const adminRoutes = await adminRoute?.loadChildren();
    const notFoundComponent = await notFoundRoute?.loadComponent?.();

    expect(routes[0].redirectTo).toBe('login');
    expect(loginComponent).toBeTruthy();
    expect(emsLoginComponent).toBeTruthy();
    expect(unauthorizedComponent).toBeTruthy();
    expect(shellRouteConfig).toBeTruthy();
    expect(operationManagerRoutes?.some((route) => route.path === 'dashboard')).toBeTrue();
    expect(recommenderRoutes?.some((route) => route.path === 'dashboard')).toBeTrue();
    expect(adminRoutes?.some((route) => route.path === 'dashboard')).toBeTrue();
    expect(notFoundComponent).toBeTruthy();
  });
});
