import { Injectable, computed, signal } from '@angular/core';
import { inject } from '@angular/core';

import { Role, User } from '../../models/app.models';
import { STORAGE_KEYS } from '../constants/app.constants';
import { DirectoryService } from './directory.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly sessionStore = signal<User | null>(this.restoreSession());
  private readonly directoryService = inject(DirectoryService);

  readonly currentUser = this.sessionStore.asReadonly();
  readonly isAuthenticated = computed(() => this.currentUser() !== null);
  readonly currentRole = computed(() => this.currentUser()?.role ?? null);

  loginAs(role: Role): User {
    const user = this.directoryService.getDefaultUserByRole(role);
    this.persistSession(user);

    return user;
  }

  switchRole(role: Role): User {
    return this.loginAs(role);
  }

  signOut(): void {
    this.sessionStore.set(null);
    localStorage.removeItem(STORAGE_KEYS.session);
  }

  hasRole(allowedRoles: Role[]): boolean {
    const activeRole = this.currentRole();

    return activeRole ? allowedRoles.includes(activeRole) : false;
  }

  getDefaultRouteForRole(role: Role | null): string {
    if (role === Role.Admin) {
      return '/admin/dashboard';
    }

    return '/manager/dashboard';
  }

  private persistSession(user: User): void {
    this.sessionStore.set(user);
    localStorage.setItem(STORAGE_KEYS.session, JSON.stringify(user));
  }

  private restoreSession(): User | null {
    const sessionValue = localStorage.getItem(STORAGE_KEYS.session);

    if (!sessionValue) {
      return null;
    }

    try {
      return JSON.parse(sessionValue) as User;
    } catch {
      localStorage.removeItem(STORAGE_KEYS.session);

      return null;
    }
  }
}
