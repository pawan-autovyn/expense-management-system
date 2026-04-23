import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';

import { AuthService } from '../../../../core/services/auth.service';
import { DirectoryService } from '../../../../core/services/directory.service';
import { ExpenseRepositoryService } from '../../../../core/services/expense-repository.service';
import { ExpenseStatus } from '../../../../models/app.models';
import { ManagerExpensesComponent } from './manager-expenses.component';

describe('ManagerExpensesComponent', () => {
  let fixture: ComponentFixture<ManagerExpensesComponent>;
  let component: ManagerExpensesComponent & {
    rows: () => { id: string; title: string; status: string; receiptUrl?: string }[];
    pagedRows: () => { id: string; title: string; status: string; receiptUrl?: string }[];
    handleAction: (event: { actionId: string; row: unknown }) => void;
    selectedReceipt: () => { id: string; name: string } | null;
    deleteDialogOpen: () => boolean;
    draftToDelete: () => string | null;
    deleteDraft: () => Promise<void>;
    nextPage: () => void;
    previousPage: () => void;
    page: () => number;
  };
  let authService: AuthService;
  let directoryService: DirectoryService;
  let expenseRepository: ExpenseRepositoryService;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManagerExpensesComponent],
      providers: [
        provideRouter([]),
        AuthService,
        DirectoryService,
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
    await Promise.resolve(
      authService.loginWithCredentials('operations.manager.ems@gmail.com', 'SecurePass123!'),
    );
    expenseRepository = TestBed.inject(ExpenseRepositoryService);
    router = TestBed.inject(Router);
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

  it('navigates to the detail view for row actions', () => {
    const navigateSpy = spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));
    const row = component.rows()[0];

    component.handleAction({ actionId: 'view', row });

    expect(navigateSpy).toHaveBeenCalledWith(['/operation-manager/my-expenses', row.id]);
  });

  it('navigates to edit mode for draft and reopened expenses', () => {
    const navigateSpy = spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));
    const editableRow = component.rows().find((row) =>
      [ExpenseStatus.Draft, ExpenseStatus.Reopened].includes(row.status as ExpenseStatus),
    );

    expect(editableRow).toBeDefined();

    component.handleAction({ actionId: 'edit', row: editableRow });

    expect(navigateSpy).toHaveBeenCalledWith(['/operation-manager/add-expense'], {
      queryParams: { edit: editableRow?.id },
    });
  });

  it('opens delete confirmation for draft expenses and deletes on confirm', async () => {
    const harness = component as unknown as {
      filters: { set(value: Record<string, unknown>): void; (): Record<string, unknown> };
    };
    const manager = authService.currentUser();

    expenseRepository.createExpense(
      {
        title: 'Draft paper replenishment',
        categoryId: directoryService.categories()[0].id,
        locationId: directoryService.locations()[0].id,
        amount: 1200,
        date: '2026-04-21',
        description: 'Temporary draft created during spec coverage.',
        vendor: 'Office Supply Desk',
        tags: ['draft'],
      },
      manager!,
      ExpenseStatus.Draft,
    );

    harness.filters.set({ ...harness.filters(), dateRange: 'all' });
    fixture.detectChanges();

    const draftRow = component.rows().find((row) => row.title === 'Draft paper replenishment');

    expect(draftRow).toBeDefined();

    component.handleAction({ actionId: 'delete', row: draftRow });

    expect(component.deleteDialogOpen()).toBeTrue();
    expect(component.draftToDelete()).toBe(draftRow?.id ?? null);

    const deleteSpy = spyOn(expenseRepository, 'deleteDraft').and.callThrough();

    await component.deleteDraft();

    expect(deleteSpy).toHaveBeenCalledWith(draftRow?.id ?? '');
    expect(component.deleteDialogOpen()).toBeFalse();
    expect(component.draftToDelete()).toBeNull();
  });

  it('loads receipt preview for receipt actions', () => {
    const receiptRow = component.rows().find((row) => row.receiptUrl);
    const matchingExpense = expenseRepository.getExpenseById(receiptRow?.id ?? '');

    expect(receiptRow).toBeDefined();

    component.handleAction({ actionId: 'receipt', row: receiptRow });

    expect(component.selectedReceipt()?.name).toBe(matchingExpense?.receipt?.name);
  });

  it('ignores delete confirmation when there is no pending draft', async () => {
    const deleteSpy = spyOn(expenseRepository, 'deleteDraft').and.callThrough();

    await component.deleteDraft();

    expect(deleteSpy).not.toHaveBeenCalled();
    expect(component.deleteDialogOpen()).toBeFalse();
    expect(component.draftToDelete()).toBeNull();
  });

  it('paginates the visible rows', () => {
    expect(component.page()).toBe(1);
    expect(component.pagedRows().length).toBeGreaterThan(0);

    component.nextPage();

    expect(component.page()).toBeGreaterThanOrEqual(1);

    component.previousPage();

    expect(component.page()).toBe(1);
  });
});
