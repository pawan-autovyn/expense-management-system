import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { AuthService } from '../../../../core/services/auth.service';
import { DirectoryService } from '../../../../core/services/directory.service';
import { ExpenseRepositoryService } from '../../../../core/services/expense-repository.service';
import { ExpenseStatus } from '../../../../models/app.models';
import { ManagerExpensesComponent } from './manager-expenses.component';

describe('ManagerExpensesComponent', () => {
  let fixture: ComponentFixture<ManagerExpensesComponent>;
  let component: ManagerExpensesComponent & {
    rows: () => { id: string; title: string; status: string; receiptUrl?: string }[];
    handleAction: (event: { actionId: string; row: unknown }) => void;
    selectedReceipt: () => { id: string; name: string } | null;
    deleteDialogOpen: () => boolean;
    draftToDelete: () => string | null;
    deleteDraft: () => void;
  };
  let authService: AuthService;
  let expenseRepository: ExpenseRepositoryService;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManagerExpensesComponent],
      providers: [provideRouter([]), AuthService, DirectoryService, ExpenseRepositoryService],
    }).compileComponents();

    localStorage.clear();
    authService = TestBed.inject(AuthService);
    authService.loginWithCredentials('operations.manager.a@demo.com', 'SecurePass123!');
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

    harness.filters.set({ ...harness.filters(), dateRange: 'all' });
    fixture.detectChanges();

    expect(component.rows().length).toBeGreaterThan(0);
    expect(component.rows().every((row) => row.title.length > 0)).toBeTrue();

    const draftRow = component.rows().find((row) => row.status === ExpenseStatus.Draft);

    expect(draftRow?.title).toContain('Visitor lounge paper stock');
  });

  it('navigates to the detail view for row actions', () => {
    const navigateSpy = spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));
    const row = component.rows()[0];

    component.handleAction({ actionId: 'view', row });

    expect(navigateSpy).toHaveBeenCalledWith(['/operation-manager/my-expenses', row.id]);
  });

  it('opens delete confirmation for draft expenses and deletes on confirm', () => {
    const harness = component as unknown as {
      filters: { set(value: Record<string, unknown>): void; (): Record<string, unknown> };
    };

    harness.filters.set({ ...harness.filters(), dateRange: 'all' });
    fixture.detectChanges();

    const draftRow = component.rows().find((row) => row.status === ExpenseStatus.Draft);

    expect(draftRow).toBeDefined();

    component.handleAction({ actionId: 'delete', row: draftRow });

    expect(component.deleteDialogOpen()).toBeTrue();
    expect(component.draftToDelete()).toBe(draftRow?.id ?? null);

    const deleteSpy = spyOn(expenseRepository, 'deleteDraft').and.callThrough();

    component.deleteDraft();

    expect(deleteSpy).toHaveBeenCalledWith(draftRow?.id ?? '');
    expect(component.deleteDialogOpen()).toBeFalse();
    expect(component.draftToDelete()).toBeNull();
  });

  it('loads receipt preview for receipt actions', () => {
    const receiptRow = component.rows().find((row) => row.receiptUrl);

    expect(receiptRow).toBeDefined();

    component.handleAction({ actionId: 'receipt', row: receiptRow });

    expect(component.selectedReceipt()?.name).toContain('bill');
  });

  it('ignores delete confirmation when there is no pending draft', () => {
    const deleteSpy = spyOn(expenseRepository, 'deleteDraft').and.callThrough();

    component.deleteDraft();

    expect(deleteSpy).not.toHaveBeenCalled();
    expect(component.deleteDialogOpen()).toBeFalse();
    expect(component.draftToDelete()).toBeNull();
  });
});
