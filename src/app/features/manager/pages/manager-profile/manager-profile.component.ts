import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';

import { AuthService } from '../../../../core/services/auth.service';
import { DirectoryService } from '../../../../core/services/directory.service';
import { ProfileApiService } from '../../../../core/services/profile-api.service';
import { IconComponent } from '../../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-manager-profile',
  standalone: true,
  imports: [CurrencyPipe, FormsModule, IconComponent],
  templateUrl: './manager-profile.component.html',
  styleUrl: './manager-profile.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManagerProfileComponent {
  protected readonly authService = inject(AuthService);
  private readonly directoryService = inject(DirectoryService);
  private readonly profileApi = inject(ProfileApiService);
  protected readonly currentUser = this.authService.currentUser;
  protected readonly currentPassword = signal('');
  protected readonly newPassword = signal('');
  protected readonly confirmPassword = signal('');
  protected readonly requirePasswordReset = signal(true);
  protected readonly signOutOtherDevices = signal(true);
  protected readonly passwordMessage = signal('');
  protected readonly passwordSaving = signal(false);

  protected async updatePassword(): Promise<void> {
    const nextPassword = this.newPassword().trim();

    if (!nextPassword || nextPassword.length < 8) {
      this.passwordMessage.set('Use at least 8 characters for the new password.');
      return;
    }

    if (nextPassword !== this.confirmPassword().trim()) {
      this.passwordMessage.set('New password and confirmation must match.');
      return;
    }

    if (!this.currentPassword().trim()) {
      this.passwordMessage.set('Enter your current password before saving changes.');
      return;
    }

    this.passwordSaving.set(true);

    try {
      const response = await firstValueFrom(
        this.profileApi.updatePassword({
          currentPassword: this.currentPassword().trim(),
          newPassword: nextPassword,
          requirePasswordReset: this.requirePasswordReset(),
          signOutOtherDevices: this.signOutOtherDevices(),
        }),
      );

      this.passwordMessage.set(
        `${response.message}${this.requirePasswordReset() ? ' Next-login reset is enabled.' : ''}`,
      );
      this.currentPassword.set('');
      this.newPassword.set('');
      this.confirmPassword.set('');
    } catch {
      this.passwordMessage.set('Unable to update the password right now. Please verify the current password.');
    } finally {
      this.passwordSaving.set(false);
    }
  }

  protected applyStrongPreset(): void {
    this.newPassword.set('ExpenseFlow#2026');
    this.confirmPassword.set('ExpenseFlow#2026');
    this.passwordMessage.set('Strong password preset applied to the form.');
  }

  protected setRequirePasswordReset(event: Event): void {
    this.requirePasswordReset.set((event.target as HTMLInputElement).checked);
  }

  protected setSignOutOtherDevices(event: Event): void {
    this.signOutOtherDevices.set((event.target as HTMLInputElement).checked);
  }

  protected clearSecurityForm(): void {
    this.currentPassword.set('');
    this.newPassword.set('');
    this.confirmPassword.set('');
    this.passwordMessage.set('');
    this.requirePasswordReset.set(true);
    this.signOutOtherDevices.set(true);
  }

  protected profileAccessSummary(): string {
    const user = this.currentUser();

    if (!user) {
      return 'No active session.';
    }

    if (user.role === 'admin') {
      return 'Full approval, reporting, and user management access.';
    }

    if (user.role === 'recommender') {
      return 'Recommendation queue, review, and workflow routing access.';
    }

    return 'Expense submission, tracking, reopen, and resubmission access.';
  }

  protected totalBudget(): number {
    const locationName = this.currentUser()?.location ?? '';
    const locationId = this.directoryService.getLocationByName(locationName)?.id ?? '';

    return locationId ? this.directoryService.getTotalBudgetForLocation(locationId) : 0;
  }
}
