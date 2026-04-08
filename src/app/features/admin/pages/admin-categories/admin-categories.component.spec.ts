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
    addCategory(): void;
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

  it('adds a new category into the shared directory store', () => {
    const before = directoryService.categories().length;

    component.newCategory = {
      name: 'Courier',
      description: 'Courier and dispatch expenses',
      monthlyBudget: 3500,
      accent: '#1d4ed8',
      icon: 'receipt',
    };
    component.addCategory();
    fixture.detectChanges();

    expect(directoryService.categories().length).toBe(before + 1);
    expect(fixture.nativeElement.textContent).toContain('Courier added to the category library.');
  });
});
