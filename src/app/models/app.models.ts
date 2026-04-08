export enum Role {
  Admin = 'admin',
  OperationManager = 'operation-manager',
}

export enum ThemeMode {
  Dark = 'dark',
  Light = 'light',
}

export enum BudgetStatus {
  WithinBudget = 'Within Budget',
  NearLimit = 'Near Limit',
  OverBudget = 'Over Budget',
}

export enum ExpenseStatus {
  Draft = 'Draft',
  Submitted = 'Submitted',
  UnderReview = 'Under Review',
  Approved = 'Approved',
  Rejected = 'Rejected',
  OverBudget = 'Over Budget',
}

export type NotificationTone = 'info' | 'success' | 'warning' | 'danger';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  title: string;
  department: string;
  avatarUrl: string;
  assignedBudget: number;
  phone: string;
  location: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
  accent: string;
  monthlyBudget: number;
  previousSpend: number;
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  mimeType: string;
}

export interface AuditTrailEntry {
  id: string;
  action: string;
  actor: string;
  actorRole: Role;
  date: string;
  note: string;
  tone: NotificationTone;
}

export interface Expense {
  id: string;
  title: string;
  categoryId: string;
  amount: number;
  date: string;
  description: string;
  vendor: string;
  tags: string[];
  managerId: string;
  status: ExpenseStatus;
  createdAt: string;
  updatedAt: string;
  receipt?: Attachment;
  auditTrail: AuditTrailEntry[];
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  date: string;
  tone: NotificationTone;
  audience: Role | 'all';
  read: boolean;
}

export interface TrendPoint {
  label: string;
  total: number;
  budget: number;
  comparison: number;
}

export interface InsightCard {
  id: string;
  title: string;
  description: string;
  tone: NotificationTone;
  delta: number;
}

export interface NavItem {
  label: string;
  icon: string;
  route: string;
  roles: Role[];
  badge?: string;
}

export interface CategoryBudgetView {
  category: Category;
  spend: number;
  remaining: number;
  usage: number;
  status: BudgetStatus;
  previousSpend: number;
}

export interface ManagerSpendSummary {
  user: User;
  spend: number;
  budget: number;
  approvedCount: number;
}

export interface ExpenseFilters {
  searchTerm: string;
  categoryId: string;
  status: ExpenseStatus | 'all';
  managerId: string;
  dateRange: '7d' | '30d' | '90d' | 'all';
  sortBy: 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc';
}

export interface ExpenseFormValue {
  title: string;
  categoryId: string;
  amount: number;
  date: string;
  description: string;
  vendor: string;
  tags: string[];
  receipt?: Attachment;
}
