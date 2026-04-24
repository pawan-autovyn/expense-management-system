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
          { path: 'admin/expenses', component: EmptyRouteComponent },
          { path: 'admin/notifications', component: EmptyRouteComponent },
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
    const content = fixture.nativeElement as HTMLElement;
    const navigateSpy = spyOn(router, 'navigateByUrl').and.returnValue(Promise.resolve(true) as never);

    expect(content.textContent).toContain('Workspace');
    expect(content.textContent).toContain('Admin');
    expect(content.textContent).not.toContain('Guest');

    profileButton?.click();
    expect(navigateSpy).toHaveBeenCalledWith('/admin/profile');
  });

  it('opens a notification target route from the bell panel', async () => {
    const navigateSpy = spyOn(router, 'navigateByUrl').and.returnValue(Promise.resolve(true) as never);
    const component = fixture.componentInstance as TopbarComponent & {
      notifications: () => Array<{ id: string }>;
      openNotification: (notification: { id: string }) => Promise<void>;
    };
    const notification = component.notifications()[0];

    expect(notification).toBeTruthy();

    await component.openNotification(notification);

    expect(navigateSpy).toHaveBeenCalledWith('/admin/approval');
  });
});
