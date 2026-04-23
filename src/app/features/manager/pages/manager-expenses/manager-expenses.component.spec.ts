import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';

import { AuthService } from '../../../../core/services/auth.service';
import { DirectoryService } from '../../../../core/services/directory.service';
import { ExpenseDialogService } from '../../../../core/services/expense-dialog.service';
import { ExpenseRepositoryService } from '../../../../core/services/expense-repository.service';
import { ApprovalStage, ExpenseStatus, Role } from '../../../../models/app.models';
import { ManagerExpensesComponent } from './manager-expenses.component';

describe('ManagerExpensesComponent', () => {
  let fixture: ComponentFixture<ManagerExpensesComponent>;
  let component: ManagerExpensesComponent & {
    rows: () => { id: string; title: string; status: string }[];
    pagedRows: () => { id: string; title: string; status: string }[];
    handleAction: (event: { actionId: string; row: unknown }) => void;
    nextPage: () => void;
    previousPage: () => void;
    page: () => number;
    actions: { id: string }[];
  };
  let authService: AuthService;
  let directoryService: DirectoryService;
  let expenseRepository: ExpenseRepositoryService;
  let expenseDialogService: ExpenseDialogService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManagerExpensesComponent],
      providers: [
        provideRouter([]),
        AuthService,
        DirectoryService,
        ExpenseDialogService,
        ExpenseRepositoryService,
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              routeConfig: {
                path: 'my-expenses',
              },
            },
          },
        },
      ],
    }).compileComponents();

    localStorage.clear();
    authService = TestBed.inject(AuthService);
    directoryService = TestBed.inject(DirectoryService);
    expenseDialogService = TestBed.inject(ExpenseDialogService);
    await Promise.resolve(
      authService.loginWithCredentials('operations.manager.ems@gmail.com', 'SecurePass123!'),
    );
    expenseRepository = TestBed.inject(ExpenseRepositoryService);
    fixture = TestBed.createComponent(ManagerExpensesComponent);
    component = fixture.componentInstance as typeof component;
    fixture.detectChanges();
  });

  it('creates a filtered row set for the active manager', () => {
    const harness = component as unknown as {
      filters: { set(value: Record<string, unknown>): void; (): Record<string, unknown> };
    };
    const currentUser = authService.currentUser();

    harness.filters.set({ ...harness.filters(), dateRange: 'all' });
    fixture.detectChanges();

    expect(component.rows().length).toBeGreaterThan(0);
    expect(component.rows().every((row) => row.title.length > 0)).toBeTrue();
    expect(component.rows().map((row) => row.id).sort()).toEqual(
      expenseRepository
        .getExpensesForManager(currentUser?.id ?? '')
        .map((expense) => expense.id)
        .sort(),
    );
  });

  it('opens the shared workspace dialog for view actions', () => {
    const row = component.rows()[0];

    component.handleAction({ actionId: 'view', row });

    expect(expenseDialogService.dialogRequest()).toEqual(
      jasmine.objectContaining({
        expenseId: row.id,
        mode: 'view',
        source: 'manager',
      }),
    );
  });

  it('opens the shared workspace dialog in edit mode for draft and reopened expenses', () => {
    const editableRow = component.rows().find((row) =>
      [ExpenseStatus.Draft, ExpenseStatus.Reopened].includes(row.status as ExpenseStatus),
    );

    expect(editableRow).toBeDefined();

    component.handleAction({ actionId: 'edit', row: editableRow });

    expect(expenseDialogService.dialogRequest()).toEqual(
      jasmine.objectContaining({
        expenseId: editableRow?.id,
        mode: 'edit',
        source: 'manager',
      }),
    );
  });

  it('opens the shared delete confirmation for editable expenses', () => {
    const harness = component as unknown as {
      filters: { set(value: Record<string, unknown>): void; (): Record<string, unknown> };
    };
    const manager = authService.currentUser();

    (
      expenseRepository as unknown as {
        expensesStore: {
          update(
            updateFn: (expenses: Array<Record<string, unknown>>) => Array<Record<string, unknown>>,
          ): void;
        };
      }
    ).expensesStore.update((expenses) => [
      {
        id: 'draft-spec-row',
        title: 'Draft paper replenishment',
        categoryId: directoryService.categories()[0].id,
        locationId: directoryService.locations()[0].id,
        employeeId: manager?.id,
        amount: 1200,
        date: '2026-04-21',
        description: 'Temporary draft created during spec coverage.',
        vendor: 'Office Supply Desk',
        tags: ['draft'],
        managerId: manager?.id ?? '',
        status: ExpenseStatus.Draft,
        createdAt: '2026-04-21T10:00:00.000Z',
        updatedAt: '2026-04-21T10:00:00.000Z',
        approvalStage: ApprovalStage.OperationManager,
        auditTrail: [
          {
            id: 'audit-draft-spec-row',
            action: 'Draft saved',
            actor: manager?.name ?? 'Operation Manager',
            actorRole: Role.OperationManager,
            date: '2026-04-21T10:00:00.000Z',
            note: 'Temporary draft created during spec coverage.',
            tone: 'info',
          },
        ],
      },
      ...expenses,
    ]);

    harness.filters.set({ ...harness.filters(), dateRange: 'all' });
    fixture.detectChanges();

    const draftRow = component.rows().find((row) => row.title === 'Draft paper replenishment');

    expect(draftRow).toBeDefined();

    component.handleAction({ actionId: 'delete', row: draftRow });

    expect(expenseDialogService.deleteDialogOpen()).toBeTrue();
    expect(expenseDialogService.deleteDialogMessage()).toContain('Draft paper replenishment');
  });

  it('removes the bill action from the manager table', () => {
    expect(component.actions.map((action) => action.id)).not.toContain('receipt');
  });

  it('paginates manager expenses', () => {
    expect(component.page()).toBe(1);
    expect(component.pagedRows().length).toBeLessThanOrEqual(8);

    component.nextPage();
    fixture.detectChanges();

    expect(component.page()).toBeLessThanOrEqual(
      Math.max(1, Math.ceil(component.rows().length / component.pagedRows().length)),
    );

    component.previousPage();
    fixture.detectChanges();

    expect(component.page()).toBe(1);
  });
});
