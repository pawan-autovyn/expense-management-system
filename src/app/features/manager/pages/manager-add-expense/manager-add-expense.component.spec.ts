import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { ActivatedRoute } from '@angular/router';

import { DirectoryService } from '../../../../core/services/directory.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ExpenseRepositoryService } from '../../../../core/services/expense-repository.service';
import { ExpenseStatus, Role } from '../../../../models/app.models';
import { ManagerAddExpenseComponent } from './manager-add-expense.component';

describe('ManagerAddExpenseComponent', () => {
  let authService: AuthService;
  let expenseRepository: ExpenseRepositoryService;
  let router: Router;
  let editExpenseId: string | null;

  beforeEach(async () => {
    localStorage.clear();
    editExpenseId = null;

    await TestBed.configureTestingModule({
      imports: [ManagerAddExpenseComponent],
      providers: [
        provideRouter([]),
        AuthService,
        DirectoryService,
        ExpenseRepositoryService,
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: {
                get: () => editExpenseId,
              },
            },
          },
        },
      ],
    }).compileComponents();

    authService = TestBed.inject(AuthService);
    authService.loginAs(Role.OperationManager);
    expenseRepository = TestBed.inject(ExpenseRepositoryService);
    router = TestBed.inject(Router);
  });

  it('starts invalid until required fields are filled', () => {
    const fixture = TestBed.createComponent(ManagerAddExpenseComponent);
    const component = fixture.componentInstance as unknown as {
      form: { valid: boolean };
    };

    expect(component.form.valid).toBeFalse();
  });

  it('marks all controls touched when submitting an invalid form', () => {
    const fixture = TestBed.createComponent(ManagerAddExpenseComponent);
    const component = fixture.componentInstance as unknown as {
      form: { invalid: boolean; markAllAsTouched: () => void };
      submit: () => void;
    };
    const markAllAsTouchedSpy = spyOn(component.form, 'markAllAsTouched').and.callThrough();

    expect(component.form.invalid).toBeTrue();

    component.submit();

    expect(markAllAsTouchedSpy).toHaveBeenCalled();
  });

  it('shows validation errors once controls are touched', () => {
    const fixture = TestBed.createComponent(ManagerAddExpenseComponent);
    const component = fixture.componentInstance as unknown as {
      form: {
        controls: {
          title: { invalid: boolean; touched: boolean; markAsTouched: () => void };
        };
      };
      shouldShowError: (controlName: 'title') => boolean;
    };

    component.form.controls.title.markAsTouched();

    expect(component.shouldShowError('title')).toBeTrue();
  });

  it('does not show errors for untouched invalid fields and handles blank tags', () => {
    const fixture = TestBed.createComponent(ManagerAddExpenseComponent);
    const component = fixture.componentInstance as unknown as {
      form: {
        patchValue: (value: Record<string, unknown>) => void;
        controls: {
          title: { reset: (value: string) => void; invalid: boolean; touched: boolean };
        };
      };
      shouldShowError: (controlName: 'title') => boolean;
      currentTags: () => string[];
    };

    component.form.controls.title.reset('');
    component.form.patchValue({
      categoryId: 'missing-category',
      locationId: 'loc-hq',
      amount: 999999,
      date: '2026-04-06',
      vendor: 'Fresh Brew Traders',
      tags: ' one, , two ,, ',
      description: 'Large expense with an unknown category.',
    });

    expect(component.shouldShowError('title')).toBeFalse();
    expect(component.currentTags()).toEqual(['one', 'two']);
  });

  it('submits an expense when the form is valid and a user is logged in', async () => {
    const fixture = TestBed.createComponent(ManagerAddExpenseComponent);
    const component = fixture.componentInstance as unknown as {
      form: {
        patchValue: (value: Record<string, unknown>) => void;
        valid: boolean;
      };
      currentTags: () => string[];
      remainingAssignedBudget: () => number;
      submit: () => Promise<void>;
    };
    const createSpy = spyOn(expenseRepository, 'createExpense').and.resolveTo({} as never);
    const navigateSpy = spyOn(router, 'navigateByUrl').and.returnValue(Promise.resolve(true));

    component.form.patchValue({
      title: 'Pantry refill',
      categoryId: 'tea-pantry',
      locationId: 'loc-hq',
      amount: 1200,
      date: '2026-04-06',
      vendor: 'Fresh Brew Traders',
      tags: 'pantry',
      description: 'Tea, sugar, and cups for the week.',
    });

    expect(component.form.valid).toBeTrue();
    expect(component.currentTags()).toEqual(['pantry']);
    expect(component.remainingAssignedBudget()).toBeGreaterThan(0);

    await component.submit();

    expect(createSpy).toHaveBeenCalledWith(
      jasmine.objectContaining({
        title: 'Pantry refill',
        vendor: 'Fresh Brew Traders',
      }),
      jasmine.anything(),
      ExpenseStatus.Submitted,
    );
    expect(navigateSpy).toHaveBeenCalledWith('/operation-manager/expenses');
  });

  it('does not persist when there is no authenticated user', () => {
    const fixture = TestBed.createComponent(ManagerAddExpenseComponent);
    const component = fixture.componentInstance as unknown as {
      form: {
        patchValue: (value: Record<string, unknown>) => void;
      };
      submit: () => void;
    };
    const createSpy = spyOn(expenseRepository, 'createExpense').and.callThrough();
    const navigateSpy = spyOn(router, 'navigateByUrl').and.returnValue(Promise.resolve(true));

    authService.signOut();

    component.form.patchValue({
      title: 'Guest water bottles',
      categoryId: 'tea-pantry',
      locationId: 'loc-hq',
      amount: 300,
      date: '2026-04-06',
      vendor: 'Fresh Brew Traders',
      tags: 'water',
      description: 'Water bottles for the meeting room.',
    });

    component.submit();

    expect(createSpy).not.toHaveBeenCalled();
    expect(navigateSpy).not.toHaveBeenCalled();
  });

  it('blocks submission when the manager has no remaining assigned budget', async () => {
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
        id: 'budget-fully-used-spec',
        title: 'Budget fully used',
        categoryId: 'tea-pantry',
        locationId: 'loc-hq',
        employeeId: manager?.id,
        amount: manager?.assignedBudget ?? 85000,
        date: '2026-04-05',
        description: 'Existing submitted expense that uses the entire assigned budget.',
        vendor: 'Existing Vendor',
        tags: ['budget'],
        managerId: manager?.id ?? '',
        status: ExpenseStatus.Submitted,
        createdAt: '2026-04-05T09:00:00.000Z',
        updatedAt: '2026-04-05T09:00:00.000Z',
        auditTrail: [],
      },
      ...expenses,
    ]);

    const fixture = TestBed.createComponent(ManagerAddExpenseComponent);
    const component = fixture.componentInstance as unknown as {
      form: {
        patchValue: (value: Record<string, unknown>) => void;
      };
      activeSubmitError: () => string;
      budgetRejectDialogOpen: () => boolean;
      budgetRejectDialogMessage: () => string;
      submit: () => void;
    };
    const createSpy = spyOn(expenseRepository, 'createExpense').and.callThrough();

    component.form.patchValue({
      title: 'Blocked pantry refill',
      categoryId: 'tea-pantry',
      locationId: 'loc-hq',
      amount: 500,
      date: '2026-04-06',
      vendor: 'Fresh Brew Traders',
      tags: 'pantry',
      description: 'Blocked because the manager budget is exhausted.',
    });

    component.submit();

    expect(createSpy).not.toHaveBeenCalled();
    expect(component.activeSubmitError()).toContain('assigned budget');
    expect(component.budgetRejectDialogOpen()).toBeTrue();
    expect(component.budgetRejectDialogMessage()).toContain('cannot raise a new bill');
  });

  it('opens the rejection popup when the amount exceeds the remaining assigned budget', async () => {
    const manager = authService.currentUser();
    const existingCommittedSpend =
      expenseRepository
        .getExpensesForManager(manager?.id ?? '')
        .reduce((total, expense) => total + expense.amount, 0);
    if (manager) {
      manager.assignedBudget = existingCommittedSpend + 2000;
    }

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
        id: 'partial-budget-usage-spec',
        title: 'Partial budget usage',
        categoryId: 'tea-pantry',
        locationId: 'loc-hq',
        employeeId: manager?.id,
        amount: 1500,
        date: '2026-04-05',
        description: 'Existing submitted expense using most of the assigned budget.',
        vendor: 'Existing Vendor',
        tags: ['budget'],
        managerId: manager?.id ?? '',
        status: ExpenseStatus.Submitted,
        createdAt: '2026-04-05T09:00:00.000Z',
        updatedAt: '2026-04-05T09:00:00.000Z',
        auditTrail: [],
      },
      ...expenses,
    ]);

    const fixture = TestBed.createComponent(ManagerAddExpenseComponent);
    const component = fixture.componentInstance as unknown as {
      form: {
        patchValue: (value: Record<string, unknown>) => void;
      };
      remainingAssignedBudget: () => number;
      budgetRejectDialogOpen: () => boolean;
      budgetRejectDialogMessage: () => string;
      submit: () => void;
    };
    const createSpy = spyOn(expenseRepository, 'createExpense').and.callThrough();
    const blockedAmount = component.remainingAssignedBudget() + 1;

    component.form.patchValue({
      title: 'Blocked travel claim',
      categoryId: 'travel',
      locationId: 'loc-hq',
      amount: blockedAmount,
      date: '2026-04-06',
      vendor: 'Travel Desk',
      tags: 'travel',
      description: 'Blocked because it exceeds the remaining assigned budget.',
    });

    component.submit();

    expect(createSpy).not.toHaveBeenCalled();
    expect(component.budgetRejectDialogOpen()).toBeTrue();
    expect(component.budgetRejectDialogMessage()).toContain('exceeds your remaining budget');
  });

  it('shows and hides the receipt preview based on the attachment state', () => {
    const fixture = TestBed.createComponent(ManagerAddExpenseComponent);
    const component = fixture.componentInstance as unknown as {
      attachment: {
        set: (
          value: { id: string; name: string; url: string; mimeType: string } | undefined,
        ) => void;
      };
    };

    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('No receipt uploaded yet');

    component.attachment.set({
      id: 'att-preview',
      name: 'receipt.svg',
      url: '/assets/receipts/receipt.svg',
      mimeType: 'image/svg+xml',
    });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.upload-preview img')).not.toBeNull();
  });

  it('updates an existing draft when edit query param is present', async () => {
    const manager = authService.currentUser();
    editExpenseId = 'editable-draft-spec';
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
        id: editExpenseId,
        title: 'Editable draft',
        categoryId: 'tea-pantry',
        locationId: 'loc-hq',
        employeeId: manager?.id,
        amount: 900,
        date: '2026-04-06',
        description: 'Draft created for edit flow.',
        vendor: 'Office Vendor',
        tags: ['draft'],
        managerId: manager?.id ?? '',
        status: ExpenseStatus.Draft,
        createdAt: '2026-04-06T09:00:00.000Z',
        updatedAt: '2026-04-06T09:00:00.000Z',
        auditTrail: [],
      },
      ...expenses,
    ]);
    const updateSpy = spyOn(expenseRepository, 'updateDraft').and.resolveTo(undefined);
    const navigateSpy = spyOn(router, 'navigateByUrl').and.returnValue(Promise.resolve(true));
    const fixture = TestBed.createComponent(ManagerAddExpenseComponent);
    const component = fixture.componentInstance as unknown as {
      form: {
        controls: {
          title: { value: string };
        };
        patchValue: (value: Record<string, unknown>) => void;
      };
      submit: () => Promise<void>;
    };

    expect(component.form.controls.title.value).toBe('Editable draft');

    component.form.patchValue({
      title: 'Editable draft updated',
      categoryId: 'tea-pantry',
      locationId: 'loc-hq',
      amount: 950,
      date: '2026-04-06',
      vendor: 'Office Vendor',
      tags: 'draft, update',
      description: 'Draft updated through edit mode.',
    });
    await component.submit();

    expect(updateSpy).toHaveBeenCalledWith(
      editExpenseId,
      jasmine.objectContaining({
        title: 'Editable draft updated',
        vendor: 'Office Vendor',
      }),
      ExpenseStatus.Submitted,
    );
    expect(navigateSpy).toHaveBeenCalledWith('/operation-manager/expenses');
  });
});
