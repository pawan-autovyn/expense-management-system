import { Injectable, computed, signal } from '@angular/core';

import { DEMO_NOTIFICATIONS } from '../../mock-data/demo-data';
import { NotificationItem, Role } from '../../models/app.models';
import { STORAGE_KEYS } from '../constants/app.constants';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
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

  markAsRead(notificationId: string): void {
    this.notificationsStore.update((notifications) =>
      notifications.map((notification) =>
        notification.id === notificationId ? { ...notification, read: true } : notification,
      ),
    );
    this.persist();
  }

  private restoreNotifications(): NotificationItem[] {
    const value = localStorage.getItem(STORAGE_KEYS.notifications);

    if (!value) {
      return DEMO_NOTIFICATIONS;
    }

    try {
      return JSON.parse(value) as NotificationItem[];
    } catch {
      localStorage.removeItem(STORAGE_KEYS.notifications);

      return DEMO_NOTIFICATIONS;
    }
  }

  private persist(): void {
    localStorage.setItem(STORAGE_KEYS.notifications, JSON.stringify(this.notifications()));
  }
}
