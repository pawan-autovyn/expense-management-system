import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { DirectoryService } from '../../../../core/services/directory.service';
import { ExpenseRepositoryService } from '../../../../core/services/expense-repository.service';
import { AdminExpensesComponent } from './admin-expenses.component';

describe('AdminExpensesComponent', () => {
  let fixture: ComponentFixture<AdminExpensesComponent>;
  let component: AdminExpensesComponent & {
    rows: () => { id: string; budget: string; receiptUrl?: string }[];
    selectedReceipt: (() => { id: string } | null) & {
      set: (value: { id: string } | null) => void;
    };
    budgetFilter: { set: (value: string) => void };
    handleAction: (event: { actionId: string; row: unknown }) => void;
    patchFilter: (key: string, value: string) => void;
    managerUsers: () => { role: string }[];
    budgetMap: () => Map<string, string>;
  };
  let router: Router;

  beforeEach(async () => {
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [AdminExpensesComponent],
      providers: [provideRouter([]), DirectoryService, ExpenseRepositoryService],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminExpensesComponent);
    component = fixture.componentInstance as typeof component;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('builds expense rows with manager and budget information', () => {
    expect(component.managerUsers().length).toBeGreaterThan(0);
    expect(component.budgetMap().size).toBeGreaterThan(0);
    expect(component.rows().length).toBeGreaterThan(0);
    expect(component.rows()[0].budget.length).toBeGreaterThan(0);
  });

  it('filters rows and handles actions', () => {
    const navigateSpy = spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));
    const firstRow = component.rows()[0];
    const receiptRow = component.rows().find((row) => row.receiptUrl);

    component.budgetFilter.set('Over Budget');
    expect(component.rows().every((row) => row.budget === 'Over Budget')).toBeTrue();

    component.budgetFilter.set('all');
    component.patchFilter('searchTerm', 'tea');

    component.handleAction({ actionId: 'view', row: firstRow });
    component.handleAction({ actionId: 'edit', row: firstRow });
    component.handleAction({ actionId: 'delete', row: firstRow });
    const selectedRow = receiptRow ?? firstRow;

    component.handleAction({ actionId: 'receipt', row: selectedRow });

    expect(navigateSpy).toHaveBeenCalledWith(['/admin/expenses', firstRow.id]);
    expect(component.selectedReceipt()).toBeTruthy();
  });

  it('clears the receipt preview when the selected row has no attachment', () => {
    const rowWithoutReceipt = { id: 'missing-row', receiptUrl: undefined };

    component.handleAction({ actionId: 'receipt', row: rowWithoutReceipt });

    expect(component.selectedReceipt()).toBeNull();
  });
});
