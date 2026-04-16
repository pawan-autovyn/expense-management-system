import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';
import { DirectoryService } from '../../core/services/directory.service';
import { Role } from '../../models/app.models';
import { SidebarComponent } from './sidebar.component';

describe('SidebarComponent', () => {
  let fixture: ComponentFixture<SidebarComponent>;
  let authService: AuthService;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [SidebarComponent],
      providers: [provideRouter([]), AuthService, DirectoryService],
    }).compileComponents();

    authService = TestBed.inject(AuthService);
    fixture = TestBed.createComponent(SidebarComponent);
  });

  it('shows operation manager navigation only for the operation manager role', () => {
    authService.loginAs(Role.OperationManager);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Dashboard');
    expect(fixture.nativeElement.textContent).toContain('Add Expense');
    expect(fixture.nativeElement.textContent).toContain('My Expenses');
    expect(fixture.nativeElement.textContent).toContain('Budget Overview');
    expect(fixture.nativeElement.textContent).not.toContain('Approval Queue');
    expect(fixture.nativeElement.textContent).not.toContain('Audit Trail');
  });

  it('shows recommender navigation only for the recommender role', () => {
    authService.loginAs(Role.Recommender);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Recommendation Queue');
    expect(fixture.nativeElement.textContent).toContain('Expense Review');
    expect(fixture.nativeElement.textContent).toContain('Reports');
    expect(fixture.nativeElement.textContent).toContain('Budget Overview');
    expect(fixture.nativeElement.textContent).not.toContain('Approval Queue');
    expect(fixture.nativeElement.textContent).not.toContain('Audit Trail');
  });

  it('shows admin navigation only for the admin role', () => {
    authService.loginAs(Role.Admin);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Approval Queue');
    expect(fixture.nativeElement.textContent).toContain('View Expenses');
    expect(fixture.nativeElement.textContent).toContain('Budget Management');
    expect(fixture.nativeElement.textContent).toContain('Category Management');
    expect(fixture.nativeElement.textContent).toContain('Reports');
    expect(fixture.nativeElement.textContent).toContain('Audit Trail');
    expect(fixture.nativeElement.textContent).not.toContain('Add Expense');
  });

  it('renders no navigation items when the user is signed out', () => {
    authService.signOut();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('.sidebar__link').length).toBe(0);
  });
});
