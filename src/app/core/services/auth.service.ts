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

  loginWithCredentials(identifier: string, password: string): User | null {
    const normalizedIdentifier = identifier.trim().toLowerCase();
    const user = this.directoryService.getUsers().find((candidate) => {
      const email = candidate.email.toLowerCase();
      const id = candidate.id.toLowerCase();
      const username = candidate.name.toLowerCase().split(' ')[0] ?? '';
      const shortName = candidate.name.toLowerCase().replace(/\s+/g, '');

      return password
        ? [id, email, username, shortName].includes(normalizedIdentifier) && password.length > 0
        : [id, email, username, shortName].includes(normalizedIdentifier);
    });

    if (!user) {
      return null;
    }

    this.persistSession(user);

    return user;
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

    if (role === Role.Recommender) {
      return '/recommender/dashboard';
    }

    if (role === Role.OperationManager) {
      return '/operation-manager/dashboard';
    }

    return '/operation-manager/dashboard';
  }

  getProfileRouteForRole(role: Role | null): string {
    if (role === Role.Admin) {
      return '/admin/profile';
    }

    if (role === Role.Recommender) {
      return '/recommender/profile';
    }

    if (role === Role.OperationManager) {
      return '/operation-manager/profile';
    }

    return '/operation-manager/profile';
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
