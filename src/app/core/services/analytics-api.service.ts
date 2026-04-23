import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { Expense } from '../../models/app.models';
import { API_CONFIG } from '../constants/api.constants';

export interface AdminReportRow {
  id: string;
  date: string;
  employeeName: string;
  templateName: string;
  items: number;
  amount: number;
  remarks: string;
  branch: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Draft';
  requester: string;
  recommender: string;
  adminApprover: string;
  description: string;
  itemAmount: number;
  vendor: string;
  searchBlob: string;
}

export interface AuditEntryView {
  id: string;
  expenseId: string;
  expenseCode: string;
  title: string;
  vendor: string;
  category: string;
  amount: number;
  action: string;
  actionGroup: 'submission' | 'approval' | 'review' | 'draft';
  userName: string;
  actorRole: 'admin' | 'recommender' | 'operation-manager';
  actorRoleLabel: string;
  date: string;
  note: string;
  tone: 'info' | 'success' | 'warning' | 'danger';
  searchBlob: string;
}

export interface ManagerDashboardResponse {
  topCategories: Array<{
    category: {
      id: string;
      name: string;
      description: string;
      icon: string;
      accent: string;
      monthlyBudget: number;
      previousSpend: number;
    };
    spend: number;
    remaining: number;
    usage: number;
    status: 'Within Budget' | 'Near Limit' | 'Over Budget';
    previousSpend: number;
  }>;
  budgetOutSummary: Array<{
    categoryId: string;
    categoryName: string;
    spend: number;
    budget: number;
    overBy: number;
    usage: number;
  }>;
  recentExpenses: Expense[];
  totalBudget: number;
  remainingBudget: number;
  pendingCount: number;
  monthDelta: number;
  approvalSummary: Array<{ label: string; value: number }>;
  timelineItems: Array<{
    id: string;
    title: string;
    description: string;
    date: string;
    tone: 'info' | 'success' | 'warning' | 'danger';
  }>;
}

export interface ManagerBudgetsResponse {
  categoryViews: Array<{
    category: {
      id: string;
      name: string;
      description: string;
      icon: string;
      accent: string;
      monthlyBudget: number;
      previousSpend: number;
    };
    spend: number;
    remaining: number;
    usage: number;
    status: 'Within Budget' | 'Near Limit' | 'Over Budget';
    previousSpend: number;
  }>;
}

export interface RecommenderWorkspaceResponse {
  queueExpenses: Expense[];
  dashboardCards: Array<{
    label: string;
    count: number;
    tone: 'info' | 'success' | 'warning' | 'danger';
  }>;
  recentActivity: Array<{
    id: string;
    title: string;
    action: string;
    note: string;
    date: string;
    tone: 'info' | 'success' | 'warning' | 'danger';
  }>;
  reportRows: {
    categories: Array<{ label: string; amount: number }>;
    statuses: Array<{ label: string; count: number }>;
  };
  trendData: Array<{
    label: string;
    total: number;
    budget: number;
    comparison: number;
  }>;
}

export interface AdminDashboardResponse {
  totalExpenseAmount: number;
  allocatedBudget: number;
  remainingBudget: number;
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
  operationManagerCount: number;
  recommenderCount: number;
  approverCount: number;
  statusSegments: Array<{ label: string; value: number; color: string }>;
  managerSummary: Array<{
    user: {
      id: string;
      name: string;
      email: string;
      role: 'admin' | 'recommender' | 'operation-manager';
      title: string;
      department: string;
      avatarUrl: string;
      assignedBudget: number;
      phone: string;
      location: string;
    };
    spend: number;
    budget: number;
    approvedCount: number;
  }>;
  trendData: Array<{ label: string; total: number; budget: number; comparison: number }>;
  overBudgetCategories: Array<{
    category: {
      id: string;
      name: string;
      description: string;
      icon: string;
      accent: string;
      monthlyBudget: number;
      previousSpend: number;
    };
    spend: number;
    remaining: number;
    usage: number;
    status: 'Within Budget' | 'Near Limit' | 'Over Budget';
    previousSpend: number;
  }>;
  timelineItems: Array<{
    id: string;
    title: string;
    description: string;
    date: string;
    tone: 'info' | 'success' | 'warning' | 'danger';
  }>;
}

export interface AdminBudgetsResponse {
  categories: Array<{
    id: string;
    name: string;
    description: string;
    icon: string;
    accent: string;
    monthlyBudget: number;
    previousSpend: number;
  }>;
  featuredBudgets: Array<{
    id: string;
    title: string;
    assignee: string;
    used: number;
    budget: number;
    percent: number;
    tone: 'success' | 'warning' | 'danger';
  }>;
}

export interface AdminCategoriesResponse {
  categoryViews: Array<{
    category: {
      id: string;
      name: string;
      description: string;
      icon: string;
      accent: string;
      monthlyBudget: number;
      previousSpend: number;
    };
    spend: number;
    remaining: number;
    usage: number;
    status: 'Within Budget' | 'Near Limit' | 'Over Budget';
    previousSpend: number;
  }>;
}

@Injectable({
  providedIn: 'root',
})
export class AnalyticsApiService {
  private readonly http = inject(HttpClient);

  getAdminReports(): Observable<{ rows: AdminReportRow[] }> {
    return this.http.get<{ rows: AdminReportRow[] }>(`${API_CONFIG.baseUrl}/analytics/admin/reports`);
  }

  getAdminDashboard(): Observable<AdminDashboardResponse> {
    return this.http.get<AdminDashboardResponse>(`${API_CONFIG.baseUrl}/analytics/admin/dashboard`);
  }

  getAdminBudgets(): Observable<AdminBudgetsResponse> {
    return this.http.get<AdminBudgetsResponse>(`${API_CONFIG.baseUrl}/analytics/admin/budgets`);
  }

  getAdminCategories(): Observable<AdminCategoriesResponse> {
    return this.http.get<AdminCategoriesResponse>(`${API_CONFIG.baseUrl}/analytics/admin/categories`);
  }

  getAdminNotifications(): Observable<{ notifications: Array<{ id: string; title: string; message: string; date: string; tone: 'info' | 'success' | 'warning' | 'danger'; audience: 'admin' | 'recommender' | 'operation-manager' | 'all'; read: boolean }> }> {
    return this.http.get<{ notifications: Array<{ id: string; title: string; message: string; date: string; tone: 'info' | 'success' | 'warning' | 'danger'; audience: 'admin' | 'recommender' | 'operation-manager' | 'all'; read: boolean }> }>(
      `${API_CONFIG.baseUrl}/analytics/admin/notifications`,
    );
  }

  getAdminAuditTrail(): Observable<{ entries: AuditEntryView[] }> {
    return this.http.get<{ entries: AuditEntryView[] }>(
      `${API_CONFIG.baseUrl}/analytics/admin/audit-trail`,
    );
  }

  getManagerDashboard(): Observable<ManagerDashboardResponse> {
    return this.http.get<ManagerDashboardResponse>(
      `${API_CONFIG.baseUrl}/analytics/manager/dashboard`,
    );
  }

  getManagerBudgets(): Observable<ManagerBudgetsResponse> {
    return this.http.get<ManagerBudgetsResponse>(
      `${API_CONFIG.baseUrl}/analytics/manager/budgets`,
    );
  }

  getRecommenderWorkspace(): Observable<RecommenderWorkspaceResponse> {
    return this.http.get<RecommenderWorkspaceResponse>(
      `${API_CONFIG.baseUrl}/analytics/recommender/workspace`,
    );
  }
}
