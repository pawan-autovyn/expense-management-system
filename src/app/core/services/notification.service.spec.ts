import { TestBed } from '@angular/core/testing';

import { Role } from '../../models/app.models';
import { STORAGE_KEYS } from '../constants/app.constants';
import { NotificationService } from './notification.service';

describe('NotificationService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('loads demo notifications when storage is empty', () => {
    TestBed.configureTestingModule({
      providers: [NotificationService],
    });

    const service = TestBed.inject(NotificationService);

    expect(service.notifications().length).toBeGreaterThan(0);
    expect(service.unreadCount()).toBeGreaterThan(0);
  });

  it('removes invalid storage payloads and marks notifications as read', () => {
    localStorage.setItem(STORAGE_KEYS.notifications, 'not-json');
    TestBed.configureTestingModule({
      providers: [NotificationService],
    });

    const service = TestBed.inject(NotificationService);
    const firstNotification = service.notifications()[0];
    const originalUnread = service.unreadCount();

    expect(firstNotification).toBeDefined();
    expect(localStorage.getItem(STORAGE_KEYS.notifications)).not.toBe('not-json');

    service.markAsRead(firstNotification.id);

    expect(service.unreadCount()).toBe(Math.max(originalUnread - 1, 0));
    expect(service.notifications()[0].read).toBeTrue();
  });

  it('filters notifications by role and all-audience items', () => {
    TestBed.configureTestingModule({
      providers: [NotificationService],
    });

    const service = TestBed.inject(NotificationService);
    const adminNotifications = service.getNotificationsForRole(Role.Admin);
    const managerNotifications = service.getNotificationsForRole(Role.OperationManager);

    expect(
      adminNotifications.every((item) => item.audience === 'all' || item.audience === Role.Admin),
    ).toBeTrue();
    expect(
      managerNotifications.every(
        (item) => item.audience === 'all' || item.audience === Role.OperationManager,
      ),
    ).toBeTrue();
  });
});
