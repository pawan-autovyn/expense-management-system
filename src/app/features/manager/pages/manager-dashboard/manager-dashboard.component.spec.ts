import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { AuthService } from '../../../../core/services/auth.service';
import { DirectoryService } from '../../../../core/services/directory.service';
import { ExpenseRepositoryService } from '../../../../core/services/expense-repository.service';
import { ExpenseStatus, Role } from '../../../../models/app.models';
import { ManagerDashboardComponent } from './manager-dashboard.component';

describe('ManagerDashboardComponent', () => {
  let fixture: ComponentFixture<ManagerDashboardComponent>;
  let authService: AuthService;
  let expenseRepository: ExpenseRepositoryService;

  beforeEach(async () => {
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [ManagerDashboardComponent],
      providers: [provideRouter([]), AuthService, DirectoryService, ExpenseRepositoryService],
    }).compileComponents();

    authService = TestBed.inject(AuthService);
    expenseRepository = TestBed.inject(ExpenseRepositoryService);
    authService.loginAs(Role.OperationManager);
    expenseRepository.createExpense(
      {
        title: 'Paper stock without bill',
        categoryId: 'paper',
        amount: 180,
        date: '2026-04-06',
        vendor: 'Stationery World',
        tags: ['paper'],
        description: 'A receiptless mock expense to cover dashboard fallback states.',
      },
      authService.currentUser()!,
      ExpenseStatus.Draft,
    );
    fixture = TestBed.createComponent(ManagerDashboardComponent);
    fixture.detectChanges();
  });

  it('renders the manager dashboard overview cards and recent activity', () => {
    const content = fixture.nativeElement as HTMLElement;

    expect(content.textContent).toContain('Manager Dashboard');
    expect(content.textContent).toContain('My top categories');
    expect(content.textContent).toContain('My current status mix');
    expect(content.textContent).toContain('Latest receipt previews');
    expect(content.querySelectorAll('app-stat-card').length).toBe(4);
    expect(content.querySelectorAll('app-status-badge').length).toBeGreaterThan(0);
    expect(content.querySelectorAll('app-activity-timeline').length).toBe(1);
    expect(content.querySelectorAll('img').length).toBeGreaterThan(0);
  });

  it('renders the dashboard without the redundant quick add hero action', () => {
    authService.signOut();
    const anonymousFixture = TestBed.createComponent(ManagerDashboardComponent);
    anonymousFixture.detectChanges();
    const content = anonymousFixture.nativeElement as HTMLElement;

    expect(content.textContent).toContain('Manager Dashboard');
    expect(content.textContent).not.toContain('Quick Add Expense');
    expect(content.querySelectorAll('a.button--primary').length).toBe(0);
  });
});
