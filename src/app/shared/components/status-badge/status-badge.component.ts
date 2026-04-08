import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [NgClass],
  template: `
    <span class="status-badge" [ngClass]="'status-badge--' + tone()">
      {{ label() }}
    </span>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusBadgeComponent {
  readonly label = input.required<string>();

  protected readonly tone = computed(() => {
    const value = this.label().toLowerCase();

    if (value.includes('approved') || value.includes('within')) {
      return 'success';
    }

    if (
      value.includes('warning') ||
      value.includes('review') ||
      value.includes('near') ||
      value.includes('pending')
    ) {
      return 'warning';
    }

    if (value.includes('over') || value.includes('reject')) {
      return 'danger';
    }

    return 'info';
  });
}
