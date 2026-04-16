import { TestBed } from '@angular/core/testing';

import { Role } from '../../models/app.models';
import { DirectoryService } from './directory.service';

describe('DirectoryService', () => {
  let service: DirectoryService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DirectoryService],
    });

    service = TestBed.inject(DirectoryService);
  });

  it('returns role-specific users and categories', () => {
    const admin = service.getDefaultUserByRole(Role.Admin);
    const manager = service.getUserById('usr-mgr-1');
    const category = service.getCategoryById('tea-pantry');

    expect(admin.role).toBe(Role.Admin);
    expect(manager?.role).toBe(Role.OperationManager);
    expect(category?.name).toContain('Tea');
  });

  it('falls back to the first user and returns undefined for missing entries', () => {
    const fallback = service.getDefaultUserByRole('unknown-role' as Role);

    expect(fallback.role).toBe(Role.Admin);
    expect(service.getUserById('missing-user')).toBeUndefined();
    expect(service.getCategoryById('missing-category')).toBeUndefined();
  });

  it('adds a new category to the shared catalog', () => {
    const before = service.categories().length;

    service.addCategory({
      id: 'courier-1',
      name: 'Courier',
      description: 'Courier and dispatch expenses',
      icon: 'receipt',
      accent: '#1d4ed8',
      monthlyBudget: 3500,
      previousSpend: 0,
    });

    expect(service.categories().length).toBe(before + 1);
    expect(service.getCategoryById('courier-1')?.name).toBe('Courier');
  });
});
