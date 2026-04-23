import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DatePipe } from '@angular/common';

import { NotificationService } from '../../../../core/services/notification.service';
import { Role } from '../../../../models/app.models';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-admin-notifications',
  standalone: true,
  imports: [DatePipe, StatusBadgeComponent],
  templateUrl: './admin-notifications.component.html',
  styleUrl: './admin-notifications.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminNotificationsComponent {
  private readonly notificationService = inject(NotificationService);
  protected readonly notifications = computed(() =>
    this.notificationService.getNotificationsForRole(Role.Admin),
  );

  constructor() {
    void this.notificationService.loadNotifications();
  }
}
