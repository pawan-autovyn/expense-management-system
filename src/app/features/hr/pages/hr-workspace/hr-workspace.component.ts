import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe, NgClass } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';

import { AnalyticsApiService, RecommenderWorkspaceResponse } from '../../../../core/services/analytics-api.service';
import { AuthService } from '../../../../core/services/auth.service';
import { DirectoryService } from '../../../../core/services/directory.service';
import { ExpenseRepositoryService } from '../../../../core/services/expense-repository.service';
import { ToastService } from '../../../../core/services/toast.service';
import { Expense, ExpenseStatus, Role } from '../../../../models/app.models';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { LineChartComponent } from '../../../../shared/components/line-chart/line-chart.component';
import { SearchInputComponent } from '../../../../shared/components/search-input/search-input.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';

interface ReportSummary {
  label: string;
  count: number;
  tone: 'info' | 'success' | 'warning' | 'danger';
}

type DashboardRange = 'current-year' | 'last-year' | 'last-2-years' | 'custom' | 'all';
type PendingQueueAction = 'recommend' | 'reject' | 'reopen';

@Component({
  selector: 'app-hr-workspace',
  standalone: true,
  imports: [
    CurrencyPipe,
    DatePipe,
    NgClass,
    FormsModule,
    ConfirmDialogComponent,
    LineChartComponent,
    SearchInputComponent,
    StatusBadgeComponent,
  ],
  templateUrl: './hr-workspace.component.html',
  styleUrl: './hr-workspace.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HrWorkspaceComponent {
  private readonly analyticsApi = inject(AnalyticsApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);
  protected readonly directoryService = inject(DirectoryService);
  private readonly expenseRepository = inject(ExpenseRepositoryService);

  protected readonly ExpenseStatus = ExpenseStatus;
  protected readonly Role = Role;
  protected readonly reviewNote = signal('Reviewed in the recommendation queue with policy and bill check.');
  protected readonly actionInFlight = signal(false);
  protected readonly confirmDialogOpen = signal(false);
  protected readonly pendingAction = signal<PendingQueueAction | null>(null);
  protected readonly searchTerm = signal('');
  protected readonly statusFilter = signal<'all' | ExpenseStatus>('all');
  protected readonly categoryFilter = signal('all');
  protected readonly selectedExpenseId = signal<string>('');
  protected readonly page = computed(() => this.route.snapshot.data['page'] ?? 'dashboard');
  protected readonly dashboardRangeOptions = [
    { label: 'Current year', value: 'current-year' },
    { label: 'Last year', value: 'last-year' },
    { label: 'Last 2 years', value: 'last-2-years' },
    { label: 'Custom range', value: 'custom' },
    { label: 'All time', value: 'all' },
  ] as const;
  protected readonly dashboardRange = signal<DashboardRange>('current-year');
  protected readonly dashboardDateFrom = signal('');
  protected readonly dashboardDateTo = signal('');
  protected readonly workspaceData = signal<RecommenderWorkspaceResponse | null>(null);
  protected readonly actionError = this.expenseRepository.mutationError;

  protected readonly currentUser = computed(() => this.authService.currentUser());
  protected readonly expenses = computed(() =>
    this.isQueuePage()
      ? this.expenseRepository.expenses()
      : this.workspaceData()?.queueExpenses ?? this.expenseRepository.expenses(),
  );
  protected readonly dashboardExpenses = computed(() => {
    const bounds = this.resolveDashboardBounds();

    if (!bounds) {
      return this.expenses();
    }

    return this.expenses().filter((expense) => {
      const expenseDate = new Date(expense.date).getTime();

      return expenseDate >= bounds.start.getTime() && expenseDate <= bounds.end.getTime();
    });
  });

  protected readonly visibleExpenses = computed(() => {
    const search = this.searchTerm().trim().toLowerCase();
    const status = this.statusFilter();
    const categoryId = this.categoryFilter();

    return this.expenses()
      .filter((expense) =>
        status === 'all' ? true : expense.status === status || expense.status === ExpenseStatus.OverBudget,
      )
      .filter((expense) => (categoryId === 'all' ? true : expense.categoryId === categoryId))
      .filter((expense) => {
        if (!search) {
          return true;
        }

        const category = this.directoryService.getCategoryById(expense.categoryId)?.name ?? '';

        return [
          expense.title,
          expense.vendor,
          expense.description,
          category,
          expense.status,
          ...(expense.remarks ?? []),
        ]
          .join(' ')
          .toLowerCase()
          .includes(search);
      });
  });

  protected readonly queueExpenses = computed(() =>
    this.isActionQueuePage()
      ? this.visibleExpenses().filter((expense) =>
          [ExpenseStatus.Submitted, ExpenseStatus.Reopened, ExpenseStatus.OverBudget].includes(
            expense.status,
          ),
        )
      : this.visibleExpenses(),
  );

  protected readonly selectedExpense = computed(
    () => this.queueExpenses().find((expense) => expense.id === this.selectedExpenseId()) ?? this.queueExpenses()[0],
  );

  protected readonly dashboardCards = computed<ReportSummary[]>(
    () => this.workspaceData()?.dashboardCards ?? [],
  );

  protected readonly recentActivity = computed(
    () => this.workspaceData()?.recentActivity ?? [],
  );

  protected readonly reportRows = computed(
    () => this.workspaceData()?.reportRows ?? { categories: [], statuses: [] },
  );

  protected readonly trendData = computed(() => this.workspaceData()?.trendData ?? []);
  protected readonly pendingActionTitle = computed(() => {
    const action = this.pendingAction();

    if (action === 'recommend') {
      return 'Confirm recommendation';
    }

    if (action === 'reject') {
      return 'Confirm rejection';
    }

    if (action === 'reopen') {
      return 'Confirm reopen';
    }

    return 'Confirm workflow action';
  });
  protected readonly pendingActionMessage = computed(() => {
    const expense = this.selectedExpense();

    if (!expense) {
      return 'Choose an expense before continuing.';
    }

    const employee = this.expenseEmployee(expense);

    switch (this.pendingAction()) {
      case 'recommend':
        return `Forward ${expense.title} from ${employee} to admin for final approval?`;
      case 'reject':
        return `Reject ${expense.title} for ${employee} and notify the requester right away?`;
      case 'reopen':
        return `Send ${expense.title} back to ${employee} so the requester can update and resubmit it?`;
      default:
        return 'Confirm the selected workflow action.';
    }
  });

  constructor() {
    void this.directoryService.loadUsers();
    void this.loadWorkspace();
  }

  protected get title(): string {
    switch (this.page()) {
      case 'reports':
        return 'Review Reports';
      case 'budget':
        return 'Budget Overview';
      case 'dashboard':
        return 'Recommender Dashboard';
      default:
        return 'Recommendation Queue';
    }
  }

  protected async recommend(): Promise<void> {
    const expense = this.selectedExpense();
    const reviewer = this.currentUser();

    if (!expense || !reviewer) {
      return;
    }

    await this.runAction(
      () => this.expenseRepository.approveExpense(expense.id, reviewer, this.reviewNote()),
      'Recommendation sent',
      'The bill was forwarded to admin for final approval.',
    );
  }

  protected async reject(): Promise<void> {
    const expense = this.selectedExpense();
    const reviewer = this.currentUser();

    if (!expense || !reviewer) {
      return;
    }

    await this.runAction(
      () => this.expenseRepository.rejectExpense(expense.id, reviewer, this.reviewNote()),
      'Expense rejected',
      'The requester has been informed that the bill was rejected.',
    );
  }

  protected async reopen(): Promise<void> {
    const expense = this.selectedExpense();
    const reviewer = this.currentUser();

    if (!expense || !reviewer) {
      return;
    }

    await this.runAction(
      () => this.expenseRepository.reopenExpense(expense.id, reviewer, this.reviewNote()),
      'Expense reopened',
      'The bill was moved back to the requester for changes.',
    );
  }

  protected selectExpense(expense: Expense): void {
    this.selectedExpenseId.set(expense.id);
  }

  protected openExpenseDetails(expense: Expense): void {
    void this.router.navigate(['/recommender/expenses', expense.id]);
  }

  protected requestRecommend(): void {
    this.openActionDialog('recommend');
  }

  protected requestReject(): void {
    this.openActionDialog('reject');
  }

  protected requestReopen(): void {
    this.openActionDialog('reopen');
  }

  protected closeActionDialog(): void {
    this.confirmDialogOpen.set(false);
    this.pendingAction.set(null);
  }

  protected async confirmAction(): Promise<void> {
    const action = this.pendingAction();

    this.confirmDialogOpen.set(false);
    this.pendingAction.set(null);

    if (action === 'recommend') {
      await this.recommend();
      return;
    }

    if (action === 'reject') {
      await this.reject();
      return;
    }

    if (action === 'reopen') {
      await this.reopen();
    }
  }

  protected setStatusFilter(value: string): void {
    this.statusFilter.set(value as 'all' | ExpenseStatus);
  }

  protected setCategoryFilter(value: string): void {
    this.categoryFilter.set(value);
  }

  protected expenseEmployee(expense: Expense): string {
    return this.directoryService.getUserById(expense.employeeId ?? expense.managerId)?.name ?? 'Employee';
  }

  protected expenseLocation(expense: Expense): string {
    return this.directoryService.getLocationById(expense.locationId ?? '')?.name ?? 'Head Office';
  }

  protected isQueuePage(): boolean {
    return this.page() === 'queue' || this.page() === 'recommendation' || this.page() === 'review' || this.page() === 'expenses';
  }

  protected isActionQueuePage(): boolean {
    return this.page() === 'queue' || this.page() === 'recommendation';
  }

  protected isReportPage(): boolean {
    return this.page() === 'reports';
  }

  protected canActOn(expense: Expense): boolean {
    return [ExpenseStatus.Submitted, ExpenseStatus.Recommended, ExpenseStatus.OverBudget].includes(expense.status);
  }

  protected hasSelection(): boolean {
    return Boolean(this.selectedExpense());
  }

  protected roleLabel(): string {
    return this.currentUser()?.role === Role.Recommender ? 'Recommender' : 'Review';
  }

  protected setDashboardRange(value: DashboardRange): void {
    this.dashboardRange.set(value);
  }

  protected setDashboardDateFrom(value: string): void {
    this.dashboardDateFrom.set(value);
  }

  protected setDashboardDateTo(value: string): void {
    this.dashboardDateTo.set(value);
  }
  private resolveDashboardBounds(): { start: Date; end: Date } | null {
    const range = this.dashboardRange();
    const now = new Date();

    if (range === 'all') {
      return null;
    }

    if (range === 'current-year') {
      return {
        start: new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0),
        end: now,
      };
    }

    if (range === 'last-year') {
      const year = now.getFullYear() - 1;

      return {
        start: new Date(year, 0, 1, 0, 0, 0, 0),
        end: new Date(year, 11, 31, 23, 59, 59, 999),
      };
    }

    if (range === 'last-2-years') {
      return {
        start: new Date(now.getFullYear() - 2, 0, 1, 0, 0, 0, 0),
        end: new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999),
      };
    }

    if (!this.dashboardDateFrom() && !this.dashboardDateTo()) {
      return null;
    }

    const start = this.dashboardDateFrom()
      ? new Date(`${this.dashboardDateFrom()}T00:00:00`)
      : new Date(now.getFullYear() - 2, 0, 1, 0, 0, 0, 0);
    const end = this.dashboardDateTo()
      ? new Date(`${this.dashboardDateTo()}T23:59:59.999`)
      : now;

    return { start, end };
  }

  private async loadWorkspace(): Promise<void> {
    try {
      this.workspaceData.set(await firstValueFrom(this.analyticsApi.getRecommenderWorkspace()));
    } catch {
      return;
    }
  }

  private async runAction(
    action: () => Promise<Expense | undefined>,
    successTitle: string,
    successMessage: string,
  ): Promise<void> {
    this.actionInFlight.set(true);

    try {
      await action();
      this.toastService.showSuccess(successTitle, successMessage);
    } catch {
      this.toastService.showError(
        'Action failed',
        this.actionError() ?? 'The workflow action could not be completed.',
      );
      return;
    } finally {
      this.actionInFlight.set(false);
    }
  }

  private openActionDialog(action: PendingQueueAction): void {
    if (!this.selectedExpense() || !this.currentUser() || this.actionInFlight()) {
      return;
    }

    this.pendingAction.set(action);
    this.confirmDialogOpen.set(true);
  }
}
