import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { NgStyle } from '@angular/common';

export interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

@Component({
  selector: 'app-donut-chart',
  standalone: true,
  imports: [NgStyle],
  templateUrl: './donut-chart.component.html',
  styleUrl: './donut-chart.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DonutChartComponent {
  readonly title = input('Budget utilization');
  readonly centerValue = input('0%');
  readonly centerLabel = input('Utilization');
  readonly segments = input.required<DonutSegment[]>();

  protected readonly segmentsWithOffsets = computed(() => {
    const radius = 42;
    const circumference = 2 * Math.PI * radius;
    const total = this.segments().reduce((sum, segment) => sum + segment.value, 0) || 1;
    let offset = 0;

    return this.segments().map((segment) => {
      const length = (segment.value / total) * circumference;
      const dashOffset = circumference - offset;
      offset += length;

      return {
        ...segment,
        dashArray: `${length} ${circumference - length}`,
        dashOffset,
      };
    });
  });
}
