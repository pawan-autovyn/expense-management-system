import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { ManagerBudgetsComponent } from './manager-budgets.component';

describe('ManagerBudgetsComponent', () => {
  let fixture: ComponentFixture<ManagerBudgetsComponent>;
  let component: ManagerBudgetsComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManagerBudgetsComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(ManagerBudgetsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('filters budgets by search text and shows an empty state when nothing matches', () => {
    const state = component as unknown as {
      visibleCategoryViews: () => Array<{ category: { name: string } }>;
      searchTerm: { set(value: string): void };
    };
    const allRows = state.visibleCategoryViews();
    const keyword = allRows[0]?.category.name.slice(0, 3) ?? '';

    state.searchTerm.set(keyword);
    fixture.detectChanges();

    expect(state.visibleCategoryViews().length).toBeGreaterThan(0);
    expect(state.visibleCategoryViews().length).toBeLessThanOrEqual(allRows.length);

    state.searchTerm.set('no-budget-should-match-this');
    fixture.detectChanges();

    expect(state.visibleCategoryViews().length).toBe(0);
    expect(fixture.nativeElement.textContent).toContain('No budgets found');
  });
});
