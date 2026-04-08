import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NgClass } from '@angular/common';
import { RouterLink, RouterOutlet } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';
import { Role } from '../../models/app.models';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { TopbarComponent } from '../topbar/topbar.component';
import { IconComponent } from '../../shared/components/icon/icon.component';

@Component({
  selector: 'app-app-shell',
  standalone: true,
  imports: [NgClass, RouterLink, RouterOutlet, SidebarComponent, TopbarComponent, IconComponent],
  templateUrl: './app-shell.component.html',
  styleUrl: './app-shell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppShellComponent {
  private readonly authService = inject(AuthService);
  protected readonly sidebarOpen = signal(this.isDesktopViewport());
  protected readonly quickActionRoute = computed(() =>
    this.authService.currentRole() === Role.Admin ? '/admin/approvals' : '/manager/add-expense',
  );
  protected readonly quickActionLabel = computed(() =>
    this.authService.currentRole() === Role.Admin ? 'Review queue' : 'Quick add expense',
  );

  protected toggleSidebar(): void {
    this.sidebarOpen.update((value) => !value);
  }

  private isDesktopViewport(): boolean {
    return typeof window !== 'undefined' ? window.innerWidth >= 980 : true;
  }
}
