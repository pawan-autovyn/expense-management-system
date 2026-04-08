import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, UrlTree } from '@angular/router';

import { Role } from '../../models/app.models';
import { DirectoryService } from '../services/directory.service';
import { AuthService } from '../services/auth.service';
import { roleGuard } from './role.guard';

describe('roleGuard', () => {
  let authService: AuthService;
  let router: Router;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), AuthService, DirectoryService],
    });
    authService = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
  });

  it('allows matching roles', () => {
    authService.loginAs(Role.Admin);

    const result = TestBed.runInInjectionContext(() =>
      roleGuard({ data: { roles: [Role.Admin] } } as never, {} as never),
    );

    expect(result).toBeTrue();
  });

  it('redirects unauthorized roles', () => {
    authService.loginAs(Role.OperationManager);

    const result = TestBed.runInInjectionContext(() =>
      roleGuard({ data: { roles: [Role.Admin] } } as never, {} as never),
    );

    expect(result instanceof UrlTree).toBeTrue();
    expect(router.serializeUrl(result as UrlTree)).toBe('/unauthorized');
  });

  it('handles routes without guard data', () => {
    const result = TestBed.runInInjectionContext(() =>
      roleGuard({} as never, {} as never),
    );

    expect(result instanceof UrlTree).toBeTrue();
    expect(router.serializeUrl(result as UrlTree)).toBe('/unauthorized');
  });
});
