import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IconComponent } from './icon.component';

describe('IconComponent', () => {
  let fixture: ComponentFixture<IconComponent>;
  let component: IconComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IconComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(IconComponent);
    component = fixture.componentInstance;
  });

  it('renders a named icon with the configured size and stroke width', () => {
    fixture.componentRef.setInput('name', 'receipt');
    fixture.componentRef.setInput('size', 24);
    fixture.componentRef.setInput('strokeWidth', 2.5);
    fixture.detectChanges();

    const svg = fixture.nativeElement.querySelector('svg');

    expect(svg.getAttribute('width')).toBe('24');
    expect(svg.getAttribute('height')).toBe('24');
    expect(svg.getAttribute('stroke-width')).toBe('2.5');
    expect(fixture.nativeElement.querySelectorAll('path').length).toBeGreaterThan(0);
    expect((component as unknown as { paths: () => string[] }).paths().length).toBeGreaterThan(0);
  });

  it('falls back to the default dashboard icon for unknown names', () => {
    fixture.componentRef.setInput('name', 'does-not-exist');
    fixture.detectChanges();

    expect((component as unknown as { paths: () => string[] }).paths().length).toBe(1);
    expect(fixture.nativeElement.querySelectorAll('path').length).toBe(1);
  });
});
