import { CurrencyPipe, DatePipe } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';

import { AuthService } from '../../../../core/services/auth.service';
import { ExpenseRepositoryService } from '../../../../core/services/expense-repository.service';
import { DirectoryService } from '../../../../core/services/directory.service';
import { Role, ExpenseStatus } from '../../../../models/app.models';
import { HrWorkspaceComponent } from './hr-workspace.component';

describe('HrWorkspaceComponent', () => {
  let fixture: ComponentFixture<HrWorkspaceComponent>;
  let component: HrWorkspaceComponent;
  let expenseRepository: ExpenseRepositoryService;
  let authService: AuthService;
  const activatedRouteStub = {
    snapshot: { data: { page: 'queue' as 'queue' | 'dashboard' | 'review' | 'reports' | 'budget' } },
  } as unknown as ActivatedRoute;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [HrWorkspaceComponent],
      providers: [
        CurrencyPipe,
        DatePipe,
        DirectoryService,
        ExpenseRepositoryService,
        AuthService,
        { provide: ActivatedRoute, useValue: activatedRouteStub },
      ],
    }).compileComponents();

    expenseRepository = TestBed.inject(ExpenseRepositoryService);
    authService = TestBed.inject(AuthService);
    authService.loginAs(Role.Recommender);

    fixture = TestBed.createComponent(HrWorkspaceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders the recommender queue and selected row details', () => {
    expect((component as any).title).toContain('Recommendation Queue');
    expect((component as any).queueExpenses().length).toBeGreaterThan(0);
    expect(
      (component as any)
        .queueExpenses()
        .every((expense: { status: ExpenseStatus }) => expense.status !== ExpenseStatus.Recommended),
    ).toBeTrue();
    expect(fixture.nativeElement.textContent).toContain('One list for recommendation review and forwarding');
    expect(fixture.nativeElement.textContent).toContain(
      'This is the same review list for the recommender role. Once an item is approved, it moves to the admin approval flow.',
    );
    expect(fixture.nativeElement.textContent).toContain('Recommend & Forward');
    expect(fixture.nativeElement.querySelectorAll('select').length).toBeGreaterThanOrEqual(2);
  });

  it('recommends the selected expense and updates the approval workflow', async () => {
    const candidate =
      (component as any).queueExpenses().find((expense: { status: ExpenseStatus }) =>
        expense.status === ExpenseStatus.Submitted,
      ) ?? (component as any).queueExpenses()[0];
    const recommendSpy = spyOn(expenseRepository, 'approveExpense').and.resolveTo(candidate as never);

    (component as any).selectExpense(candidate);
    (component as any).reviewNote.set('Looks clean and policy compliant.');
    await (component as any).recommend();

    expect(recommendSpy).toHaveBeenCalledWith(
      candidate.id,
      jasmine.objectContaining({ role: Role.Recommender }),
      'Looks clean and policy compliant.',
    );
  });

  it('rejects the selected expense and keeps the queue resilient for empty filters', async () => {
    (component as any).searchTerm.set('definitely-not-present');
    fixture.detectChanges();

    expect((component as any).visibleExpenses().length).toBe(0);

    (component as any).searchTerm.set('');
    (component as any).statusFilter.set('all');
    fixture.detectChanges();

    const candidate = (component as any).queueExpenses()[0];
    const rejectSpy = spyOn(expenseRepository, 'rejectExpense').and.resolveTo(candidate as never);

    (component as any).selectExpense(candidate);
    await (component as any).reject();

    expect(rejectSpy).toHaveBeenCalledWith(
      candidate.id,
      jasmine.objectContaining({ role: Role.Recommender }),
      jasmine.any(String),
    );
  });

  it('shows date range controls on the dashboard and hides the text search box', async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [HrWorkspaceComponent],
      providers: [
        CurrencyPipe,
        DatePipe,
        DirectoryService,
        ExpenseRepositoryService,
        AuthService,
        { provide: ActivatedRoute, useValue: { snapshot: { data: { page: 'dashboard' } } } },
      ],
    }).compileComponents();

    const dashboardAuthService = TestBed.inject(AuthService);
    dashboardAuthService.loginAs(Role.Recommender);

    const dashboardFixture = TestBed.createComponent(HrWorkspaceComponent);
    const dashboardComponent = dashboardFixture.componentInstance;
    dashboardFixture.detectChanges();

    expect((dashboardComponent as any).page()).toBe('dashboard');
    expect(dashboardFixture.nativeElement.querySelector('.hr-workspace__date-panel')).not.toBeNull();
    expect(dashboardFixture.nativeElement.querySelector('app-search-input')).toBeNull();
    expect(dashboardFixture.nativeElement.textContent).toContain('View dashboard activity by period');
  });
});
