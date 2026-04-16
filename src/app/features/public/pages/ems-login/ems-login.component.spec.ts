import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmsLoginComponent } from './ems-login.component';

describe('EmsLoginComponent', () => {
  let fixture: ComponentFixture<EmsLoginComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmsLoginComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(EmsLoginComponent);
    fixture.detectChanges();
  });

  it('renders the enterprise login form', () => {
    expect(fixture.nativeElement.textContent).toContain('ExpenseFlow');
    expect(fixture.nativeElement.textContent).toContain('Continue');
  });
});
