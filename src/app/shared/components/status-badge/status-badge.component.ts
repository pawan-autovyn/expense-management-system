import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [NgClass],
  templateUrl: './status-badge.component.html',
  styleUrl: './status-badge.component.scss',
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
      value.includes('pending') ||
      value.includes('recommended') ||
      value.includes('reopened')
    ) {
      return 'warning';
    }

    if (value.includes('over') || value.includes('reject') || value.includes('cancel')) {
      return 'danger';
    }

    return 'info';
  });
}
