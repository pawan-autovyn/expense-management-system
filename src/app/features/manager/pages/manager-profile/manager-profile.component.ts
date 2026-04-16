import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AuthService } from '../../../../core/services/auth.service';
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
  protected readonly currentPassword = signal('');
  protected readonly newPassword = signal('');
  protected readonly confirmPassword = signal('');
  protected readonly requirePasswordReset = signal(true);
  protected readonly signOutOtherDevices = signal(true);
  protected readonly passwordMessage = signal('');

  protected updatePassword(): void {
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

    this.passwordMessage.set(
      `Password settings saved${this.requirePasswordReset() ? ' with next-login reset enabled' : ''}.`,
    );
    this.currentPassword.set('');
    this.newPassword.set('');
    this.confirmPassword.set('');
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
}
