export enum Role {
  Admin = 'admin',
  Recommender = 'recommender',
  OperationManager = 'operation-manager',
}

export enum ThemeMode {
  Light = 'light',
}

export enum ApprovalStage {
  OperationManager = 'operation-manager',
  Recommender = 'recommender',
  Approver = 'approver',
}

export enum BudgetStatus {
  WithinBudget = 'Within Budget',
  NearLimit = 'Near Limit',
  OverBudget = 'Over Budget',
}

export enum ExpenseStatus {
  Draft = 'Draft',
  Submitted = 'Submitted',
  Recommended = 'Recommended',
  Reopened = 'Reopened',
  UnderReview = 'Under Review',
  Approved = 'Approved',
  Rejected = 'Rejected',
  Cancelled = 'Cancelled',
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

export interface Location {
  id: string;
  name: string;
  city: string;
  code: string;
  active: boolean;
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

export interface Budget {
  id: string;
  categoryId: string;
  locationId: string;
  annualBudget: number;
  spent: number;
  active: boolean;
  notes: string;
  updatedAt: string;
}

export interface Attachment {
  id: string;
  key?: string;
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
  locationId?: string;
  employeeId?: string;
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
  approvalStage?: ApprovalStage;
  remarks?: string[];
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

export interface LocationSpendSummary {
  location: Location;
  spend: number;
  budget: number;
  variance: number;
}

export interface ExpenseFilters {
  searchTerm: string;
  categoryId: string;
  status: ExpenseStatus | 'all';
  managerId: string;
  locationId?: string;
  dateRange:
    | '7d'
    | '30d'
    | '90d'
    | 'current-year'
    | 'last-month'
    | 'last-year'
    | 'last-2-years'
    | 'custom'
    | 'all';
  dateFrom?: string;
  dateTo?: string;
  sortBy: 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc';
}

export interface ExpenseFormValue {
  title: string;
  categoryId: string;
  locationId: string;
  amount: number;
  date: string;
  description: string;
  vendor: string;
  tags: string[];
  receipt?: Attachment;
}
