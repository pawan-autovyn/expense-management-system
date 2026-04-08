import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import { AuthService } from '../../../../core/services/auth.service';
import { ThemeService } from '../../../../core/services/theme.service';
import { Role } from '../../../../models/app.models';
import { IconComponent } from '../../../../shared/components/icon/icon.component';

interface LoginCredential {
  role: Role;
  label: string;
  email: string;
  password: string;
}

const LOGIN_CREDENTIALS: Record<Role, LoginCredential> = {
  [Role.Admin]: {
    role: Role.Admin,
    label: 'Admin',
    email: 'vikas.yadav@autovyn.in',
    password: 'admin123',
  },
  [Role.OperationManager]: {
    role: Role.OperationManager,
    label: 'Operation Manager',
    email: 'pankaj.jhakar@autovyn.in',
    password: 'manager123',
  },
};

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
  protected readonly themeService = inject(ThemeService);
  private readonly router = inject(Router);
  protected readonly Role = Role;
  protected readonly selectedRole = signal<Role>(Role.Admin);
  protected readonly email = signal(LOGIN_CREDENTIALS[Role.Admin].email);
  protected readonly password = signal(LOGIN_CREDENTIALS[Role.Admin].password);
  protected readonly rememberMe = signal(true);
  protected readonly loginError = signal('');
  protected readonly credentialOptions: LoginCredential[] = [
    LOGIN_CREDENTIALS[Role.Admin],
    LOGIN_CREDENTIALS[Role.OperationManager],
  ];

  protected selectCredential(role: Role): void {
    const credential = LOGIN_CREDENTIALS[role];

    this.selectedRole.set(role);
    this.email.set(credential.email);
    this.password.set(credential.password);
    this.loginError.set('');
  }

  protected updateEmail(value: string): void {
    const trimmedValue = value.trim();
    const credential = this.credentialOptions.find(
      (option) => option.email.toLowerCase() === trimmedValue.toLowerCase(),
    );

    this.email.set(trimmedValue);
    if (credential) {
      this.selectedRole.set(credential.role);
      this.password.set(credential.password);
    }
    this.loginError.set('');
  }

  protected updatePassword(value: string): void {
    this.password.set(value);
    this.loginError.set('');
  }

  protected updateRememberMe(checked: boolean): void {
    this.rememberMe.set(checked);
  }

  protected login(): void {
    const email = this.email().trim().toLowerCase();
    const password = this.password();
    const matchedCredential = this.credentialOptions.find(
      (credential) => credential.email.toLowerCase() === email && credential.password === password,
    );

    if (!matchedCredential) {
      this.loginError.set('Select a role or use the demo credentials shown below.');
      return;
    }

    this.selectedRole.set(matchedCredential.role);
    this.authService.loginAs(matchedCredential.role);
    void this.router.navigateByUrl(this.authService.getDefaultRouteForRole(matchedCredential.role));
  }
}
