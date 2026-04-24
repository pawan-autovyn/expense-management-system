import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

import { getSidebarItemsForRole } from '../../core/constants/navigation.constants';
import { AuthService } from '../../core/services/auth.service';
import { APP_SUBTITLE, APP_TITLE } from '../../core/constants/app.constants';
import { NotificationService } from '../../core/services/notification.service';
import { IconComponent } from '../../shared/components/icon/icon.component';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [NgFor, NgIf, RouterLink, RouterLinkActive, IconComponent],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarComponent {
  private readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);
  private readonly router = inject(Router);

  protected readonly title = APP_TITLE;
  protected readonly subtitle = APP_SUBTITLE;
  protected readonly navigationItems = computed(() => {
    const role = this.authService.currentRole();
    const unreadCount = this.notificationService.getUnreadCountForRole(role);

    return getSidebarItemsForRole(role).map((item) => {
      if (!item.route.endsWith('/notifications')) {
        return item;
      }

      return {
        ...item,
        badge: unreadCount ? (unreadCount > 9 ? '9+' : String(unreadCount)) : undefined,
      };
    });
  });

  protected trackByRoute(_: number, item: { route: string }): string {
    return item.route;
  }

  protected logout(): void {
    this.notificationService.stopPolling();
    this.authService.signOut();
    void this.router.navigateByUrl('/login');
  }
}
