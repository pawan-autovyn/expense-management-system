import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';
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
  private readonly router = inject(Router);

  protected readonly currentUser = this.authService.currentUser;
  protected readonly roleLabel = computed(() => this.formatRole(this.authService.currentRole()));
  protected readonly initials = computed(() => this.createInitials(this.currentUser()?.name ?? 'Guest'));
  protected readonly profileRoute = computed(() =>
    this.authService.getProfileRouteForRole(this.authService.currentRole()),
  );

  protected logout(): void {
    this.authService.signOut();
    void this.router.navigateByUrl('/login');
  }

  protected openProfile(): void {
    void this.router.navigateByUrl(this.profileRoute());
  }

  private formatRole(role: string | null): string {
    if (!role) {
      return 'Guest session';
    }

    return role
      .split('-')
      .map((segment) => this.toTitle(segment))
      .join(' ');
  }

  private createInitials(name: string): string {
    const parts = name
      .split(/\s+/)
      .map((part) => part.trim())
      .filter(Boolean);

    return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('');
  }

  private toTitle(value: string): string {
    return value
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (letter) => letter.toUpperCase())
      .trim();
  }
}
