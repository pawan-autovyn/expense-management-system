import { NavItem, Role } from '../../models/app.models';

export const NAVIGATION_ITEMS: NavItem[] = [
  { label: 'Dashboard', icon: 'dashboard', route: '/admin/dashboard', roles: [Role.Admin] },
  { label: 'Expense Register', icon: 'receipt', route: '/admin/expenses', roles: [Role.Admin] },
  { label: 'Approvals Queue', icon: 'check-circle', route: '/admin/approvals', roles: [Role.Admin] },
  { label: 'Audit Trail', icon: 'activity', route: '/admin/audit-trail', roles: [Role.Admin] },
  { label: 'Template Report', icon: 'layers', route: '/admin/reports', roles: [Role.Admin] },
  { label: 'Add Budget', icon: 'wallet', route: '/admin/budgets', roles: [Role.Admin] },
  { label: 'Manage Categories', icon: 'activity', route: '/admin/categories', roles: [Role.Admin] },
  {
    label: 'Notifications',
    icon: 'bell',
    route: '/admin/notifications',
    roles: [Role.Admin],
    badge: '4',
  },
  { label: 'Settings', icon: 'settings', route: '/admin/settings', roles: [Role.Admin] },
  {
    label: 'Dashboard',
    icon: 'dashboard',
    route: '/manager/dashboard',
    roles: [Role.OperationManager],
  },
  {
    label: 'Add Expense',
    icon: 'plus-circle',
    route: '/manager/add-expense',
    roles: [Role.OperationManager],
  },
  {
    label: 'My Expenses',
    icon: 'receipt',
    route: '/manager/expenses',
    roles: [Role.OperationManager],
  },
  {
    label: 'Budget Overview',
    icon: 'wallet',
    route: '/manager/budgets',
    roles: [Role.OperationManager],
  },
  {
    label: 'Settings',
    icon: 'settings',
    route: '/manager/profile',
    roles: [Role.OperationManager],
  },
  {
    label: 'Notifications',
    icon: 'bell',
    route: '/manager/notifications',
    roles: [Role.OperationManager],
    badge: '3',
  },
];
