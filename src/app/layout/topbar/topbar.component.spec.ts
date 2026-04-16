import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';
import { DirectoryService } from '../../core/services/directory.service';
import { Role } from '../../models/app.models';
import { TopbarComponent } from './topbar.component';

@Component({
  standalone: true,
  template: '',
})
class EmptyRouteComponent {}

describe('TopbarComponent', () => {
  let fixture: ComponentFixture<TopbarComponent>;
  let authService: AuthService;
  let router: Router;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [TopbarComponent],
      providers: [
        provideRouter([
          { path: 'admin/dashboard', component: EmptyRouteComponent },
          { path: 'admin/profile', component: EmptyRouteComponent },
        ]),
        AuthService,
        DirectoryService,
      ],
    }).compileComponents();

    authService = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
    authService.loginAs(Role.Admin);
    await router.navigateByUrl('/admin/dashboard');
    fixture = TestBed.createComponent(TopbarComponent);
    fixture.detectChanges();
  });

  it('shows the current page context and handles logout', () => {
    const profileButton = fixture.nativeElement.querySelector('.topbar__profile') as HTMLElement;
    const logoutButton = fixture.nativeElement.querySelector('.topbar__logout') as HTMLElement;
    const content = fixture.nativeElement as HTMLElement;
    const navigateSpy = spyOn(router, 'navigateByUrl').and.returnValue(Promise.resolve(true) as never);

    expect(content.textContent).toContain('Workspace');
    expect(content.textContent).toContain('Admin');
    expect(content.textContent).not.toContain('Guest');

    profileButton?.click();
    expect(navigateSpy).toHaveBeenCalledWith('/admin/profile');

    spyOn(authService, 'signOut').and.callThrough();
    logoutButton?.click();
    fixture.detectChanges();

    expect(authService.signOut).toHaveBeenCalled();
    expect(navigateSpy).toHaveBeenCalledWith('/login');
  });
});
