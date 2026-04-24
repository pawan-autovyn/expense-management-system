import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NgClass } from '@angular/common';

import { ToastService } from '../../../core/services/toast.service';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-toast-center',
  standalone: true,
  imports: [NgClass, IconComponent],
  templateUrl: './toast-center.component.html',
  styleUrl: './toast-center.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastCenterComponent {
  protected readonly toastService = inject(ToastService);
  protected readonly toasts = this.toastService.toasts;

  protected resolveIcon(tone: 'info' | 'success' | 'warning' | 'danger'): string {
    if (tone === 'success') {
      return 'check-circle';
    }

    if (tone === 'warning') {
      return 'alert';
    }

    if (tone === 'danger') {
      return 'x';
    }

    return 'info';
  }

  protected dismiss(toastId: string): void {
    this.toastService.dismiss(toastId);
  }
}