import { Role } from '../../models/app.models';

export interface SidebarNavItem {
  label: string;
  icon: string;
  route: string;
  badge?: string;
}

export type SidebarRoleKey = 'operation-manager' | 'recommender' | 'admin';

export const SIDEBAR_CONFIG: Record<SidebarRoleKey, SidebarNavItem[]> = {
  'operation-manager': [
    { label: 'Dashboard', icon: 'dashboard', route: '/operation-manager/dashboard' },
    { label: 'Add Expense', icon: 'plus-circle', route: '/operation-manager/add-expense' },
    { label: 'My Expenses', icon: 'receipt', route: '/operation-manager/my-expenses' },
    { label: 'Budget Overview', icon: 'wallet', route: '/operation-manager/budget' },
    { label: 'Notifications', icon: 'bell', route: '/operation-manager/notifications' },
    { label: 'Profile', icon: 'user-circle', route: '/operation-manager/profile' },
  ],
  recommender: [
    { label: 'Dashboard', icon: 'dashboard', route: '/recommender/dashboard' },
    { label: 'Recommendation Queue', icon: 'check-circle', route: '/recommender/recommendation' },
    { label: 'Expense Review', icon: 'receipt', route: '/recommender/expenses' },
    { label: 'Reports', icon: 'layers', route: '/recommender/reports' },
    { label: 'Budget Overview', icon: 'wallet', route: '/recommender/budget' },
    { label: 'Profile', icon: 'user-circle', route: '/recommender/profile' },
  ],
  admin: [
    { label: 'Dashboard', icon: 'dashboard', route: '/admin/dashboard' },
    { label: 'Approval Queue', icon: 'check-circle', route: '/admin/approval' },
    { label: 'View Expenses', icon: 'receipt', route: '/admin/expenses' },
    { label: 'Budget Management', icon: 'wallet', route: '/admin/budget' },
    { label: 'Notifications', icon: 'bell', route: '/admin/notifications' },
    { label: 'Category Management', icon: 'settings', route: '/admin/category' },
    { label: 'Reports', icon: 'layers', route: '/admin/reports' },
    { label: 'Audit Trail', icon: 'activity', route: '/admin/audit' },
    { label: 'Profile', icon: 'user-circle', route: '/admin/profile' },
  ],
};

export function getSidebarItemsForRole(role: Role | null): SidebarNavItem[] {
  switch (role) {
    case Role.OperationManager:
      return SIDEBAR_CONFIG['operation-manager'];
    case Role.Recommender:
      return SIDEBAR_CONFIG.recommender;
    case Role.Admin:
      return SIDEBAR_CONFIG.admin;
    default:
      return [];
  }
}
