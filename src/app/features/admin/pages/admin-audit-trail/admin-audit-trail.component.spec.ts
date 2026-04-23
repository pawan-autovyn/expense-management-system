import { CurrencyPipe, DatePipe } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminAuditTrailComponent } from './admin-audit-trail.component';

interface AuditTrailHarness {
  visibleEntries(): { id: string; actionGroup: string }[];
  pagedEntries(): { id: string; userName: string; expenseId: string }[];
  summaryCards(): { title: string; value: string }[];
  pageWindow(): { start: number; end: number; total: number };
  totalPages(): number;
  timelineItems(): { id: string }[];
  timelineSubtitle(): string;
  selectExpense(expenseId: string): void;
  exportVisibleRows(): void;
  patchFilter<Key extends 'searchTerm' | 'actionGroup' | 'role'>(key: Key, value: string): void;
  previousPage(): void;
  nextPage(): void;
  page(): number;
}

describe('AdminAuditTrailComponent', () => {
  let fixture: ComponentFixture<AdminAuditTrailComponent>;
  let component: AuditTrailHarness;

  beforeEach(async () => {
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [AdminAuditTrailComponent, CurrencyPipe, DatePipe],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminAuditTrailComponent);
    component = fixture.componentInstance as unknown as AuditTrailHarness;
    fixture.detectChanges();
  });

  it('renders audit entries and summary cards', () => {
    expect(component.visibleEntries().length).toBeGreaterThan(0);
    expect(component.summaryCards().length).toBe(4);
    expect(fixture.nativeElement.textContent).toContain('System activity and accountability log');
    expect(fixture.nativeElement.textContent).toContain('Recent activity stream');
    expect(fixture.nativeElement.textContent).toContain('User');
  });

  it('filters by action group', () => {
    component.patchFilter('actionGroup', 'approval');
    fixture.detectChanges();

    expect(component.visibleEntries().every((entry) => entry.actionGroup === 'approval')).toBeTrue();
    expect(component.pagedEntries().every((entry) => Boolean(entry.userName))).toBeTrue();
  });

  it('updates the recent activity stream when a specific expense is selected', () => {
    const firstEntry = component.pagedEntries()[0];

    component.selectExpense(firstEntry.expenseId);
    fixture.detectChanges();

    expect(component.timelineItems().length).toBeGreaterThan(0);
    expect(component.timelineSubtitle()).toContain('Tracking');
    expect(fixture.nativeElement.querySelector('.audit-table__row--active')).not.toBeNull();
  });

  it('paginates the visible audit entries', () => {
    expect(component.totalPages()).toBeGreaterThan(1);
    expect(component.pagedEntries().length).toBeLessThan(component.visibleEntries().length);
    expect(component.pageWindow().start).toBe(1);

    component.nextPage();
    fixture.detectChanges();

    expect(component.page()).toBe(2);
    expect(component.pageWindow().start).toBeGreaterThan(1);

    component.previousPage();
    fixture.detectChanges();

    expect(component.page()).toBe(1);
  });

  it('exports the visible entries as CSV', () => {
    let appendedAnchor: { download?: string } | null = null;

    spyOn(window.URL, 'createObjectURL').and.returnValue('blob:test-url');
    spyOn(window.URL, 'revokeObjectURL');
    spyOn(HTMLAnchorElement.prototype, 'click').and.stub();
    spyOn(document.body, 'appendChild').and.callFake(((node: Node) => {
      appendedAnchor = node as { download?: string };
      return node;
    }) as typeof document.body.appendChild);

    component.exportVisibleRows();

    const downloadName = (appendedAnchor as { download?: string } | null)?.download ?? '';

    expect(downloadName).toBe('corework-audit-trail-all.csv');
    expect(window.URL.createObjectURL).toHaveBeenCalled();
    expect(window.URL.revokeObjectURL).toHaveBeenCalledWith('blob:test-url');
  });
});
