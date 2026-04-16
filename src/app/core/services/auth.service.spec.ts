import { TestBed } from '@angular/core/testing';

import { Role } from '../../models/app.models';
import { STORAGE_KEYS } from '../constants/app.constants';
import { DirectoryService } from './directory.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [AuthService, DirectoryService],
    });
    service = TestBed.inject(AuthService);
  });

  it('logs in as admin and stores the session', () => {
    const user = service.loginAs(Role.Admin);

    expect(user.role).toBe(Role.Admin);
    expect(service.isAuthenticated()).toBeTrue();
    expect(service.currentRole()).toBe(Role.Admin);
  });

  it('supports role checks and default routes', () => {
    service.loginAs(Role.OperationManager);

    expect(service.hasRole([Role.OperationManager])).toBeTrue();
    expect(service.hasRole([Role.Admin])).toBeFalse();
    expect(service.getDefaultRouteForRole(Role.OperationManager)).toBe('/operation-manager/dashboard');
    expect(service.getDefaultRouteForRole(Role.Recommender)).toBe('/recommender/dashboard');
  });

  it('clears the session on sign out', () => {
    service.loginAs(Role.Admin);
    service.signOut();

    expect(service.currentUser()).toBeNull();
    expect(localStorage.length).toBe(0);
  });

  it('restores invalid sessions as anonymous users and switches roles', () => {
    localStorage.setItem(STORAGE_KEYS.session, 'not-json');

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [AuthService, DirectoryService],
    });

    service = TestBed.inject(AuthService);

    expect(service.currentUser()).toBeNull();
    expect(service.hasRole([Role.Admin])).toBeFalse();
    expect(service.switchRole(Role.OperationManager).role).toBe(Role.OperationManager);
    expect(service.getDefaultRouteForRole(Role.Admin)).toBe('/admin/dashboard');
    expect(service.getDefaultRouteForRole(null)).toBe('/operation-manager/dashboard');
  });
});
