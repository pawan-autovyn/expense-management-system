import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExpenseStatus, Role } from '../../../models/app.models';
import { DEFAULT_EXPENSE_FILTERS } from '../../utils/expense.utils';
import { ExpenseFilterBarComponent } from './expense-filter-bar.component';

describe('ExpenseFilterBarComponent', () => {
  let fixture: ComponentFixture<ExpenseFilterBarComponent>;
  let component: ExpenseFilterBarComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExpenseFilterBarComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ExpenseFilterBarComponent);
    component = fixture.componentInstance;
  });

  it('renders the manager filter when requested', () => {
    fixture.componentRef.setInput('filters', DEFAULT_EXPENSE_FILTERS);
    fixture.componentRef.setInput('categories', [
      {
        id: 'tea-pantry',
        name: 'Tea and Pantry',
        description: 'Tea, sugar and cups',
        icon: 'cup',
        accent: '#0EA5E9',
        monthlyBudget: 1000,
        previousSpend: 0,
      },
    ]);
    fixture.componentRef.setInput('managers', [
      {
        id: 'mgr-1',
        name: 'Rhea Sharma',
        email: 'rhea@example.com',
        role: Role.OperationManager,
        title: 'Operations Manager',
        department: 'Operations',
        avatarUrl: '',
        assignedBudget: 1000,
        phone: '',
        location: '',
      },
    ]);
    fixture.componentRef.setInput('showManagerFilter', true);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('select').length).toBe(5);
  });

  it('omits the manager filter when not requested', () => {
    fixture.componentRef.setInput('filters', DEFAULT_EXPENSE_FILTERS);
    fixture.componentRef.setInput('categories', []);
    fixture.componentRef.setInput('showManagerFilter', false);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('select').length).toBe(4);
  });

  it('emits merged filter updates when the patch helper runs', () => {
    fixture.componentRef.setInput('filters', DEFAULT_EXPENSE_FILTERS);
    fixture.componentRef.setInput('categories', []);
    fixture.detectChanges();

    const emitted: unknown[] = [];
    component.filtersChange.subscribe((value) => emitted.push(value));

    (
      component as unknown as {
        patchFilters: (patch: Partial<typeof DEFAULT_EXPENSE_FILTERS>) => void;
      }
    ).patchFilters({
      searchTerm: 'tea',
      status: ExpenseStatus.Approved,
    });

    expect(emitted).toEqual([
      {
        ...DEFAULT_EXPENSE_FILTERS,
        searchTerm: 'tea',
        status: ExpenseStatus.Approved,
      },
    ]);
  });
});
