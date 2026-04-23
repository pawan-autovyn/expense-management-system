import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { DirectoryService } from '../../../../core/services/directory.service';
import { AdminCategoriesComponent } from './admin-categories.component';

describe('AdminCategoriesComponent', () => {
  let fixture: ComponentFixture<AdminCategoriesComponent>;
  let directoryService: DirectoryService;
  let component: AdminCategoriesComponent & {
    newCategory: {
      name: string;
      description: string;
      monthlyBudget: number;
      accent: string;
      icon: string;
    };
    categorySearchTerm: { set(value: string): void };
    filteredCategories: () => { category: { id: string; name: string; description: string } }[];
    addCategory(): Promise<void>;
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminCategoriesComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    directoryService = TestBed.inject(DirectoryService);
    fixture = TestBed.createComponent(AdminCategoriesComponent);
    component = fixture.componentInstance as typeof component;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('adds a new category into the shared directory store', async () => {
    const before = directoryService.categories().length;

    component.newCategory = {
      name: 'Courier',
      description: 'Courier and dispatch expenses',
      monthlyBudget: 3500,
      accent: '#1d4ed8',
      icon: 'receipt',
    };
    await component.addCategory();
    fixture.detectChanges();

    expect(directoryService.categories().length).toBe(before + 1);
    expect(fixture.nativeElement.textContent).toContain(
      'Courier added to the live category library.',
    );
  });

  it('filters the visible category cards by search term', () => {
    const firstCategory = component.filteredCategories()[0];

    component.categorySearchTerm.set(firstCategory.category.name.slice(0, 4));
    fixture.detectChanges();

    expect(component.filteredCategories().length).toBeGreaterThan(0);
    expect(
      component.filteredCategories().every((entry) =>
        [entry.category.name, entry.category.description, entry.status].some((value) =>
          value.toLowerCase().includes(firstCategory.category.name.slice(0, 4).toLowerCase()),
        ),
      ),
    ).toBeTrue();
  });
});
