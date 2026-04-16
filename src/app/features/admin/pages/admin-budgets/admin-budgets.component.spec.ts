import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { AdminBudgetsComponent } from './admin-budgets.component';

describe('AdminBudgetsComponent', () => {
  let fixture: ComponentFixture<AdminBudgetsComponent>;
  let component: AdminBudgetsComponent & {
    selectedCategory(): { id: string; monthlyBudget: number } | null;
    annualBudgetDraft(): number;
    monthlyAllocation(): number;
    setBudgetPreset(multiplier: number): void;
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminBudgetsComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminBudgetsComponent);
    component = fixture.componentInstance as typeof component;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('keeps the budget display in annual terms with a monthly split', () => {
    expect(component.selectedCategory()).toBeTruthy();
    expect(component.annualBudgetDraft()).toBeGreaterThan(0);
    expect(component.monthlyAllocation()).toBeGreaterThan(0);
    expect(fixture.nativeElement.textContent).toContain('Yearly Budget');
    expect(fixture.nativeElement.textContent).toContain('Monthly split');
  });

  it('applies quick budget presets from the current annual budget', () => {
    const currentAnnual = component.annualBudgetDraft();

    component.setBudgetPreset(1.1);
    fixture.detectChanges();

    expect(component.annualBudgetDraft()).toBe(Math.round(currentAnnual * 1.1));
  });
});
