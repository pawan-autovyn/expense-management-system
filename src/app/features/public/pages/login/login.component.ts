import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import { AuthService } from '../../../../core/services/auth.service';
import { IconComponent } from '../../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [IconComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  protected readonly userId = signal('');
  protected readonly password = signal('');
  protected readonly rememberMe = signal(true);
  protected readonly loginError = signal('');

  protected updateUserId(value: string): void {
    this.userId.set(value.trim());
    this.loginError.set('');
  }

  protected updatePassword(value: string): void {
    this.password.set(value);
    this.loginError.set('');
  }

  protected updateRememberMe(checked: boolean): void {
    this.rememberMe.set(checked);
  }

  protected async login(): Promise<void> {
    const userId = this.userId().trim();
    const password = this.password();
    const user = await Promise.resolve(this.authService.loginWithCredentials(userId, password));

    if (!user) {
      this.loginError.set('Enter a valid user ID and password.');
      return;
    }

    void this.router.navigateByUrl(this.authService.getDefaultRouteForRole(user.role));
  }
}
