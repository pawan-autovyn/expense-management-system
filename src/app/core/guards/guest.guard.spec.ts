import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, UrlTree } from '@angular/router';

import { Role } from '../../models/app.models';
import { DirectoryService } from '../services/directory.service';
import { AuthService } from '../services/auth.service';
import { guestGuard } from './guest.guard';

describe('guestGuard', () => {
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

  it('allows guests to continue', () => {
    const result = TestBed.runInInjectionContext(() =>
      guestGuard({} as never, {} as never),
    );

    expect(result).toBeTrue();
  });

  it('redirects authenticated users to the role home page', () => {
    authService.loginAs(Role.OperationManager);

    const result = TestBed.runInInjectionContext(() =>
      guestGuard({} as never, {} as never),
    );

    expect(result instanceof UrlTree).toBeTrue();
    expect(router.serializeUrl(result as UrlTree)).toBe('/manager/dashboard');
  });
});
