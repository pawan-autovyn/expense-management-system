import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { of } from 'rxjs';

import { AdminSettingsComponent } from './admin-settings.component';
import { DirectoryService } from '../../../../core/services/directory.service';
import { UserMasterDataService } from '../../../../core/services/user-master-data.service';
import { UserManagementApiService } from '../../../../core/services/user-management-api.service';

describe('AdminSettingsComponent', () => {
  let fixture: ComponentFixture<AdminSettingsComponent>;

  beforeEach(async () => {
    const directoryServiceStub = {
      locations: signal([{ id: 'hq', name: 'Head Office', city: 'Delhi', code: 'HQ', active: true }]),
      loadReferenceData: jasmine.createSpy().and.resolveTo(null),
    };
    const userMasterDataServiceStub = {
      masters: signal({ role: ['Admin', 'OperationManager', 'Recommender'] }),
      loadMasters: jasmine.createSpy().and.resolveTo({ role: ['Admin', 'OperationManager', 'Recommender'] }),
    };
    const userManagementApiStub = {
      listUsers: jasmine.createSpy().and.returnValue(of([])),
      createUser: jasmine.createSpy(),
    };

    await TestBed.configureTestingModule({
      imports: [AdminSettingsComponent],
      providers: [
        provideRouter([]),
        { provide: DirectoryService, useValue: directoryServiceStub },
        { provide: UserMasterDataService, useValue: userMasterDataServiceStub },
        { provide: UserManagementApiService, useValue: userManagementApiStub },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminSettingsComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
