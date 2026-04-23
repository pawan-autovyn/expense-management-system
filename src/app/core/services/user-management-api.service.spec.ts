import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { UserManagementApiService } from './user-management-api.service';

describe('UserManagementApiService', () => {
  let service: UserManagementApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [UserManagementApiService, provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(UserManagementApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('posts a new user to the backend', () => {
    const payload = {
      firstName: 'Pawan',
      lastName: 'Kumar',
      email: 'pawan@example.com',
      phoneNumber: '+1234567890',
      role: 'admin' as const,
      department: 'Operations',
      title: 'Finance Lead',
      locationId: 'north-hub',
      status: 'active' as const,
      password: 'SecurePass123!',
    };

    service.createUser(payload).subscribe((response) => {
      expect(response.role).toBe('admin');
      expect(response.department).toBe('Operations');
      expect(response.title).toBe('Finance Lead');
      expect(response.locationId).toBe('north-hub');
      expect(response.status).toBe('active');
    });

    const request = httpMock.expectOne('/api/users');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      firstName: 'Pawan',
      lastName: 'Kumar',
      email: 'pawan@example.com',
      password: 'SecurePass123!',
      phoneNumber: '+1234567890',
      role: 'admin',
      department: 'Operations',
      title: 'Finance Lead',
      locationId: 'north-hub',
      status: 'active',
      avatarUrl: undefined,
    });

    request.flush({
      _id: 'u001',
      firstName: 'Pawan',
      lastName: 'Kumar',
      email: 'pawan@example.com',
      phoneNumber: '+1234567890',
      role: 'Admin',
      department: 'Operations',
      title: 'Finance Lead',
      locationId: 'north-hub',
      status: 'active',
      createdAt: '2024-06-01T12:00:00.000Z',
    });
  });
});
