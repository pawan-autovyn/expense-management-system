import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { getSidebarItemsForRole } from '../../core/constants/navigation.constants';
import { AuthService } from '../../core/services/auth.service';
import { APP_SUBTITLE, APP_TITLE } from '../../core/constants/app.constants';
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

  protected readonly title = APP_TITLE;
  protected readonly subtitle = APP_SUBTITLE;
  protected readonly navigationItems = computed(() =>
    getSidebarItemsForRole(this.authService.currentRole()),
  );

  protected trackByRoute(_: number, item: { route: string }): string {
    return item.route;
  }
}
