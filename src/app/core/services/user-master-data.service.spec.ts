import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { UserMasterDataService } from './user-master-data.service';

describe('UserMasterDataService', () => {
  let service: UserMasterDataService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [UserMasterDataService, provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(UserMasterDataService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('exposes local default masters before the API loads', () => {
    expect(service.masters().role).toEqual(['Admin', 'OperationManager', 'Recommender']);
  });

  it('loads master data from the backend', async () => {
    const loadPromise = service.loadMasters();

    const request = httpMock.expectOne('/api/masters');
    expect(request.request.method).toBe('GET');
    request.flush({
      role: ['Admin', 'OperationManager', 'Recommender'],
    });

    await loadPromise;

    expect(service.masters().role).toEqual(['Admin', 'OperationManager', 'Recommender']);
    expect(service.loading()).toBeFalse();
    expect(service.error()).toBeNull();
  });

  it('keeps defaults when the backend fails', async () => {
    const loadPromise = service.loadMasters();

    const request = httpMock.expectOne('/api/masters');
    request.error(new ProgressEvent('network error'));

    await loadPromise;

    expect(service.masters().role).toEqual(['Admin', 'OperationManager', 'Recommender']);
    expect(service.error()).toContain('Unable to load master values');
    expect(service.loading()).toBeFalse();
  });

  it('persists admin-added master values and ignores duplicates', () => {
    expect(service.addRole('HR')).toBeTrue();
    expect(service.addRole('hr')).toBeFalse();

    expect(service.masters().role).toContain('HR');

    expect(JSON.parse(localStorage.getItem('ems.master-data') ?? '{}')).toEqual(
      jasmine.objectContaining({
        role: jasmine.arrayContaining(['HR']),
      }),
    );
  });

  it('merges backend masters with locally stored additions', async () => {
    service.addRole('HR');

    const loadPromise = service.loadMasters();

    const request = httpMock.expectOne('/api/masters');
    request.flush({
      role: ['Admin', 'OperationManager', 'Recommender'],
    });

    await loadPromise;

    expect(service.masters().role).toEqual(['Admin', 'OperationManager', 'Recommender', 'HR']);
  });
});
