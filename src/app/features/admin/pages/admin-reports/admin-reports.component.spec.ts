import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DirectoryService } from '../../../../core/services/directory.service';
import { ExpenseRepositoryService } from '../../../../core/services/expense-repository.service';
import { ExpenseStatus } from '../../../../models/app.models';
import { AdminReportsComponent } from './admin-reports.component';

interface ReportRow {
  id: string;
  date: string;
  status: string;
  templateName: string;
  branch: string;
  vendor: string;
}

interface AdminReportsHarness {
  reportRows(): ReportRow[];
  visibleRows(): ReportRow[];
  summaryCards(): { value: string }[];
  branchSummaries(): unknown[];
  branchNames(): string[];
  patchFilter(filterName: string, value: string): void;
  resetFilters(): void;
  normalizeStatus(status: ExpenseStatus): string;
  resolveApprovers(expense: { auditTrail: { actor?: string }[] }, fallback: string): string[];
}

describe('AdminReportsComponent', () => {
  let fixture: ComponentFixture<AdminReportsComponent>;
  let component: AdminReportsHarness;
  let directoryService: DirectoryService;

  beforeEach(async () => {
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [AdminReportsComponent],
      providers: [DirectoryService, ExpenseRepositoryService],
    }).compileComponents();

    directoryService = TestBed.inject(DirectoryService);
    fixture = TestBed.createComponent(AdminReportsComponent);
    component = fixture.componentInstance as unknown as AdminReportsHarness;
    fixture.detectChanges();
  });

  it('builds report rows, summary cards and branch names from the dataset', () => {
    const helper = component;

    expect(helper.reportRows().length).toBeGreaterThan(0);
    expect(helper.visibleRows().length).toBeGreaterThan(0);
    expect(helper.summaryCards()).toHaveSize(5);
    expect(helper.branchSummaries().length).toBeGreaterThan(0);
    expect(helper.branchNames().length).toBeGreaterThan(0);
  });

  it('filters rows across every report filter and resets back to defaults', () => {
    const helper = component;
    const approvedRow =
      helper.reportRows().find((row) => row.status === 'Approved') ?? helper.reportRows()[0];
    const approvedCategory = directoryService
      .categories()
      .find((category) => category.name === approvedRow.templateName);

    helper.patchFilter('fromDate', approvedRow.date);
    helper.patchFilter('toDate', approvedRow.date);
    helper.patchFilter('status', 'approved');
    helper.patchFilter('templateId', approvedCategory?.id ?? 'all');
    helper.patchFilter('branch', approvedRow.branch);
    helper.patchFilter('searchTerm', approvedRow.vendor);

    expect(helper.visibleRows().length).toBe(1);
    expect(helper.visibleRows()[0].id).toBe(approvedRow.id);

    helper.resetFilters();
    expect(helper.visibleRows().length).toBeGreaterThan(0);

    helper.patchFilter('searchTerm', 'no-such-report-term');
    expect(helper.visibleRows().length).toBe(0);
    expect(helper.summaryCards()[0].value).toBe('0');
    expect(helper.branchSummaries()).toEqual([]);
  });

  it('normalizes statuses and resolves approvers with duplicate and empty audit trails', () => {
    const helper = component;

    expect(helper.normalizeStatus(ExpenseStatus.Approved)).toBe('Approved');
    expect(helper.normalizeStatus(ExpenseStatus.Rejected)).toBe('Rejected');
    expect(helper.normalizeStatus(ExpenseStatus.Draft)).toBe('Draft');
    expect(helper.normalizeStatus(ExpenseStatus.Submitted)).toBe('Pending');
    expect(helper.normalizeStatus(ExpenseStatus.OverBudget)).toBe('Pending');

    expect(
      helper.resolveApprovers(
        {
          auditTrail: [
            { actor: 'Aarav Malhotra' },
            { actor: 'Aarav Malhotra' },
            { actor: 'Finance Desk' },
            { actor: 'Audit Lead' },
          ],
        },
        'Rhea Sharma',
      ),
    ).toEqual(['Rhea Sharma', 'Aarav Malhotra', 'Finance Desk']);

    expect(helper.resolveApprovers({ auditTrail: [] }, 'Rhea Sharma')).toEqual([
      'Rhea Sharma',
      'Finance Desk',
      'Audit Lead',
    ]);
  });
});
