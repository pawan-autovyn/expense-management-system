import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DataTableComponent, TableAction, TableColumn } from './data-table.component';

describe('DataTableComponent', () => {
  let fixture: ComponentFixture<DataTableComponent>;
  let component: DataTableComponent;

  const columns: TableColumn[] = [
    { key: 'title', label: 'Expense' },
    { key: 'amount', label: 'Amount', type: 'currency' },
    { key: 'date', label: 'Date', type: 'date' },
    { key: 'status', label: 'Status', type: 'badge' },
    {
      key: 'computed',
      label: 'Computed',
      cell: (row) => `${(row as { title: string }).title}-cell`,
    },
  ];

  const row = {
    id: 'row-1',
    title: 'Pantry refill',
    amount: 500,
    date: '2026-04-01',
    status: 'Approved',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DataTableComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DataTableComponent);
    component = fixture.componentInstance;
  });

  it('shows the empty state when there are no rows', () => {
    fixture.componentRef.setInput('columns', columns);
    fixture.componentRef.setInput('rows', []);
    fixture.componentRef.setInput('actions', []);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Nothing to show');
  });

  it('renders rows, resolves cells and emits table actions', () => {
    const actions: TableAction[] = [
      { id: 'view', label: 'View', icon: 'eye' },
      { id: 'hidden', label: 'Hidden', icon: 'trash', visible: () => false },
    ];
    const emitted: { actionId: string; row: unknown }[] = [];

    component.actionTriggered.subscribe((value) => emitted.push(value));

    fixture.componentRef.setInput('columns', columns);
    fixture.componentRef.setInput('rows', [row]);
    fixture.componentRef.setInput('actions', actions);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Pantry refill');
    expect(fixture.nativeElement.textContent).toContain('Approved');
    expect(fixture.nativeElement.querySelector('button[aria-label="View"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('button[aria-label="Hidden"]')).toBeNull();

    fixture.nativeElement.querySelector('button[aria-label="View"]')?.click();

    expect(emitted).toEqual([{ actionId: 'view', row }]);
    expect(
      (
        component as unknown as {
          resolveCell: (row: unknown, column: TableColumn) => string | number;
        }
      ).resolveCell(row, columns[0]),
    ).toBe('Pantry refill');
    expect(
      (
        component as unknown as {
          resolveCell: (row: unknown, column: TableColumn) => string | number;
        }
      ).resolveCell(row, columns[4]),
    ).toBe('Pantry refill-cell');
    expect(
      (
        component as unknown as {
          resolveCell: (row: unknown, column: TableColumn) => string | number;
        }
      ).resolveCell({}, { key: 'missing', label: 'Missing' }),
    ).toBe('');
  });

  it('uses the default row tracker for primitive rows and a custom tracker when provided', () => {
    fixture.componentRef.setInput('columns', [{ key: 'value', label: 'Value' }]);
    fixture.componentRef.setInput('rows', ['plain-row']);
    fixture.detectChanges();

    expect(
      (
        component as unknown as { rowTrackBy: () => (row: unknown) => string | number }
      ).rowTrackBy()('plain-row'),
    ).toBe('plain-row');

    fixture.componentRef.setInput('rowTrackBy', (row: unknown) =>
      String((row as { id?: string }).id ?? 'custom'),
    );
    fixture.detectChanges();

    expect(
      (
        component as unknown as { rowTrackBy: () => (row: unknown) => string | number }
      ).rowTrackBy()({ id: 'custom-id' }),
    ).toBe('custom-id');
  });
});
