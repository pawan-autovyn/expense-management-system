import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { DatePipe, NgClass } from '@angular/common';

export interface TimelineItem {
  id: string;
  title: string;
  description: string;
  date: string;
  tone: 'info' | 'success' | 'warning' | 'danger';
}

@Component({
  selector: 'app-activity-timeline',
  standalone: true,
  imports: [DatePipe, NgClass],
  template: `
    <section class="glass-card timeline-card">
      <div class="section-heading">
        <div>
          <p class="eyebrow">{{ title() }}</p>
          <h3>{{ subtitle() }}</h3>
        </div>
      </div>

      <div class="timeline-list">
        @for (item of items(); track item.id) {
          <article class="timeline-item">
            <span class="timeline-item__dot" [ngClass]="'timeline-item__dot--' + item.tone"></span>
            <div>
              <strong>{{ item.title }}</strong>
              <p>{{ item.description }}</p>
            </div>
            <time>{{ item.date | date: 'MMM d, h:mm a' }}</time>
          </article>
        }
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivityTimelineComponent {
  readonly title = input('Activity timeline');
  readonly subtitle = input('Recent operational events');
  readonly items = input.required<TimelineItem[]>();
}
