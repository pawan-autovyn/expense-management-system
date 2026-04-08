import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActivityTimelineComponent, TimelineItem } from './activity-timeline.component';

describe('ActivityTimelineComponent', () => {
  let fixture: ComponentFixture<ActivityTimelineComponent>;

  const items: TimelineItem[] = [
    {
      id: 'evt-1',
      title: 'Submitted',
      description: 'Expense submitted for review',
      date: '2026-04-01T10:30:00+05:30',
      tone: 'info',
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActivityTimelineComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ActivityTimelineComponent);
  });

  it('renders the timeline heading and entries', () => {
    fixture.componentRef.setInput('title', 'Workflow');
    fixture.componentRef.setInput('subtitle', 'Latest steps');
    fixture.componentRef.setInput('items', items);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Workflow');
    expect(fixture.nativeElement.textContent).toContain('Latest steps');
    expect(fixture.nativeElement.textContent).toContain('Submitted');
    expect(fixture.nativeElement.textContent).toContain('Expense submitted for review');
  });
});
