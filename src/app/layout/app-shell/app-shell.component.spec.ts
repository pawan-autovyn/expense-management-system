import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';
import { DirectoryService } from '../../core/services/directory.service';
import { Role } from '../../models/app.models';
import { AppShellComponent } from './app-shell.component';

describe('AppShellComponent', () => {
  let fixture: ComponentFixture<AppShellComponent>;
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
    fixture.detectChanges();
  });

  it('renders the fixed shell and quick action', () => {
    const content = fixture.nativeElement as HTMLElement;

    expect(content.textContent).toContain('Open approvals');
    expect(content.querySelector('.floating-action')?.getAttribute('aria-label')).toBe(
      'Open approvals',
    );
    expect(content.querySelector('app-topbar')).not.toBeNull();
    expect(content.querySelector('app-breadcrumbs')).toBeNull();

    authService.loginAs(Role.OperationManager);
    fixture.detectChanges();

    expect(content.textContent).toContain('New expense');
    expect(content.querySelector('.floating-action')?.getAttribute('aria-label')).toBe(
      'New expense',
    );
  });
});
