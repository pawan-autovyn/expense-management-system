import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { NotificationItem, Role } from '../../models/app.models';
import { DEMO_NOTIFICATIONS } from '../../mock-data/demo-data';
import { cloneData } from '../../shared/utils/clone-data.util';
import { API_CONFIG } from '../constants/api.constants';
import { STORAGE_KEYS } from '../constants/app.constants';
import { isKarmaTestEnvironment } from '../utils/runtime-mode.util';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private readonly http = inject(HttpClient, { optional: true });
  private readonly notificationsStore = signal<NotificationItem[]>(this.restoreNotifications());

  readonly notifications = this.notificationsStore.asReadonly();
  readonly unreadCount = computed(
    () => this.notifications().filter((notification) => !notification.read).length,
  );

  getNotificationsForRole(role: Role | null): NotificationItem[] {
    return this.notifications().filter(
      (notification) => notification.audience === 'all' || notification.audience === role,
    );
  }

  async loadNotifications(): Promise<NotificationItem[]> {
    if (!this.http) {
      return this.notifications();
    }

    try {
      const notifications = await firstValueFrom(
        this.http.get<NotificationItem[]>(
          `${API_CONFIG.baseUrl}${API_CONFIG.notificationsPath}`,
        ),
      );
      this.replaceNotifications(notifications);

      return notifications;
    } catch {
      return this.notifications();
    }
  }

  replaceNotifications(notifications: NotificationItem[]): void {
    this.notificationsStore.set(notifications);
    this.persist();
  }

  markAsRead(notificationId: string): void {
    this.notificationsStore.update((notifications) =>
      notifications.map((notification) =>
        notification.id === notificationId ? { ...notification, read: true } : notification,
      ),
    );
    this.persist();
    void this.syncReadState(notificationId);
  }

  private restoreNotifications(): NotificationItem[] {
    const value = localStorage.getItem(STORAGE_KEYS.notifications);

    if (!value) {
      return isKarmaTestEnvironment() ? cloneData(DEMO_NOTIFICATIONS) : [];
    }

    try {
      return JSON.parse(value) as NotificationItem[];
    } catch {
      localStorage.removeItem(STORAGE_KEYS.notifications);

      return isKarmaTestEnvironment() ? cloneData(DEMO_NOTIFICATIONS) : [];
    }
  }

  private persist(): void {
    localStorage.setItem(STORAGE_KEYS.notifications, JSON.stringify(this.notifications()));
  }

  private async syncReadState(notificationId: string): Promise<void> {
    if (!this.http) {
      return;
    }

    try {
      await firstValueFrom(
        this.http.patch<NotificationItem>(
          `${API_CONFIG.baseUrl}${API_CONFIG.notificationsPath}/${notificationId}/read`,
          {},
        ),
      );
    } catch {
      return;
    }
  }
}
