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
  template: `
    <div class="chart-card glass-card donut-card">
      <div class="chart-card__header">
        <div>
          <p class="eyebrow">{{ title() }}</p>
          <h3>{{ centerValue() }}</h3>
        </div>
        <p class="muted">{{ centerLabel() }}</p>
      </div>

      <div class="donut-card__content">
        <svg viewBox="0 0 120 120" class="donut-svg" aria-label="Utilization donut">
          <circle cx="60" cy="60" r="42" class="donut-track"></circle>
          @for (segment of segmentsWithOffsets(); track segment.label) {
            <circle
              cx="60"
              cy="60"
              r="42"
              class="donut-segment"
              [style.stroke]="segment.color"
              [style.stroke-dasharray]="segment.dashArray"
              [style.stroke-dashoffset]="segment.dashOffset"
            ></circle>
          }
        </svg>

        <div class="donut-card__legend">
          @for (segment of segments(); track segment.label) {
            <div>
              <span class="swatch" [ngStyle]="{ background: segment.color }"></span>
              <span>{{ segment.label }}</span>
            </div>
          }
        </div>
      </div>
    </div>
  `,
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
