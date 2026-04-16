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
  templateUrl: './activity-timeline.component.html',
  styleUrl: './activity-timeline.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivityTimelineComponent {
  readonly title = input('Activity timeline');
  readonly subtitle = input('Recent operational events');
  readonly items = input.required<TimelineItem[]>();
}
