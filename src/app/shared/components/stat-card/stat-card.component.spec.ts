import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StatCardComponent } from './stat-card.component';

describe('StatCardComponent', () => {
  let fixture: ComponentFixture<StatCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(StatCardComponent);
  });

  it('renders delta and progress when provided', () => {
    fixture.componentRef.setInput('title', 'Monthly Spend');
    fixture.componentRef.setInput('value', '₹12,500');
    fixture.componentRef.setInput('subtitle', 'Compared to last month');
    fixture.componentRef.setInput('delta', 14.2);
    fixture.componentRef.setInput('progress', 62);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Monthly Spend');
    expect(fixture.nativeElement.textContent).toContain('₹12,500');
    expect(fixture.nativeElement.textContent).toContain('14.2%');
    expect(fixture.nativeElement.querySelector('.progress-fill')).not.toBeNull();
  });

  it('skips optional sections when values are not provided', () => {
    fixture.componentRef.setInput('title', 'Open Tasks');
    fixture.componentRef.setInput('value', '8');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.stat-card__delta')).toBeNull();
    expect(fixture.nativeElement.querySelector('.progress-fill')).toBeNull();
  });
});
