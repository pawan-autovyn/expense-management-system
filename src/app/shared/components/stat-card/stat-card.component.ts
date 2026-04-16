import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { NgClass, DecimalPipe } from '@angular/common';

import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [NgClass, DecimalPipe, IconComponent],
  templateUrl: './stat-card.component.html',
  styleUrl: './stat-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatCardComponent {
  readonly title = input.required<string>();
  readonly value = input.required<string>();
  readonly subtitle = input('');
  readonly icon = input('dashboard');
  readonly tone = input<'brand' | 'success' | 'warning' | 'danger'>('brand');
  readonly delta = input<number | null>(null);
  readonly progress = input<number | null>(null);
}
