import { TestBed } from '@angular/core/testing';

import { Role } from '../../models/app.models';
import { STORAGE_KEYS } from '../constants/app.constants';
import { NotificationService } from './notification.service';

describe('NotificationService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('loads seeded notifications when storage is empty', () => {
    TestBed.configureTestingModule({
      providers: [NotificationService],
    });

    const service = TestBed.inject(NotificationService);

    expect(service.notifications().length).toBeGreaterThan(0);
    expect(service.unreadCount()).toBeGreaterThan(0);
  });

  it('removes invalid storage payloads and marks notifications as read', async () => {
    localStorage.setItem(STORAGE_KEYS.notifications, 'not-json');
    TestBed.configureTestingModule({
      providers: [NotificationService],
    });

    const service = TestBed.inject(NotificationService);
    const firstNotification = service.notifications()[0];
    const originalUnread = service.unreadCount();

    expect(firstNotification).toBeDefined();
    expect(localStorage.getItem(STORAGE_KEYS.notifications)).not.toBe('not-json');

    await service.markAsRead(firstNotification.id);

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

  it('creates a new manager notification and keeps the latest item first', () => {
    TestBed.configureTestingModule({
      providers: [NotificationService],
    });

    const service = TestBed.inject(NotificationService);
    const created = service.createNotification({
      title: 'Budget updated by admin',
      message: 'Admin updated Tea and Pantry to Rs 120,000 yearly.',
      tone: 'success',
      audience: Role.OperationManager,
      date: '2026-04-23T12:00:00+05:30',
    });

    expect(service.notifications()[0].id).toBe(created.id);
    expect(service.getNotificationsForRole(Role.OperationManager)[0].title).toBe(
      'Budget updated by admin',
    );
  });

  it('resolves notification destinations for each role', () => {
    TestBed.configureTestingModule({
      providers: [NotificationService],
    });

    const service = TestBed.inject(NotificationService);

    expect(service.getNotificationCenterRoute(Role.Admin)).toBe('/admin/notifications');
    expect(service.getNotificationCenterRoute(Role.Recommender)).toBe('/recommender/recommendation');
    expect(service.getNotificationCenterRoute(Role.OperationManager)).toBe('/operation-manager/notifications');

    expect(
      service.resolveNotificationRoute(
        {
          id: 'recommender-item',
          title: 'Recommendation queue is ready',
          message: 'There are submitted expenses waiting for recommendation.',
          date: '2026-04-11T12:45:00+05:30',
          tone: 'warning',
          audience: Role.Recommender,
          read: false,
        },
        Role.Recommender,
      ),
    ).toBe('/recommender/recommendation');

    expect(
      service.resolveNotificationRoute(
        {
          id: 'admin-item',
          title: 'Two expenses pending review',
          message: 'Gas refill and printer toner purchases need finance review today.',
          date: '2026-04-02T11:48:00+05:30',
          tone: 'info',
          audience: Role.Admin,
          read: false,
        },
        Role.Admin,
      ),
    ).toBe('/admin/approval');

    expect(
      service.resolveNotificationRoute(
        {
          id: 'manager-item',
          title: 'Expense reopened',
          message: 'Please update the bill and submit the changes again.',
          date: '2026-04-02T11:48:00+05:30',
          tone: 'warning',
          audience: Role.OperationManager,
          read: false,
        },
        Role.OperationManager,
      ),
    ).toBe('/operation-manager/add-expense');

    expect(
      service.resolveNotificationRoute(
        {
          id: 'manager-budget-item',
          title: 'Budget updated by admin',
          message: 'Admin updated pantry budget and monthly limit.',
          date: '2026-04-23T12:00:00+05:30',
          tone: 'success',
          audience: Role.OperationManager,
          read: false,
        },
        Role.OperationManager,
      ),
    ).toBe('/operation-manager/budget');
  });
});
