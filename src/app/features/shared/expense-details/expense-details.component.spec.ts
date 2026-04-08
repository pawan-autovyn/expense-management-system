import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';

import { DirectoryService } from '../../../core/services/directory.service';
import { ExpenseRepositoryService } from '../../../core/services/expense-repository.service';
import { ExpenseDetailsComponent } from './expense-details.component';

describe('ExpenseDetailsComponent', () => {
  let fixture: ComponentFixture<ExpenseDetailsComponent>;

  function createRoute(id: string | null): ActivatedRoute {
    return {
      snapshot: {
        paramMap: {
          get: () => id,
        },
      },
    } as never;
  }

  beforeEach(async () => {
    localStorage.clear();
  });

  it('renders expense details and opens the receipt preview', async () => {
    await TestBed.configureTestingModule({
      imports: [ExpenseDetailsComponent],
      providers: [
        provideRouter([]),
        DirectoryService,
        ExpenseRepositoryService,
        { provide: ActivatedRoute, useValue: createRoute('exp-1001') },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ExpenseDetailsComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Expense Details');
    expect(fixture.nativeElement.textContent).toContain('Pantry refresh for showroom team');
    expect(fixture.nativeElement.textContent).toContain('Tea and Pantry');

    fixture.nativeElement.querySelector('.button--secondary')?.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Bill Preview');
  });

  it('shows the empty state when no expense is found', async () => {
    await TestBed.configureTestingModule({
      imports: [ExpenseDetailsComponent],
      providers: [
        provideRouter([]),
        DirectoryService,
        ExpenseRepositoryService,
        { provide: ActivatedRoute, useValue: createRoute(null) },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ExpenseDetailsComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Expense not found');
  });

  it('falls back to unknown category and empty timeline data when the record is malformed', async () => {
    localStorage.setItem(
      'aurora-ledger-expenses',
      JSON.stringify([
        {
          id: 'malformed-expense',
          title: 'Malformed expense',
          amount: 250,
          date: '2026-04-03',
          description: 'Missing audit trail and receipt',
          vendor: 'Vendor X',
          tags: [],
          managerId: 'usr-mgr-1',
          status: 'Submitted',
          createdAt: '2026-04-03T09:00:00+05:30',
          updatedAt: '2026-04-03T09:00:00+05:30',
        },
      ]),
    );

    await TestBed.configureTestingModule({
      imports: [ExpenseDetailsComponent],
      providers: [
        provideRouter([]),
        DirectoryService,
        ExpenseRepositoryService,
        { provide: ActivatedRoute, useValue: createRoute('malformed-expense') },
      ],
    }).compileComponents();

    const service = TestBed.inject(ExpenseRepositoryService);
    fixture = TestBed.createComponent(ExpenseDetailsComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Unknown');
    expect(fixture.nativeElement.textContent).toContain('No receipt uploaded');
    expect((fixture.componentInstance as unknown as { timelineItems: () => unknown[] }).timelineItems()).toEqual([]);
    expect(service.getExpenseById('malformed-expense')?.categoryId).toBeUndefined();
  });
});
