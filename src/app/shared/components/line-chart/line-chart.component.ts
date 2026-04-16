import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';

import { TrendPoint } from '../../../models/app.models';

@Component({
  selector: 'app-line-chart',
  standalone: true,
  imports: [DecimalPipe],
  templateUrl: './line-chart.component.html',
  styleUrl: './line-chart.component.scss',
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
