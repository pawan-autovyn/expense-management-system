import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LineChartComponent } from './line-chart.component';

describe('LineChartComponent', () => {
  let fixture: ComponentFixture<LineChartComponent>;
  let component: LineChartComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LineChartComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LineChartComponent);
    component = fixture.componentInstance;
  });

  it('renders an empty chart state when no points are provided', () => {
    fixture.componentRef.setInput('data', []);
    fixture.detectChanges();

    expect((component as unknown as { areaPath: () => string }).areaPath()).toBe('');
    expect((component as unknown as { plottedPoints: () => unknown[] }).plottedPoints()).toEqual(
      [],
    );
    expect(fixture.nativeElement.querySelectorAll('.chart-dot').length).toBe(0);
  });

  it('plots points and the budget line for chart data', () => {
    fixture.componentRef.setInput('title', 'Trend');
    fixture.componentRef.setInput('subtitle', 'Budget versus spend');
    fixture.componentRef.setInput('headline', 'Operational momentum');
    fixture.componentRef.setInput('data', [
      { label: 'Jan', total: 20, budget: 40, comparison: 0 },
      { label: 'Feb', total: 10, budget: 30, comparison: 0 },
    ]);
    fixture.detectChanges();

    expect((component as unknown as { areaPath: () => string }).areaPath()).toContain('M 40 190');
    expect((component as unknown as { points: () => string }).points()).toContain('40,');
    expect((component as unknown as { budgetPoints: () => string }).budgetPoints()).toContain(
      '40,',
    );
    expect(fixture.nativeElement.querySelectorAll('.chart-dot').length).toBe(2);
    expect(fixture.nativeElement.textContent).toContain('Trend');
    expect(fixture.nativeElement.textContent).toContain('Operational momentum');
  });
});
