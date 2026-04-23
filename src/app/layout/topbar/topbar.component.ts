import { ChangeDetectionStrategy, Component, HostListener, OnDestroy, computed, inject, signal } from '@angular/core';
import { DatePipe, NgClass } from '@angular/common';
import { Router } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { NotificationItem } from '../../models/app.models';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [DatePipe, NgClass, IconComponent],
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopbarComponent implements OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);

  protected readonly currentUser = this.authService.currentUser;
  protected readonly notificationPanelOpen = signal(false);
  protected readonly roleLabel = computed(() => this.formatRole(this.authService.currentRole()));
  protected readonly initials = computed(() => this.createInitials(this.currentUser()?.name ?? 'Guest'));
  protected readonly profileRoute = computed(() =>
    this.authService.getProfileRouteForRole(this.authService.currentRole()),
  );
  protected readonly currentRole = this.authService.currentRole;
  protected readonly notifications = computed(() =>
    this.notificationService.getNotificationsForRole(this.currentRole()),
  );
  protected readonly unreadCount = computed(() =>
    this.notificationService.getUnreadCountForRole(this.currentRole()),
  );

  constructor() {
    void this.notificationService.loadNotifications();
    this.notificationService.startPolling();
  }

  ngOnDestroy(): void {
    this.notificationService.stopPolling();
  }

  protected logout(): void {
    this.notificationPanelOpen.set(false);
    this.notificationService.stopPolling();
    this.authService.signOut();
    void this.router.navigateByUrl('/login');
  }

  protected openProfile(): void {
    void this.router.navigateByUrl(this.profileRoute());
  }

  protected async toggleNotifications(): Promise<void> {
    const nextState = !this.notificationPanelOpen();

    this.notificationPanelOpen.set(nextState);

    if (nextState) {
      await this.notificationService.loadNotifications();
    }
  }

  protected async markNotificationAsRead(notificationId: string): Promise<void> {
    await this.notificationService.markAsRead(notificationId);
  }

  protected async markAllAsRead(): Promise<void> {
    await this.notificationService.markAllAsRead();
    this.toastService.showInfo('Notifications updated', 'All visible notifications were marked as read.');
  }

  protected closeNotifications(): void {
    this.notificationPanelOpen.set(false);
  }

  protected getNotificationRoute(): string | null {
    return this.notificationService.getNotificationCenterRoute(this.currentRole());
  }

  protected getNotificationActionLabel(notification: NotificationItem): string {
    return this.notificationService.getNotificationActionLabel(notification, this.currentRole());
  }

  protected async openNotification(notification: NotificationItem): Promise<void> {
    await this.notificationService.markAsRead(notification.id);

    const route = this.notificationService.resolveNotificationRoute(notification, this.currentRole());

    this.notificationPanelOpen.set(false);

    if (route) {
      await this.router.navigateByUrl(route);
    }
  }

  protected async openNotificationsPage(): Promise<void> {
    const route = this.getNotificationRoute();

    if (!route) {
      return;
    }

    this.notificationPanelOpen.set(false);
    await this.router.navigateByUrl(route);
  }

  @HostListener('document:click')
  protected handleDocumentClick(): void {
    if (!this.notificationPanelOpen()) {
      return;
    }

    this.notificationPanelOpen.set(false);
  }

  protected stopEvent(event: Event): void {
    event.stopPropagation();
  }

  private formatRole(role: string | null): string {
    if (!role) {
      return 'Guest session';
    }

    return role
      .split('-')
      .map((segment) => this.toTitle(segment))
      .join(' ');
  }

  private createInitials(name: string): string {
    const parts = name
      .split(/\s+/)
      .map((part) => part.trim())
      .filter(Boolean);

    return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('');
  }

  private toTitle(value: string): string {
    return value
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (letter) => letter.toUpperCase())
      .trim();
  }
}
