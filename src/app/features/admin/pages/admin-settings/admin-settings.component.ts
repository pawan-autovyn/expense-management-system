import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';

import { DirectoryService } from '../../../../core/services/directory.service';
import { UserManagementApiService } from '../../../../core/services/user-management-api.service';
import { UserMasterDataService } from '../../../../core/services/user-master-data.service';
import { CreateUserRequest, UserDirectoryItem } from '../../../../models/user-management.models';

@Component({
  selector: 'app-admin-settings',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './admin-settings.component.html',
  styleUrl: './admin-settings.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminSettingsComponent {
  private readonly formBuilder = inject(FormBuilder);
  protected readonly directoryService = inject(DirectoryService);
  private readonly userMasterDataService = inject(UserMasterDataService);
  private readonly userManagementApi = inject(UserManagementApiService);

  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly successMessage = signal('');
  protected readonly users = signal<UserDirectoryItem[]>([]);
  protected readonly roleLabels = this.userMasterDataService.masters;
  protected readonly locationOptions = computed(() => this.directoryService.locations());
  protected readonly activeUserCount = computed(
    () => this.users().filter((user) => user.status === 'active').length,
  );
  protected readonly adminCount = computed(
    () => this.users().filter((user) => user.role === 'admin').length,
  );
  protected readonly recommenderCount = computed(
    () => this.users().filter((user) => user.role === 'recommender').length,
  );
  protected readonly settingsForm = this.formBuilder.nonNullable.group({
    firstName: ['', [Validators.required, Validators.minLength(2)]],
    lastName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    phoneNumber: ['', Validators.required],
    role: ['operation-manager', Validators.required],
    department: ['', Validators.required],
    title: ['', Validators.required],
    locationId: ['', Validators.required],
    status: ['active', Validators.required],
    password: ['', [Validators.required, Validators.minLength(8)]],
    avatarUrl: [''],
  });

  constructor() {
    void this.initialize();
  }

  protected readonly recentUsers = computed(() =>
    [...this.users()]
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
      .slice(0, 8),
  );

  protected async createUser(): Promise<void> {
    if (this.settingsForm.invalid) {
      this.settingsForm.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    try {
      const value = this.settingsForm.getRawValue() as CreateUserRequest;
      const createdUser = await firstValueFrom(this.userManagementApi.createUser(value));

      this.successMessage.set(`${createdUser.firstName} ${createdUser.lastName} was created successfully.`);
      this.settingsForm.patchValue({
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        department: '',
        title: '',
        password: '',
        avatarUrl: '',
      });
      await this.refreshUsers();
    } catch {
      this.errorMessage.set('Unable to create the user right now. Please verify the API and form values.');
    } finally {
      this.saving.set(false);
    }
  }

  protected shouldShowError(
    name:
      | 'firstName'
      | 'lastName'
      | 'email'
      | 'phoneNumber'
      | 'role'
      | 'department'
      | 'title'
      | 'locationId'
      | 'status'
      | 'password',
  ): boolean {
    const control = this.settingsForm.controls[name];

    return Boolean(control.invalid && (control.dirty || control.touched));
  }

  protected roleValueFromLabel(label: string): 'admin' | 'operation-manager' | 'recommender' {
    const normalized = label.trim().toLowerCase();

    if (normalized === 'admin') {
      return 'admin';
    }

    if (normalized === 'recommender') {
      return 'recommender';
    }

    return 'operation-manager';
  }

  private async initialize(): Promise<void> {
    this.loading.set(true);
    this.errorMessage.set('');

    try {
      await this.directoryService.loadWorkspaceData();
      await this.userMasterDataService.loadMasters();

      if (!this.settingsForm.controls.locationId.value && this.locationOptions()[0]?.id) {
        this.settingsForm.patchValue({
          locationId: this.locationOptions()[0].id,
        });
      }

      await this.refreshUsers();
    } catch {
      this.errorMessage.set('Unable to load admin settings data from the API.');
    } finally {
      this.loading.set(false);
    }
  }

  private async refreshUsers(): Promise<void> {
    const users = await firstValueFrom(this.userManagementApi.listUsers());
    this.users.set(users);
  }
}
