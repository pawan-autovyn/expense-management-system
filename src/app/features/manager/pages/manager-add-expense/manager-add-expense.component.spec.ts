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

  it('submits an expense when the form is valid and a user is logged in', () => {
    const fixture = TestBed.createComponent(ManagerAddExpenseComponent);
    const component = fixture.componentInstance as unknown as {
      form: {
        patchValue: (value: Record<string, unknown>) => void;
        valid: boolean;
      };
      currentTags: () => string[];
      submit: () => void;
    };
    const createSpy = spyOn(expenseRepository, 'createExpense').and.callThrough();
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

    component.submit();

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

  it('updates an existing draft when edit query param is present', () => {
    const manager = authService.currentUser();
    const created = expenseRepository.createExpense(
      {
        title: 'Editable draft',
        categoryId: 'tea-pantry',
        locationId: 'loc-hq',
        amount: 900,
        date: '2026-04-06',
        vendor: 'Office Vendor',
        tags: ['draft'],
        description: 'Draft created for edit flow.',
      },
      manager!,
      ExpenseStatus.Draft,
    );
    editExpenseId = created.id;
    const updateSpy = spyOn(expenseRepository, 'updateDraft').and.callThrough();
    const navigateSpy = spyOn(router, 'navigateByUrl').and.returnValue(Promise.resolve(true));
    const fixture = TestBed.createComponent(ManagerAddExpenseComponent);
    const component = fixture.componentInstance as unknown as {
      form: {
        controls: {
          title: { value: string };
        };
        patchValue: (value: Record<string, unknown>) => void;
      };
      submit: () => void;
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
    component.submit();

    expect(updateSpy).toHaveBeenCalledWith(
      created.id,
      jasmine.objectContaining({
        title: 'Editable draft updated',
        vendor: 'Office Vendor',
      }),
      ExpenseStatus.Submitted,
    );
    expect(navigateSpy).toHaveBeenCalledWith('/operation-manager/expenses');
  });
});
