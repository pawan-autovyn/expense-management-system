import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { AuthService } from '../../../../core/services/auth.service';
import { DirectoryService } from '../../../../core/services/directory.service';
import { ThemeService } from '../../../../core/services/theme.service';
import { Role } from '../../../../models/app.models';
import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let authService: AuthService;
  let themeService: ThemeService;
  let router: Router;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [provideRouter([]), AuthService, DirectoryService],
    }).compileComponents();

    authService = TestBed.inject(AuthService);
    themeService = TestBed.inject(ThemeService);
    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(LoginComponent);
    fixture.detectChanges();
  });

  it('shows the default admin email in the login form', () => {
    const emailInput = fixture.nativeElement.querySelector('input[name="email"]') as HTMLInputElement;

    expect(emailInput.value).toBe('vikas.yadav@autovyn.in');
  });

  it('routes manager demo email to the manager dashboard', () => {
    spyOn(authService, 'loginAs').and.callThrough();
    spyOn(router, 'navigateByUrl').and.returnValue(Promise.resolve(true) as never);

    const emailInput = fixture.nativeElement.querySelector('input[name="email"]') as HTMLInputElement;
    emailInput.value = 'pankaj.jhakar@autovyn.in';
    emailInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    fixture.nativeElement.querySelector('.login-submit')?.click();

    expect(authService.loginAs).toHaveBeenCalledWith(Role.OperationManager);
    expect(router.navigateByUrl).toHaveBeenCalledWith('/manager/dashboard');
  });

  it('routes the admin demo email to the admin dashboard', () => {
    spyOn(authService, 'loginAs').and.callThrough();
    spyOn(router, 'navigateByUrl').and.returnValue(Promise.resolve(true) as never);

    const emailInput = fixture.nativeElement.querySelector('input[name="email"]') as HTMLInputElement;
    emailInput.value = 'vikas.yadav@autovyn.in';
    emailInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    fixture.nativeElement.querySelector('.login-submit')?.click();

    expect(authService.loginAs).toHaveBeenCalledWith(Role.Admin);
    expect(router.navigateByUrl).toHaveBeenCalledWith('/admin/dashboard');
  });

  it('shows a theme toggle and switches the active theme when clicked', () => {
    const toggleButton = fixture.nativeElement.querySelector('.login-theme-toggle') as HTMLButtonElement;

    expect(toggleButton).toBeTruthy();
    expect(toggleButton.getAttribute('aria-label')).toContain('dark theme');

    toggleButton.click();
    fixture.detectChanges();

    expect(themeService.isDarkMode()).toBeTrue();
    expect(document.documentElement.dataset['theme']).toBe('dark');
  });
});
