import { HttpClient } from '@angular/common/http';
import { Injectable, computed, signal } from '@angular/core';
import { inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { Role, User } from '../../models/app.models';
import { API_CONFIG } from '../constants/api.constants';
import { STORAGE_KEYS } from '../constants/app.constants';
import { isKarmaTestEnvironment } from '../utils/runtime-mode.util';
import { DirectoryService } from './directory.service';
import { ExpenseRepositoryService } from './expense-repository.service';
import { NotificationService } from './notification.service';

interface StoredSession {
  accessToken: string;
}

interface AuthApiResponse {
  accessToken: string;
  user: User;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly restoredSession = this.restoreSession();
  private readonly sessionStore = signal<User | null>(null);
  private readonly accessTokenStore = signal<string | null>(this.restoredSession?.accessToken ?? null);
  private readonly http = inject(HttpClient, { optional: true });
  private readonly directoryService = inject(DirectoryService);
  private readonly expenseRepository = inject(ExpenseRepositoryService);
  private readonly notificationService = inject(NotificationService);
  private sessionBootstrapped = false;

  readonly currentUser = this.sessionStore.asReadonly();
  readonly isAuthenticated = computed(() => this.currentUser() !== null);
  readonly currentRole = computed(() => this.currentUser()?.role ?? null);

  loginAs(role: Role): User {
    const user = this.directoryService.getDefaultUserByRole(role);
    this.setSessionUser(user);
    this.persistAccessToken('local-dev-session');

    return user;
  }

  switchRole(role: Role): User {
    return this.loginAs(role);
  }

  loginWithCredentials(identifier: string, password: string): User | null | Promise<User | null> {
    if (this.http) {
      return this.loginWithApi(identifier, password);
    }

    return this.loginLocally(identifier, password);
  }

  async refreshSession(): Promise<void> {
    if (!this.http || !this.accessToken()) {
      return;
    }

    try {
      const response = await firstValueFrom(
        this.http.get<AuthApiResponse>(`${API_CONFIG.baseUrl}/auth/session`),
      );
      this.setSessionUser(response.user);
      this.persistAccessToken(response.accessToken);
    } catch {
      this.signOut();
    }
  }

  async ensureSessionReady(): Promise<boolean> {
    if (!this.hasStoredSession()) {
      return false;
    }

    if (!this.currentUser() && this.accessToken()) {
      await this.refreshSession();
    }

    const user = this.currentUser();

    if (!user) {
      return false;
    }

    if (!this.sessionBootstrapped) {
      await this.directoryService.loadWorkspaceData();
      await this.notificationService.loadNotifications();

      await this.expenseRepository.loadExpenses();
      this.sessionBootstrapped = true;
    }

    return true;
  }

  hasStoredSession(): boolean {
    return Boolean(this.currentUser() || this.accessToken());
  }

  signOut(): void {
    this.sessionStore.set(null);
    this.accessTokenStore.set(null);
    this.sessionBootstrapped = false;
    localStorage.removeItem(STORAGE_KEYS.session);
    localStorage.removeItem(STORAGE_KEYS.expenses);
    localStorage.removeItem(STORAGE_KEYS.notifications);
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

  accessToken(): string | null {
    return this.accessTokenStore();
  }

  private async loginWithApi(identifier: string, password: string): Promise<User | null> {
    try {
      const response = await firstValueFrom(
        this.http!.post<AuthApiResponse>(`${API_CONFIG.baseUrl}/auth/login`, {
          identifier,
          password,
        }),
      );
      this.setSessionUser(response.user);
      this.persistAccessToken(response.accessToken);

      return response.user;
    } catch {
      return isKarmaTestEnvironment() ? this.loginLocally(identifier, password) : null;
    }
  }

  private loginLocally(identifier: string, password: string): User | null {
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

    this.setSessionUser(user);
    this.persistAccessToken('local-dev-session');

    return user;
  }

  private setSessionUser(user: User): void {
    this.sessionStore.set(user);
    this.sessionBootstrapped = false;
  }

  private persistAccessToken(accessToken: string | null): void {
    this.accessTokenStore.set(accessToken);

    if (!accessToken) {
      localStorage.removeItem(STORAGE_KEYS.session);

      return;
    }

    localStorage.setItem(
      STORAGE_KEYS.session,
      JSON.stringify({
        accessToken,
      } satisfies StoredSession),
    );
  }

  private restoreSession(): StoredSession | null {
    const sessionValue = localStorage.getItem(STORAGE_KEYS.session);

    if (!sessionValue) {
      return null;
    }

    try {
      const parsedSession = JSON.parse(sessionValue) as StoredSession | User;

      if ('accessToken' in parsedSession && typeof parsedSession.accessToken === 'string') {
        return {
          accessToken: parsedSession.accessToken,
        };
      }

      localStorage.removeItem(STORAGE_KEYS.session);
      return null;
    } catch {
      localStorage.removeItem(STORAGE_KEYS.session);

      return null;
    }
  }
}
