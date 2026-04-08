import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';
import { DirectoryService } from '../../core/services/directory.service';
import { Role } from '../../models/app.models';
import { AppShellComponent } from './app-shell.component';

describe('AppShellComponent', () => {
  let fixture: ComponentFixture<AppShellComponent>;
  let component: AppShellComponent;
  let authService: AuthService;

  beforeEach(async () => {
    localStorage.clear();
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      value: 1280,
    });

    await TestBed.configureTestingModule({
      imports: [AppShellComponent],
      providers: [provideRouter([]), AuthService, DirectoryService],
    }).compileComponents();

    authService = TestBed.inject(AuthService);
    authService.loginAs(Role.Admin);
    fixture = TestBed.createComponent(AppShellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders the role-aware floating action and toggles the sidebar state', () => {
    const content = fixture.nativeElement as HTMLElement;

    expect(content.textContent).toContain('Review queue');
    expect(content.querySelector('.floating-action')?.getAttribute('aria-label')).toBe(
      'Review queue',
    );
    expect(
      content.querySelector('.app-shell')?.classList.contains('app-shell--sidebar-open'),
    ).toBeTrue();

    (component as unknown as { toggleSidebar: () => void }).toggleSidebar();
    fixture.detectChanges();

    expect(
      content.querySelector('.app-shell')?.classList.contains('app-shell--sidebar-open'),
    ).toBeFalse();

    authService.loginAs(Role.OperationManager);
    fixture.detectChanges();

    expect(content.textContent).toContain('Quick add expense');
    expect(content.querySelector('.floating-action')?.getAttribute('aria-label')).toBe(
      'Quick add expense',
    );
  });
});
