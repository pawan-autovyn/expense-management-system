import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { NotificationItem, Role } from '../../models/app.models';
import { DEMO_NOTIFICATIONS } from '../../mock-data/demo-data';
import { cloneData } from '../../shared/utils/clone-data.util';
import { API_CONFIG } from '../constants/api.constants';
import { STORAGE_KEYS } from '../constants/app.constants';
import { isKarmaTestEnvironment } from '../utils/runtime-mode.util';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private readonly http = inject(HttpClient, { optional: true });
  private readonly notificationsStore = signal<NotificationItem[]>(this.restoreNotifications());
  private readonly toastService = inject(ToastService);
  private pollingHandle: number | null = null;
  private hasLoadedLiveNotifications = false;

  readonly notifications = this.notificationsStore.asReadonly();
  readonly unreadCount = computed(
    () => this.notifications().filter((notification) => !notification.read).length,
  );

  getNotificationCenterRoute(role: Role | null): string | null {
    if (role === Role.Admin) {
      return '/admin/notifications';
    }

    if (role === Role.Recommender) {
      return '/recommender/recommendation';
    }

    if (role === Role.OperationManager) {
      return '/operation-manager/notifications';
    }

    return null;
  }

  resolveNotificationRoute(notification: NotificationItem, role: Role | null): string | null {
    const content = `${notification.title} ${notification.message}`.toLowerCase();

    if (role === Role.Admin) {
      if (content.includes('budget') || content.includes('allocation') || content.includes('monthly limit')) {
        return '/admin/budget';
      }

      if (
        content.includes('recommend') ||
        content.includes('forward') ||
        content.includes('approval') ||
        content.includes('review')
      ) {
        return '/admin/approval';
      }

      return '/admin/expenses';
    }

    if (role === Role.Recommender) {
      if (
        content.includes('submitted') ||
        content.includes('submission') ||
        content.includes('reopen') ||
        content.includes('review') ||
        content.includes('recommend')
      ) {
        return '/recommender/recommendation';
      }

      return '/recommender/expenses';
    }

    if (role === Role.OperationManager) {
      if (
        content.includes('budget') ||
        content.includes('allocation') ||
        content.includes('monthly limit')
      ) {
        return '/operation-manager/budget';
      }

      if (content.includes('reopen') || content.includes('update') || content.includes('changes')) {
        return '/operation-manager/add-expense';
      }

      return '/operation-manager/my-expenses';
    }

    return null;
  }

  getNotificationActionLabel(notification: NotificationItem, role: Role | null): string {
    const route = this.resolveNotificationRoute(notification, role);

    if (route === '/admin/approval') {
      return 'Open approval queue';
    }

    if (route === '/admin/budget') {
      return 'Open budget workspace';
    }

    if (route === '/admin/expenses') {
      return 'Open expense records';
    }

    if (route === '/recommender/recommendation') {
      return 'Open recommendation queue';
    }

    if (route === '/recommender/expenses') {
      return 'Open review workspace';
    }

    if (route === '/operation-manager/add-expense') {
      return 'Open update form';
    }

    if (route === '/operation-manager/budget') {
      return 'Open budget overview';
    }

    return 'Open my expenses';
  }

  getNotificationsForRole(role: Role | null): NotificationItem[] {
    return this.sortNotifications(
      this.notifications().filter(
        (notification) => notification.audience === 'all' || notification.audience === role,
      ),
    );
  }

  getUnreadCountForRole(role: Role | null): number {
    return this.getNotificationsForRole(role).filter((notification) => !notification.read).length;
  }

  async loadNotifications(): Promise<NotificationItem[]> {
    if (!this.http) {
      return this.notifications();
    }

    try {
      const previousUnreadIds = new Set(
        this.notifications()
          .filter((notification) => !notification.read)
          .map((notification) => notification.id),
      );
      const notifications = await firstValueFrom(
        this.http.get<NotificationItem[]>(
          `${API_CONFIG.baseUrl}${API_CONFIG.notificationsPath}`,
        ),
      );
      this.replaceNotifications(notifications);
      this.emitNotificationToasts(notifications, previousUnreadIds);
      this.hasLoadedLiveNotifications = true;

      return notifications;
    } catch {
      return this.notifications();
    }
  }

  startPolling(intervalMs = 15000): void {
    if (this.pollingHandle !== null) {
      return;
    }

    this.pollingHandle = window.setInterval(() => {
      void this.loadNotifications();
    }, intervalMs);
  }

  stopPolling(): void {
    if (this.pollingHandle === null) {
      return;
    }

    window.clearInterval(this.pollingHandle);
    this.pollingHandle = null;
  }

  replaceNotifications(notifications: NotificationItem[]): void {
    this.notificationsStore.set(this.sortNotifications(notifications));
    this.persist();
  }

  createNotification(
    notification: Omit<NotificationItem, 'id' | 'date' | 'read'> &
      Partial<Pick<NotificationItem, 'id' | 'date' | 'read'>>,
  ): NotificationItem {
    const nextNotification: NotificationItem = {
      id: notification.id ?? `notification-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      date: notification.date ?? new Date().toISOString(),
      read: notification.read ?? false,
      title: notification.title,
      message: notification.message,
      tone: notification.tone,
      audience: notification.audience,
    };

    this.notificationsStore.update((notifications) =>
      this.sortNotifications([
        nextNotification,
        ...notifications.filter((entry) => entry.id !== nextNotification.id),
      ]),
    );
    this.persist();

    return nextNotification;
  }

  async markAsRead(notificationId: string): Promise<void> {
    this.notificationsStore.update((notifications) =>
      notifications.map((notification) =>
        notification.id === notificationId ? { ...notification, read: true } : notification,
      ),
    );
    this.persist();
    await this.syncReadState(notificationId);
  }

  async markAllAsRead(): Promise<void> {
    this.notificationsStore.update((notifications) =>
      notifications.map((notification) => ({ ...notification, read: true })),
    );
    this.persist();

    if (!this.http) {
      return;
    }

    try {
      await firstValueFrom(
        this.http.patch<{ updatedCount: number }>(
          `${API_CONFIG.baseUrl}${API_CONFIG.notificationsPath}/read-all`,
          {},
        ),
      );
    } catch {
      return;
    }
  }

  private restoreNotifications(): NotificationItem[] {
    const value = localStorage.getItem(STORAGE_KEYS.notifications);

    if (!value) {
      return isKarmaTestEnvironment() ? cloneData(DEMO_NOTIFICATIONS) : [];
    }

    try {
      return this.sortNotifications(JSON.parse(value) as NotificationItem[]);
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

  private emitNotificationToasts(
    notifications: NotificationItem[],
    previousUnreadIds: Set<string>,
  ): void {
    if (!this.hasLoadedLiveNotifications) {
      return;
    }

    const nextUnreadNotifications = notifications.filter((notification) => !notification.read);

    for (const notification of nextUnreadNotifications) {
      if (previousUnreadIds.has(notification.id)) {
        continue;
      }

      this.toastService.show({
        title: notification.title,
        message: notification.message,
        tone: notification.tone,
        durationMs: 5200,
      });
    }
  }

  private sortNotifications(notifications: NotificationItem[]): NotificationItem[] {
    return [...notifications].sort(
      (left, right) => new Date(right.date).getTime() - new Date(left.date).getTime(),
    );
  }
}
