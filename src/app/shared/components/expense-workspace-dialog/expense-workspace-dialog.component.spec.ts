import { provideHttpClient } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DirectoryService } from '../../../core/services/directory.service';
import { ExpenseDialogService } from '../../../core/services/expense-dialog.service';
import { ExpenseRepositoryService } from '../../../core/services/expense-repository.service';
import { ApprovalStage, ExpenseStatus, Role } from '../../../models/app.models';
import { ExpenseWorkspaceDialogComponent } from './expense-workspace-dialog.component';

describe('ExpenseWorkspaceDialogComponent', () => {
  let fixture: ComponentFixture<ExpenseWorkspaceDialogComponent>;
  let component: ExpenseWorkspaceDialogComponent & {
    activeExpense: () => { id: string; title: string } | null;
    isOpen: () => boolean;
    isEditMode: () => boolean;
    expenseForm: {
      controls: {
        title: { setValue(value: string): void };
        amount: { setValue(value: number): void };
      };
    };
    saveExpenseChanges: () => Promise<void>;
  };
  let expenseDialogService: ExpenseDialogService;
  let expenseRepository: ExpenseRepositoryService;
  let directoryService: DirectoryService;

  beforeEach(async () => {
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [ExpenseWorkspaceDialogComponent],
      providers: [
        provideHttpClient(),
        DirectoryService,
        ExpenseDialogService,
        ExpenseRepositoryService,
      ],
    }).compileComponents();

    expenseDialogService = TestBed.inject(ExpenseDialogService);
    expenseRepository = TestBed.inject(ExpenseRepositoryService);
    directoryService = TestBed.inject(DirectoryService);
    fixture = TestBed.createComponent(ExpenseWorkspaceDialogComponent);
    component = fixture.componentInstance as typeof component;
  });

  it('renders the shared dialog in manager edit mode and saves updates', async () => {
    const manager = directoryService.getDefaultUserByRole(Role.OperationManager);

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
        id: 'shared-edit-spec-row',
        title: 'Draft pantry refill',
        categoryId: directoryService.categories()[0].id,
        locationId: directoryService.locations()[0].id,
        employeeId: manager.id,
        amount: 900,
        date: '2026-04-22',
        description: 'Temporary draft used to validate the shared dialog.',
        vendor: 'Pantry vendor',
        tags: ['draft'],
        managerId: manager.id,
        status: ExpenseStatus.Draft,
        createdAt: '2026-04-22T11:00:00.000Z',
        updatedAt: '2026-04-22T11:00:00.000Z',
        approvalStage: ApprovalStage.OperationManager,
        auditTrail: [],
      },
      ...expenses,
    ]);

    spyOn(expenseRepository, 'fetchExpenseById').and.resolveTo(
      expenseRepository.getExpenseById('shared-edit-spec-row'),
    );
    expenseDialogService.openExpenseDialog({
      expenseId: 'shared-edit-spec-row',
      mode: 'edit',
      source: 'manager',
    });
    fixture.detectChanges();

    expect(component.isOpen()).toBeTrue();
    expect(component.isEditMode()).toBeTrue();
    expect(fixture.nativeElement.textContent).toContain('Update expense');

    component.expenseForm.controls.title.setValue('Updated draft title');
    component.expenseForm.controls.amount.setValue(2400);

    const updateSpy = spyOn(expenseRepository, 'updateDraft').and.resolveTo(undefined);

    await component.saveExpenseChanges();
    fixture.detectChanges();

    expect(updateSpy).toHaveBeenCalledWith(
      'shared-edit-spec-row',
      jasmine.any(Object),
      ExpenseStatus.Submitted,
    );
    expect(expenseDialogService.dialogRequest()).toBeNull();
  });

  it('renders admin view details inside the shared app-shell dialog', () => {
    const row = expenseRepository.expenses()[0];

    spyOn(expenseRepository, 'fetchExpenseById').and.resolveTo(row);
    expenseDialogService.openExpenseDialog({
      expenseId: row.id,
      mode: 'view',
      source: 'admin',
      expenseCode: 'EXP-001',
      budgetLabel: 'Within Budget',
    });
    fixture.detectChanges();

    expect(component.isOpen()).toBeTrue();
    expect(component.isEditMode()).toBeFalse();
    expect(fixture.nativeElement.textContent).toContain('EXP-001');
    expect(fixture.nativeElement.textContent).toContain('Within Budget');
  });
});
