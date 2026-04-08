import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';

import { TrendPoint } from '../../../models/app.models';

@Component({
  selector: 'app-line-chart',
  standalone: true,
  imports: [DecimalPipe],
  template: `
    <div class="chart-card glass-card">
      <div class="chart-card__header">
        <div>
          <p class="eyebrow">{{ title() }}</p>
          <h3>{{ headline() }}</h3>
        </div>
        <p class="muted">{{ subtitle() }}</p>
      </div>

      <svg class="chart-svg" viewBox="0 0 420 220" preserveAspectRatio="none" aria-label="Trend chart">
        <defs>
          <linearGradient id="line-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stop-color="rgba(79, 70, 229, 0.45)" />
            <stop offset="100%" stop-color="rgba(79, 70, 229, 0)" />
          </linearGradient>
        </defs>
        <path class="chart-grid" d="M30 30H390 M30 95H390 M30 160H390" />
        <path class="chart-area" [attr.d]="areaPath()" />
        <polyline class="chart-line chart-line--budget" [attr.points]="budgetPoints()" />
        <polyline class="chart-line" [attr.points]="points()" />
        @for (point of plottedPoints(); track point.label) {
          <circle class="chart-dot" [attr.cx]="point.x" [attr.cy]="point.y" r="4"></circle>
        }
      </svg>

      <div class="chart-card__labels">
        @for (item of data(); track item.label) {
          <div>
            <span>{{ item.label }}</span>
            <strong>{{ item.total | number: '1.0-0' }}</strong>
          </div>
        }
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LineChartComponent {
  readonly title = input('Monthly trend');
  readonly subtitle = input('Budget versus spend');
  readonly headline = input('Operational momentum');
  readonly data = input.required<TrendPoint[]>();

  protected readonly plottedPoints = computed(() => {
    const points = this.data();
    const maxValue = Math.max(...points.flatMap((item) => [item.total, item.budget]), 1);

    return points.map((point, index) => ({
      ...point,
      x: 40 + index * 68,
      y: 180 - (point.total / maxValue) * 130,
      budgetY: 180 - (point.budget / maxValue) * 130,
    }));
  });

  protected readonly points = computed(() =>
    this.plottedPoints()
      .map((point) => `${point.x},${point.y}`)
      .join(' '),
  );

  protected readonly budgetPoints = computed(() =>
    this.plottedPoints()
      .map((point) => `${point.x},${point.budgetY}`)
      .join(' '),
  );

  protected readonly areaPath = computed(() => {
    const points = this.plottedPoints();

    if (!points.length) {
      return '';
    }

    const first = points[0];
    const last = points[points.length - 1];
    const body = points.map((point) => `L ${point.x} ${point.y}`).join(' ');

    return `M ${first.x} 190 L ${first.x} ${first.y} ${body} L ${last.x} 190 Z`;
  });
}
