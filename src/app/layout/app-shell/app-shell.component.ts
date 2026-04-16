import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';
import { Role } from '../../models/app.models';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { TopbarComponent } from '../topbar/topbar.component';

@Component({
  selector: 'app-app-shell',
  standalone: true,
  imports: [RouterLink, RouterOutlet, SidebarComponent, TopbarComponent, IconComponent],
  templateUrl: './app-shell.component.html',
  styleUrl: './app-shell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppShellComponent {
  private readonly authService = inject(AuthService);
  protected readonly quickActionRoute = computed(() => {
    const role = this.authService.currentRole();

    if (role === Role.Admin) {
      return '/admin/approvals';
    }

    if (role === Role.Recommender) {
      return '/recommender/recommendation';
    }

    if (role === Role.OperationManager) {
      return '/operation-manager/add-expense';
    }

    return '/operation-manager/add-expense';
  });
  protected readonly quickActionLabel = computed(() => {
    const role = this.authService.currentRole();

    if (role === Role.Admin) {
      return 'Open approvals';
    }

    if (role === Role.Recommender) {
      return 'Review queue';
    }

    return 'New expense';
  });

}
