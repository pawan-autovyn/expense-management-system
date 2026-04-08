import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DonutChartComponent } from './donut-chart.component';

describe('DonutChartComponent', () => {
  let fixture: ComponentFixture<DonutChartComponent>;
  let component: DonutChartComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DonutChartComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DonutChartComponent);
    component = fixture.componentInstance;
  });

  it('renders donut segments for a non-zero total', () => {
    fixture.componentRef.setInput('title', 'Budget utilization');
    fixture.componentRef.setInput('centerValue', '80%');
    fixture.componentRef.setInput('centerLabel', 'Utilization');
    fixture.componentRef.setInput('segments', [
      { label: 'Approved', value: 80, color: '#22C55E' },
      { label: 'Pending', value: 20, color: '#F59E0B' },
    ]);
    fixture.detectChanges();

    const content = fixture.nativeElement as HTMLElement;

    expect(content.textContent).toContain('Budget utilization');
    expect(content.textContent).toContain('80%');
    expect(content.querySelectorAll('.donut-segment').length).toBe(2);
    expect(content.querySelectorAll('.donut-card__legend > div').length).toBe(2);
    expect(
        (
          component as unknown as {
            segmentsWithOffsets: () => { dashArray: string; dashOffset: number }[];
          }
        ).segmentsWithOffsets()[0].dashArray,
    ).toContain(' ');
  });

  it('handles zero-value segments without dividing by zero', () => {
    fixture.componentRef.setInput('segments', [{ label: 'Empty', value: 0, color: '#94A3B8' }]);
    fixture.detectChanges();

    const offsets = (
      component as unknown as {
        segmentsWithOffsets: () => { dashArray: string; dashOffset: number }[];
      }
    ).segmentsWithOffsets();

    expect(offsets).toHaveSize(1);
    expect(offsets[0].dashOffset).toBeGreaterThan(0);
  });
});
