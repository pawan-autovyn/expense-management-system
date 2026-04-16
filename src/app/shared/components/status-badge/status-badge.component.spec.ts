import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StatusBadgeComponent } from './status-badge.component';

describe('StatusBadgeComponent', () => {
  let fixture: ComponentFixture<StatusBadgeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatusBadgeComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(StatusBadgeComponent);
  });

  it('maps labels to the expected tones', () => {
    const cases = [
      { label: 'Approved', toneClass: 'status-badge--success' },
      { label: 'Pending Review', toneClass: 'status-badge--warning' },
      { label: 'Recommended', toneClass: 'status-badge--warning' },
      { label: 'Reopened', toneClass: 'status-badge--warning' },
      { label: 'Rejected', toneClass: 'status-badge--danger' },
      { label: 'Cancelled', toneClass: 'status-badge--danger' },
      { label: 'Draft', toneClass: 'status-badge--info' },
    ];

    for (const testCase of cases) {
      fixture.componentRef.setInput('label', testCase.label);
      fixture.detectChanges();

      const badge = fixture.nativeElement.querySelector('.status-badge');
      expect(badge.className).toContain(testCase.toneClass);
      expect(badge.textContent).toContain(testCase.label);
    }
  });
});
