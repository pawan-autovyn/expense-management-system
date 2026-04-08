import { ChangeDetectionStrategy, Component, computed, inject, output } from '@angular/core';
import { Router } from '@angular/router';

import { Role } from '../../models/app.models';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { ThemeService } from '../../core/services/theme.service';
import { IconComponent } from '../../shared/components/icon/icon.component';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [IconComponent],
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopbarComponent {
  private readonly authService = inject(AuthService);
  protected readonly notificationService = inject(NotificationService);
  protected readonly themeService = inject(ThemeService);
  private readonly router = inject(Router);
  readonly menuToggle = output<void>();
  protected readonly roleAdmin = Role.Admin;
  protected readonly roleManager = Role.OperationManager;
  protected readonly currentRole = computed(() => this.authService.currentRole());

  protected switchRole(role: Role): void {
    this.authService.switchRole(role);
    void this.router.navigateByUrl(this.authService.getDefaultRouteForRole(role));
  }
}
