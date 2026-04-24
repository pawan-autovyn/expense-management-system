import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { DirectoryService } from '../../../../core/services/directory.service';
import { ExpenseDialogService } from '../../../../core/services/expense-dialog.service';
import { ExpenseRepositoryService } from '../../../../core/services/expense-repository.service';
import { AdminExpensesComponent } from './admin-expenses.component';

describe('AdminExpensesComponent', () => {
  let fixture: ComponentFixture<AdminExpensesComponent>;
  let component: AdminExpensesComponent & {
    rows: () => { id: string; budget: string; expenseCode: string }[];
    actions: { id: string }[];
    budgetFilter: { set: (value: string) => void };
    handleAction: (event: { actionId: string; row: unknown }) => void;
    patchFilter: (key: string, value: string) => void;
    managerUsers: () => { role: string }[];
    budgetMap: () => Map<string, string>;
  };
  let expenseDialogService: ExpenseDialogService;

  beforeEach(async () => {
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [AdminExpensesComponent],
      providers: [
        provideRouter([]),
        DirectoryService,
        ExpenseDialogService,
        ExpenseRepositoryService,
      ],
    }).compileComponents();

    expenseDialogService = TestBed.inject(ExpenseDialogService);
    fixture = TestBed.createComponent(AdminExpensesComponent);
    component = fixture.componentInstance as typeof component;
    fixture.detectChanges();
  });

  it('builds expense rows with manager and budget information', () => {
    expect(component.managerUsers().length).toBeGreaterThan(0);
    expect(component.budgetMap().size).toBeGreaterThan(0);
    expect(component.rows().length).toBeGreaterThan(0);
    expect(component.rows()[0].budget.length).toBeGreaterThan(0);
  });

  it('filters rows and opens the shared workspace dialog for view actions', () => {
    const firstRow = component.rows()[0];

    component.budgetFilter.set('Over Budget');
    expect(component.rows().every((row) => row.budget === 'Over Budget')).toBeTrue();

    component.budgetFilter.set('all');
    component.patchFilter('searchTerm', 'tea');
    component.handleAction({ actionId: 'view', row: firstRow });

    expect(expenseDialogService.dialogRequest()).toEqual(
      jasmine.objectContaining({
        expenseId: firstRow.id,
        mode: 'view',
        source: 'admin',
        expenseCode: firstRow.expenseCode,
        budgetLabel: firstRow.budget,
      }),
    );
  });

  it('removes the bill action from the admin expense register', () => {
    expect(component.actions.map((action) => action.id)).not.toContain('receipt');
  });
});
