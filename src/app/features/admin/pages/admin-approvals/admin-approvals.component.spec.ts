import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AuthService } from '../../../../core/services/auth.service';
import { DirectoryService } from '../../../../core/services/directory.service';
import { ExpenseRepositoryService } from '../../../../core/services/expense-repository.service';
import { ExpenseStatus, Role } from '../../../../models/app.models';
import { AdminApprovalsComponent } from './admin-approvals.component';

interface ApprovalHarness {
  selectedTab: { set(value: string): void };
}

describe('AdminApprovalsComponent', () => {
  let fixture: ComponentFixture<AdminApprovalsComponent>;
  let component: AdminApprovalsComponent & {
    selectedId: { set: (value: string | null) => void };
    selectedTab: { set: (value: string) => void };
    filteredRows: () => { id: string; status: string; level: 'L1' | 'L2' | 'L3' }[];
    selectedRowId: () => string;
    selectedRow: () => { id: string; level: 'L1' | 'L2' | 'L3'; manager: string } | undefined;
    selectedExpense: () => { id: string } | undefined;
    timelineSteps: () => { label: string; owner: string; state: string; active: boolean }[];
    approve: () => void;
    reject: () => void;
    reopen: () => void;
    exportVisibleRows: () => void;
  };
  let authService: AuthService;
  let expenseRepository: ExpenseRepositoryService;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [AdminApprovalsComponent],
      providers: [AuthService, DirectoryService, ExpenseRepositoryService],
    }).compileComponents();

    authService = TestBed.inject(AuthService);
    authService.loginAs(Role.Admin);
    expenseRepository = TestBed.inject(ExpenseRepositoryService);
    fixture = TestBed.createComponent(AdminApprovalsComponent);
    component = fixture.componentInstance as typeof component;
    fixture.detectChanges();
  });

  it('builds approval rows and filters them by workflow stage', () => {
    expect(component.filteredRows().length).toBeGreaterThan(0);

    component.selectedTab.set('all');
    expect(
      component
        .filteredRows()
        .every(
          (row) => row.status.startsWith('Pending') || row.status === ExpenseStatus.OverBudget,
        ),
    ).toBeTrue();

    component.selectedTab.set('l1');
    expect(component.filteredRows().every((row) => row.status === 'Pending L1')).toBeTrue();

    component.selectedTab.set('l2');
    expect(component.filteredRows().every((row) => row.status === 'Pending L2')).toBeTrue();

    component.selectedTab.set('l3');
    expect(component.filteredRows().every((row) => row.status === 'Pending L3')).toBeTrue();

    component.selectedTab.set('rejected');
    expect(component.filteredRows().every((row) => row.status.startsWith('Rejected'))).toBeTrue();

    component.selectedTab.set('approved');
    expect(
      component
        .filteredRows()
        .every((row) => row.status.startsWith('Approved') || row.status === 'Final Approved'),
    ).toBeTrue();
  });

  it('updates the selected row and timeline when a different item is picked', () => {
    const rows = component.filteredRows();
    const selected = rows[1] ?? rows[0];

    component.selectedId.set(selected.id);

    expect(component.selectedRowId()).toBe(selected.id);
    expect(component.selectedRow()?.level).toBe(selected.level);
    expect(component.timelineSteps().length).toBe(4);
    expect(component.timelineSteps()[0].owner).toBe(selected.manager);
  });

  it('uses the first row as the default selection when no explicit row is chosen', () => {
    const firstRow = component.filteredRows()[0];

    component.selectedId.set('missing-row-id');

    expect(component.selectedRowId()).toBe(firstRow.id);
  });

  it('approves, rejects and reopens the selected expense', () => {
    const approveSpy = spyOn(expenseRepository, 'approveExpense').and.callThrough();
    const rejectSpy = spyOn(expenseRepository, 'rejectExpense').and.callThrough();
    const reopenSpy = spyOn(expenseRepository, 'reopenExpense').and.callThrough();

    component.approve();
    component.reject();
    component.reopen();

    expect(approveSpy).toHaveBeenCalled();
    expect(rejectSpy).toHaveBeenCalled();
    expect(reopenSpy).toHaveBeenCalled();
  });

  it('does not mutate approval state without a logged-in reviewer', () => {
    const approveSpy = spyOn(expenseRepository, 'approveExpense').and.callThrough();
    const rejectSpy = spyOn(expenseRepository, 'rejectExpense').and.callThrough();
    const reopenSpy = spyOn(expenseRepository, 'reopenExpense').and.callThrough();

    authService.signOut();
    component.approve();
    component.reject();
    component.reopen();

    expect(approveSpy).not.toHaveBeenCalled();
    expect(rejectSpy).not.toHaveBeenCalled();
    expect(reopenSpy).not.toHaveBeenCalled();
  });

  it('exports the visible approval queue as csv', () => {
    const clickSpy = spyOn(HTMLAnchorElement.prototype, 'click').and.callThrough();

    component.exportVisibleRows();

    expect(clickSpy).toHaveBeenCalled();
  });

  it('resolves stage labels and levels for all workflow states', () => {
    expect(
      (
        component as unknown as { resolveLevel: (index: number, status: ExpenseStatus) => string }
      ).resolveLevel(0, ExpenseStatus.Submitted),
    ).toBe('L1');
    expect(
      (
        component as unknown as { resolveLevel: (index: number, status: ExpenseStatus) => string }
      ).resolveLevel(1, ExpenseStatus.Submitted),
    ).toBe('L2');
    expect(
      (
        component as unknown as { resolveLevel: (index: number, status: ExpenseStatus) => string }
      ).resolveLevel(2, ExpenseStatus.Submitted),
    ).toBe('L3');
    expect(
      (
        component as unknown as { resolveLevel: (index: number, status: ExpenseStatus) => string }
      ).resolveLevel(0, ExpenseStatus.OverBudget),
    ).toBe('L3');

    const helper = component as unknown as {
      resolveStageLabel: (status: ExpenseStatus, level: 'L1' | 'L2' | 'L3') => string;
    };

    expect(helper.resolveStageLabel(ExpenseStatus.Approved, 'L3')).toBe('Final Approved');
    expect(helper.resolveStageLabel(ExpenseStatus.Approved, 'L1')).toBe('Approved by L1');
    expect(helper.resolveStageLabel(ExpenseStatus.Rejected, 'L2')).toBe('Rejected by L2');
    expect(helper.resolveStageLabel(ExpenseStatus.Draft, 'L2')).toBe('Draft');
    expect(helper.resolveStageLabel(ExpenseStatus.OverBudget, 'L2')).toBe('Over Budget');
    expect(helper.resolveStageLabel(ExpenseStatus.Submitted, 'L2')).toBe('Pending L2');
  });
});

describe('AdminApprovalsComponent without expenses', () => {
  let fixture: ComponentFixture<AdminApprovalsComponent>;

  beforeEach(async () => {
    localStorage.clear();

    const emptyExpenseRepository = {
      expenses: () => [],
      getExpenseById: () => undefined,
      approveExpense: () => undefined,
      rejectExpense: () => undefined,
      reopenExpense: () => undefined,
    };

    await TestBed.configureTestingModule({
      imports: [AdminApprovalsComponent],
      providers: [
        AuthService,
        DirectoryService,
        { provide: ExpenseRepositoryService, useValue: emptyExpenseRepository },
      ],
    }).compileComponents();

    TestBed.inject(AuthService).loginAs(Role.Admin);
    fixture = TestBed.createComponent(AdminApprovalsComponent);
    fixture.detectChanges();
  });

  it('renders an empty approval queue and hides the detail view', () => {
    const content = fixture.nativeElement as HTMLElement;

    expect(content.textContent).toContain('Expense Queue (0)');
    expect(content.textContent).not.toContain('Bill Preview');
    expect(content.textContent).not.toContain('Approval Timeline');
  });
});

describe('AdminApprovalsComponent with receiptless expense', () => {
  let fixture: ComponentFixture<AdminApprovalsComponent>;

  beforeEach(async () => {
    localStorage.clear();

    const receiptlessExpenseRepository = {
      expenses: () => [
        {
          id: 'exp-no-receipt',
          expenseCode: 'EXP-999',
          title: 'Receiptless placeholder',
          amount: 720,
          date: '2026-04-05',
          categoryId: 'tea-pantry',
          managerId: 'usr-mgr-1',
          status: ExpenseStatus.Approved,
          vendor: 'Placeholder Vendor',
          description: 'Mock record without receipt.',
          auditTrail: [{ actor: 'Rhea Sharma' }, { actor: 'Aarav Malhotra' }],
        },
      ],
      getExpenseById: (expenseId: string) =>
        expenseId === 'exp-no-receipt'
          ? {
              id: 'exp-no-receipt',
              title: 'Receiptless placeholder',
              amount: 720,
              date: '2026-04-05',
              categoryId: 'tea-pantry',
              managerId: 'usr-mgr-1',
              status: ExpenseStatus.Approved,
              vendor: 'Placeholder Vendor',
              description: 'Mock record without receipt.',
              auditTrail: [{ actor: 'Rhea Sharma' }, { actor: 'Aarav Malhotra' }],
            }
          : undefined,
      approveExpense: () => undefined,
      rejectExpense: () => undefined,
      reopenExpense: () => undefined,
    };

    await TestBed.configureTestingModule({
      imports: [AdminApprovalsComponent],
      providers: [
        AuthService,
        DirectoryService,
        { provide: ExpenseRepositoryService, useValue: receiptlessExpenseRepository },
      ],
    }).compileComponents();

    TestBed.inject(AuthService).loginAs(Role.Admin);
    fixture = TestBed.createComponent(AdminApprovalsComponent);
    fixture.detectChanges();
  });

  it('renders the receipt button in a disabled state when no attachment exists', () => {
    const content = fixture.nativeElement as HTMLElement;
    const helper = fixture.componentInstance as unknown as ApprovalHarness;

    helper.selectedTab.set('approved');
    fixture.detectChanges();

    const receiptButton = content.querySelector(
      '.approval-preview-card__placeholder',
    ) as HTMLButtonElement;

    expect(content.textContent).toContain('Receiptless placeholder');
    expect(receiptButton.disabled).toBeTrue();
  });
});
