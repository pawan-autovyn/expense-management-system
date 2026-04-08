import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { NgClass, DecimalPipe } from '@angular/common';

import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [NgClass, DecimalPipe, IconComponent],
  template: `
    <article class="glass-card stat-card" [ngClass]="'stat-card--' + tone()">
      <div class="stat-card__header">
        <div>
          <p class="eyebrow">{{ title() }}</p>
          <h3>{{ value() }}</h3>
        </div>
        <span class="stat-card__icon">
          <app-icon [name]="icon()" [size]="20" />
        </span>
      </div>

      <p class="muted">{{ subtitle() }}</p>

      @if (delta()) {
        <div class="stat-card__delta">
          <app-icon name="arrow-up-right" [size]="14" />
          <span>{{ delta()! | number: '1.0-1' }}%</span>
        </div>
      }

      @if (progress() !== null) {
        <div class="progress-track">
          <span class="progress-fill" [style.width.%]="progress()"></span>
        </div>
      }
    </article>
  `,
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
