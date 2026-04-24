import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';
import { ConfirmationDialogService } from '../../core/services/confirmation-dialog.service';
import { ExpenseDialogService } from '../../core/services/expense-dialog.service';
import { Role } from '../../models/app.models';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { ExpenseWorkspaceDialogComponent } from '../../shared/components/expense-workspace-dialog/expense-workspace-dialog.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { TopbarComponent } from '../topbar/topbar.component';
import { ToastCenterComponent } from '../../shared/components/toast-center/toast-center.component';

@Component({
  selector: 'app-app-shell',
  standalone: true,
  imports: [
    ConfirmDialogComponent,
    ExpenseWorkspaceDialogComponent,
    RouterLink,
    RouterOutlet,
    SidebarComponent,
    TopbarComponent,
    IconComponent,
    ToastCenterComponent,
  ],
  templateUrl: './app-shell.component.html',
  styleUrl: './app-shell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppShellComponent {
  private readonly authService = inject(AuthService);
  protected readonly confirmationDialogService = inject(ConfirmationDialogService);
  protected readonly expenseDialogService = inject(ExpenseDialogService);
  protected readonly hasWorkspaceOverlay = computed(
    () =>
      Boolean(
        this.expenseDialogService.dialogRequest() ||
          this.expenseDialogService.deleteDialogOpen() ||
          this.confirmationDialogService.open(),
      ),
  );
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
