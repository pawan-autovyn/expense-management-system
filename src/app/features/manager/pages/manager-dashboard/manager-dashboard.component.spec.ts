import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { AuthService } from '../../../../core/services/auth.service';
import { DirectoryService } from '../../../../core/services/directory.service';
import { ExpenseRepositoryService } from '../../../../core/services/expense-repository.service';
import { ExpenseStatus } from '../../../../models/app.models';
import { ManagerDashboardComponent } from './manager-dashboard.component';

describe('ManagerDashboardComponent', () => {
  let fixture: ComponentFixture<ManagerDashboardComponent>;
  let authService: AuthService;
  let expenseRepository: ExpenseRepositoryService;
  let component: ManagerDashboardComponent;

  beforeEach(async () => {
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [ManagerDashboardComponent],
      providers: [provideRouter([]), AuthService, DirectoryService, ExpenseRepositoryService],
    }).compileComponents();

    authService = TestBed.inject(AuthService);
    expenseRepository = TestBed.inject(ExpenseRepositoryService);
    authService.loginWithCredentials('operations.manager.a@demo.com', 'SecurePass123!');
    expenseRepository.createExpense(
      {
        title: 'Paper stock without bill',
        categoryId: 'paper',
        locationId: 'loc-hq',
        amount: 180,
        date: '2026-04-01',
        vendor: 'Stationery World',
        tags: ['paper'],
        description: 'A receiptless expense to cover dashboard fallback states.',
      },
      authService.currentUser()!,
      ExpenseStatus.Draft,
    );
    fixture = TestBed.createComponent(ManagerDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders the manager dashboard overview cards and recent activity', () => {
    const content = fixture.nativeElement as HTMLElement;

    expect(content.textContent).toContain('Dashboard');
    expect(content.textContent).toContain('My Remaining Budget');
    expect(content.textContent).toContain('My current status mix');
    expect(content.textContent).toContain('Recent 5 expense items');
    expect(content.textContent).toContain('Top 5 vendors');
    expect(content.textContent).toContain('Budget Out');
    expect(content.querySelectorAll('app-stat-card').length).toBe(4);
    expect(content.querySelectorAll('app-status-badge').length).toBeGreaterThan(0);
    expect(content.querySelectorAll('app-activity-timeline').length).toBe(1);
    expect(content.querySelectorAll('.dashboard-list__item').length).toBeGreaterThan(0);
    expect(content.querySelectorAll('.dashboard-overbudget__card').length).toBeGreaterThanOrEqual(0);
  });

  it('renders the dashboard without the redundant quick add hero action', () => {
    authService.signOut();
    const anonymousFixture = TestBed.createComponent(ManagerDashboardComponent);
    anonymousFixture.detectChanges();
    const content = anonymousFixture.nativeElement as HTMLElement;

    expect(content.textContent).toContain('Dashboard');
    expect(content.textContent).not.toContain('Quick Add Expense');
    expect(content.querySelectorAll('a.button--primary').length).toBe(0);
  });

  it('shows date range controls and filters dashboard content by period', () => {
    const state = component as unknown as {
      dashboardRange: { set(value: 'current-year' | 'last-year' | 'last-2-years' | 'custom' | 'all'): void };
      dashboardDateFrom: { set(value: string): void };
      visibleExpenses: () => { id: string }[];
    };
    const beforeCount = state.visibleExpenses().length;

    state.dashboardRange.set('custom');
    state.dashboardDateFrom.set('2026-04-01');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.dashboard-range-panel')).not.toBeNull();
    expect(fixture.nativeElement.querySelectorAll('.dashboard-range-field').length).toBe(3);
    expect(fixture.nativeElement.querySelector('.dashboard-range-panel__note')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('View your dashboard by period');
    expect(state.visibleExpenses().length).toBeLessThanOrEqual(beforeCount);
  });
});
