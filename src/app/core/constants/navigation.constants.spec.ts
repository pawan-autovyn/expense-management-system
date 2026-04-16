import { Role } from '../../models/app.models';
import { SIDEBAR_CONFIG, getSidebarItemsForRole } from './navigation.constants';

describe('navigation constants', () => {
  it('keeps role-based navigation grouped by role', () => {
    expect(SIDEBAR_CONFIG['operation-manager'].map((item) => item.route)).toEqual([
      '/operation-manager/dashboard',
      '/operation-manager/add-expense',
      '/operation-manager/my-expenses',
      '/operation-manager/budget',
    ]);
    expect(SIDEBAR_CONFIG.recommender.map((item) => item.route)).toEqual([
      '/recommender/dashboard',
      '/recommender/recommendation',
      '/recommender/expenses',
      '/recommender/reports',
      '/recommender/budget',
    ]);
    expect(SIDEBAR_CONFIG.admin.map((item) => item.route)).toEqual([
      '/admin/dashboard',
      '/admin/approval',
      '/admin/expenses',
      '/admin/budget',
      '/admin/category',
      '/admin/reports',
      '/admin/audit',
    ]);
  });

  it('returns the matching menu for each role', () => {
    expect(getSidebarItemsForRole(Role.OperationManager)).toBe(SIDEBAR_CONFIG['operation-manager']);
    expect(getSidebarItemsForRole(Role.Recommender)).toBe(SIDEBAR_CONFIG.recommender);
    expect(getSidebarItemsForRole(Role.Admin)).toBe(SIDEBAR_CONFIG.admin);
    expect(getSidebarItemsForRole(null)).toEqual([]);
  });
});
