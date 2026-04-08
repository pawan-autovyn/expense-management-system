import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';
import { DirectoryService } from '../../core/services/directory.service';
import { Role } from '../../models/app.models';
import { SidebarComponent } from './sidebar.component';

describe('SidebarComponent', () => {
  let fixture: ComponentFixture<SidebarComponent>;
  let authService: AuthService;
  let router: Router;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [SidebarComponent],
      providers: [provideRouter([]), AuthService, DirectoryService],
    }).compileComponents();

    authService = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(SidebarComponent);
  });

  it('filters admin navigation and logs out', () => {
    authService.loginAs(Role.Admin);
    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.sidebar').className).toContain('sidebar--open');
    expect(fixture.nativeElement.textContent).toContain('Audit Trail');
    expect(fixture.nativeElement.textContent).toContain('Template Report');
    expect(fixture.nativeElement.textContent).not.toContain('Add Expense');

    spyOn(authService, 'signOut').and.callThrough();
    spyOn(router, 'navigateByUrl').and.returnValue(Promise.resolve(true) as never);

    fixture.nativeElement.querySelector('.sidebar__logout')?.click();

    expect(authService.signOut).toHaveBeenCalled();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/login');
  });

  it('filters manager navigation and emits close requests when links are clicked', () => {
    const closed: number[] = [];

    authService.loginAs(Role.OperationManager);
    fixture.componentRef.setInput('open', true);
    fixture.componentInstance.closeRequested.subscribe(() => closed.push(1));
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Add Expense');
    expect(fixture.nativeElement.textContent).toContain('Budget Overview');

    fixture.nativeElement.querySelector('.sidebar__link')?.click();

    expect(closed).toEqual([1]);
  });

  it('emits a toggle request from the centered rail control', () => {
    const toggled: number[] = [];

    authService.loginAs(Role.Admin);
    fixture.componentRef.setInput('open', true);
    fixture.componentInstance.toggleRequested.subscribe(() => toggled.push(1));
    fixture.detectChanges();

    fixture.nativeElement.querySelector('.sidebar__rail-toggle')?.click();

    expect(toggled).toEqual([1]);
  });

  it('renders no navigation items when the user is signed out', () => {
    authService.signOut();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('.sidebar__link').length).toBe(0);
  });
});
