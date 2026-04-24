import { TestBed } from '@angular/core/testing';

import { ApprovalStage, ExpenseStatus, Role } from '../../models/app.models';
import { STORAGE_KEYS } from '../constants/app.constants';
import { DirectoryService } from './directory.service';
import { ExpenseRepositoryService } from './expense-repository.service';

describe('ExpenseRepositoryService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  function createService(): {
    service: ExpenseRepositoryService;
    directoryService: DirectoryService;
  } {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [ExpenseRepositoryService, DirectoryService],
    });

    return {
      service: TestBed.inject(ExpenseRepositoryService),
      directoryService: TestBed.inject(DirectoryService),
    };
  }

  it('restores seeded expenses when storage is empty and cleans invalid payloads', () => {
    const empty = createService();

    expect(empty.service.expenses().length).toBeGreaterThan(0);
    expect(empty.service.totalExpenseCount()).toBe(empty.service.expenses().length);

    localStorage.setItem(STORAGE_KEYS.expenses, 'not-json');
    const invalid = createService();

    expect(localStorage.getItem(STORAGE_KEYS.expenses)).toBeNull();
    expect(invalid.service.expenses().length).toBeGreaterThan(0);
  });

  it('creates, updates, and deletes draft expenses', async () => {
    const { service, directoryService } = createService();
    const manager = directoryService.getDefaultUserByRole(Role.OperationManager);
    const sharedForm = {
      title: 'Pantry top up',
      categoryId: 'laptop',
      locationId: 'loc-hq',
      amount: 120,
      date: '2026-04-03',
      description: 'Tea and cups',
      vendor: 'Fresh Brew Traders',
      tags: ['pantry'],
    };
    let now = 1_000_000;

    spyOn(Date, 'now').and.callFake(() => now++);

    const draft = await service.createExpense(sharedForm, manager, ExpenseStatus.Draft);
    const draftUpdate = await service.updateDraft(
      draft.id,
      {
        ...sharedForm,
        amount: 140,
      },
      ExpenseStatus.Draft,
    );
    const submittedDraft = await service.createExpense(
      {
        ...sharedForm,
        title: 'Pantry top up submitted',
        locationId: 'loc-hq',
      },
      manager,
      ExpenseStatus.Draft,
    );
    const convertedDraft = await service.updateDraft(
      submittedDraft.id,
      {
        ...sharedForm,
        title: 'Pantry top up submitted',
        amount: 180,
        locationId: 'loc-hq',
      },
      ExpenseStatus.Submitted,
    );
    const removableDraft = await service.createExpense(
      {
        ...sharedForm,
        title: 'Draft to remove',
        locationId: 'loc-hq',
      },
      manager,
      ExpenseStatus.Draft,
    );

    expect(draft.status).toBe(ExpenseStatus.Draft);
    expect(draft.approvalStage).toBe(ApprovalStage.OperationManager);
    expect(draftUpdate?.status).toBe(ExpenseStatus.Draft);
    expect(draftUpdate?.approvalStage).toBe(ApprovalStage.OperationManager);
    expect(convertedDraft?.status).toBe(ExpenseStatus.Submitted);
    expect(convertedDraft?.approvalStage).toBe(ApprovalStage.OperationManager);
    await expectAsync(
      service.updateDraft('missing-id', sharedForm, ExpenseStatus.Submitted),
    ).toBeResolvedTo(undefined);

    await service.deleteDraft(removableDraft.id);

    expect(service.getExpenseById(removableDraft.id)).toBeUndefined();

    const receipt = service.attachReceipt('receipt.svg', '/assets/receipt.svg');

    expect(receipt.id).toEqual(jasmine.any(String));
    expect(receipt.name).toBe('receipt.svg');
    expect(receipt.url).toBe('/assets/receipt.svg');
    expect(receipt.mimeType).toBe('image/*');
  });

  it('approves, rejects, and reopens expenses', async () => {
    const { service, directoryService } = createService();
    const manager = directoryService.getDefaultUserByRole(Role.OperationManager);
    const recommender = directoryService.getDefaultUserByRole(Role.Recommender);
    const admin = directoryService.getDefaultUserByRole(Role.Admin);
    const submittedExpense = await service.createExpense(
      {
        title: 'Approval flow expense',
        categoryId: 'laptop',
        locationId: 'loc-hq',
        amount: 250,
        date: '2026-04-03',
        description: 'Flow test',
        vendor: 'Flow Vendor',
        tags: ['flow'],
      },
      manager,
      ExpenseStatus.Submitted,
    );

    expect((await service.approveExpense(submittedExpense.id, recommender, 'Looks good'))?.status).toBe(
      ExpenseStatus.Recommended,
    );
    expect(
      (await service.approveExpense(submittedExpense.id, recommender, 'Looks good'))?.approvalStage,
    ).toBe(
      ApprovalStage.Recommender,
    );
    expect((await service.approveExpense(submittedExpense.id, admin, 'Looks good'))?.status).toBe(
      ExpenseStatus.Approved,
    );
    expect((await service.approveExpense(submittedExpense.id, recommender, 'Final attempt'))?.status).toBe(
      ExpenseStatus.Approved,
    );
    expect((await service.rejectExpense(submittedExpense.id, admin, 'Needs more detail'))?.status).toBe(
      ExpenseStatus.Rejected,
    );
    expect((await service.reopenExpense(submittedExpense.id, admin, 'Re-opened for review'))?.status).toBe(
      ExpenseStatus.Reopened,
    );
    expect(service.getExpensesForManager('usr-mgr-1').length).toBeGreaterThan(0);
    expect(
      service
        .getExpensesForManager('usr-mgr-1')
        .every((expense) => expense.managerId === 'usr-mgr-1'),
    ).toBeTrue();
    expect(service.getExpenseById('missing-id')).toBeUndefined();
  });

  it('restores valid stored expenses and persists submitted requests', async () => {
    const storedExpenses = [
      {
        id: 'stored-draft',
        title: 'Stored draft',
        categoryId: 'tea-pantry',
        locationId: 'loc-hq',
        amount: 75,
        date: '2026-04-01',
        description: 'Stored draft',
        vendor: 'Stored Vendor',
        tags: ['stored'],
        managerId: 'usr-mgr-1',
        status: ExpenseStatus.Draft,
        createdAt: '2026-04-01T10:00:00+05:30',
        updatedAt: '2026-04-01T10:00:00+05:30',
        auditTrail: [],
      },
    ];
    localStorage.setItem(STORAGE_KEYS.expenses, JSON.stringify(storedExpenses));

    const { service, directoryService } = createService();
    const manager = directoryService.getDefaultUserByRole(Role.OperationManager);
    const submitted = await service.createExpense(
      {
        title: 'Submitted pantry top up',
        categoryId: 'tea-pantry',
        locationId: 'loc-hq',
        amount: 50,
        date: '2026-04-03',
        description: 'Submitted pantry top up',
        vendor: 'Fresh Brew Traders',
        tags: ['pantry'],
      },
      manager,
      ExpenseStatus.Submitted,
    );
    const updated = await service.updateDraft(
      'stored-draft',
      {
        title: 'Stored draft updated',
        categoryId: 'tea-pantry',
        locationId: 'loc-hq',
        amount: 80,
        date: '2026-04-03',
        description: 'Stored draft updated',
        vendor: 'Stored Vendor',
        tags: ['stored'],
      },
      ExpenseStatus.Submitted,
    );

    expect(submitted.status).toBe(ExpenseStatus.Submitted);
    expect(service.getExpenseById(submitted.id)).toBeDefined();
    expect(updated?.status).toBe(ExpenseStatus.Submitted);
    expect(updated?.auditTrail[0]?.actor).toBe('Operation Manager');
  });
});
