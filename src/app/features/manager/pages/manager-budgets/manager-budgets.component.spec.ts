import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { ManagerBudgetsComponent } from './manager-budgets.component';

describe('ManagerBudgetsComponent', () => {
  let fixture: ComponentFixture<ManagerBudgetsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManagerBudgetsComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(ManagerBudgetsComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
