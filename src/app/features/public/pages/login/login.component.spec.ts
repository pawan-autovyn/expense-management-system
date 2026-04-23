import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { AuthService } from '../../../../core/services/auth.service';
import { DirectoryService } from '../../../../core/services/directory.service';
import { Role } from '../../../../models/app.models';
import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let authService: AuthService;
  let router: Router;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [provideRouter([]), AuthService, DirectoryService],
    }).compileComponents();

    authService = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(LoginComponent);
    fixture.detectChanges();
  });

  it('starts with empty login fields', () => {
    const userIdInput = fixture.nativeElement.querySelector('input[name="userId"]') as HTMLInputElement;
    const passwordInput = fixture.nativeElement.querySelector('input[name="password"]') as HTMLInputElement;

    expect(userIdInput.value).toBe('');
    expect(passwordInput.value).toBe('');
  });

  it('routes an operation manager user ID to the operation manager dashboard', async () => {
    spyOn(authService, 'loginWithCredentials').and.returnValue(
      Promise.resolve(authService.loginAs(Role.OperationManager)),
    );
    spyOn(router, 'navigateByUrl').and.returnValue(Promise.resolve(true) as never);

    const userIdInput = fixture.nativeElement.querySelector('input[name="userId"]') as HTMLInputElement;
    userIdInput.value = 'operations.manager.ems@gmail.com';
    userIdInput.dispatchEvent(new Event('input'));
    const passwordInput = fixture.nativeElement.querySelector('input[name="password"]') as HTMLInputElement;
    passwordInput.value = 'SecurePass123!';
    passwordInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    fixture.nativeElement.querySelector('.login-submit')?.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(authService.loginWithCredentials).toHaveBeenCalledWith(
      'operations.manager.ems@gmail.com',
      'SecurePass123!',
    );
    expect(router.navigateByUrl).toHaveBeenCalledWith('/operation-manager/dashboard');
  });

  it('routes the recommender user ID to the recommender dashboard', async () => {
    spyOn(authService, 'loginWithCredentials').and.returnValue(
      Promise.resolve(authService.loginAs(Role.Recommender)),
    );
    spyOn(router, 'navigateByUrl').and.returnValue(Promise.resolve(true) as never);

    const userIdInput = fixture.nativeElement.querySelector('input[name="userId"]') as HTMLInputElement;
    userIdInput.value = 'recommender.ems@gmail.com';
    userIdInput.dispatchEvent(new Event('input'));
    const passwordInput = fixture.nativeElement.querySelector('input[name="password"]') as HTMLInputElement;
    passwordInput.value = 'SecurePass123!';
    passwordInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    fixture.nativeElement.querySelector('.login-submit')?.click();
    await fixture.whenStable();

    expect(authService.loginWithCredentials).toHaveBeenCalledWith(
      'recommender.ems@gmail.com',
      'SecurePass123!',
    );
    expect(router.navigateByUrl).toHaveBeenCalledWith('/recommender/dashboard');
  });

  it('routes the admin user ID to the admin dashboard', async () => {
    spyOn(authService, 'loginWithCredentials').and.returnValue(
      Promise.resolve(authService.loginAs(Role.Admin)),
    );
    spyOn(router, 'navigateByUrl').and.returnValue(Promise.resolve(true) as never);

    const userIdInput = fixture.nativeElement.querySelector('input[name="userId"]') as HTMLInputElement;
    userIdInput.value = 'admin.ems@gmail.com';
    userIdInput.dispatchEvent(new Event('input'));
    const passwordInput = fixture.nativeElement.querySelector('input[name="password"]') as HTMLInputElement;
    passwordInput.value = 'SecurePass123!';
    passwordInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    fixture.nativeElement.querySelector('.login-submit')?.click();
    await fixture.whenStable();

    expect(authService.loginWithCredentials).toHaveBeenCalledWith(
      'admin.ems@gmail.com',
      'SecurePass123!',
    );
    expect(router.navigateByUrl).toHaveBeenCalledWith('/admin/dashboard');
  });

});
