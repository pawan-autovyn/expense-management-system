import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { NgClass } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

import { NAVIGATION_ITEMS } from '../../core/constants/navigation.constants';
import { AuthService } from '../../core/services/auth.service';
import { APP_SUBTITLE, APP_TITLE } from '../../core/constants/app.constants';
import { IconComponent } from '../../shared/components/icon/icon.component';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [NgClass, RouterLink, RouterLinkActive, IconComponent],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly open = input(false);
  readonly closeRequested = output<void>();
  readonly toggleRequested = output<void>();
  protected readonly title = APP_TITLE;
  protected readonly subtitle = APP_SUBTITLE;
  protected readonly navigationItems = computed(() =>
    NAVIGATION_ITEMS.filter((item) => {
      const role = this.authService.currentRole();

      return role ? item.roles.includes(role) : false;
    }),
  );

  protected logout(): void {
    this.authService.signOut();
    void this.router.navigateByUrl('/login');
  }
}
