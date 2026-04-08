import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { AdminBudgetsComponent } from './admin-budgets.component';

describe('AdminBudgetsComponent', () => {
  let fixture: ComponentFixture<AdminBudgetsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminBudgetsComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminBudgetsComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
