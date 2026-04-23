import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';
import { DirectoryService } from '../../core/services/directory.service';
import { NotificationService } from '../../core/services/notification.service';
import { Role } from '../../models/app.models';
import { SidebarComponent } from './sidebar.component';

describe('SidebarComponent', () => {
  let fixture: ComponentFixture<SidebarComponent>;
  let authService: AuthService;
  let notificationService: NotificationService;
  let router: Router;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [SidebarComponent],
      providers: [provideRouter([]), AuthService, DirectoryService],
    }).compileComponents();

    authService = TestBed.inject(AuthService);
    notificationService = TestBed.inject(NotificationService);
    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(SidebarComponent);
  });

  it('shows operation manager navigation only for the operation manager role', () => {
    authService.loginAs(Role.OperationManager);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Dashboard');
    expect(fixture.nativeElement.textContent).toContain('Add Expense');
    expect(fixture.nativeElement.textContent).toContain('My Expenses');
    expect(fixture.nativeElement.textContent).toContain('Budget Overview');
    expect(fixture.nativeElement.textContent).toContain('Notifications');
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
    expect(fixture.nativeElement.textContent).toContain('Notifications');
    expect(fixture.nativeElement.textContent).toContain('Category Management');
    expect(fixture.nativeElement.textContent).toContain('Reports');
    expect(fixture.nativeElement.textContent).toContain('Audit Trail');
    expect(fixture.nativeElement.textContent).not.toContain('Add Expense');
  });

  it('shows the unread notification badge beside the notification link', () => {
    authService.loginAs(Role.OperationManager);
    notificationService.createNotification({
      title: 'Budget updated by admin',
      message: 'Admin updated pantry budget.',
      tone: 'success',
      audience: Role.OperationManager,
      date: '2026-04-23T12:00:00+05:30',
    });
    fixture.detectChanges();

    const notificationLink = Array.from(
      fixture.nativeElement.querySelectorAll('.sidebar__link'),
    ).find((link) => (link as HTMLElement).textContent?.includes('Notifications')) as
      | HTMLElement
      | undefined;

    expect(notificationLink?.querySelector('.sidebar__badge')?.textContent?.trim()).toBe(
      String(notificationService.getUnreadCountForRole(Role.OperationManager)),
    );
  });

  it('renders no navigation items when the user is signed out', () => {
    authService.signOut();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('.sidebar__link').length).toBe(0);
  });

  it('renders a bottom logout action and signs the user out', () => {
    authService.loginAs(Role.OperationManager);
    fixture.detectChanges();

    const navigateSpy = spyOn(router, 'navigateByUrl').and.returnValue(Promise.resolve(true) as never);
    const logoutButton = fixture.nativeElement.querySelector('.sidebar__logout') as HTMLButtonElement;

    expect(logoutButton).not.toBeNull();

    spyOn(authService, 'signOut').and.callThrough();
    logoutButton.click();

    expect(authService.signOut).toHaveBeenCalled();
    expect(navigateSpy).toHaveBeenCalledWith('/login');
  });
});
