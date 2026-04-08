import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { DirectoryService } from '../../core/services/directory.service';
import { NotificationService } from '../../core/services/notification.service';
import { ThemeService } from '../../core/services/theme.service';
import { Role } from '../../models/app.models';
import { TopbarComponent } from './topbar.component';
import { AuthService } from '../../core/services/auth.service';

describe('TopbarComponent', () => {
  let fixture: ComponentFixture<TopbarComponent>;
  let authService: AuthService;
  let router: Router;
  let themeService: ThemeService;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [TopbarComponent],
      providers: [provideRouter([]), AuthService, DirectoryService, NotificationService, ThemeService],
    }).compileComponents();

    fixture = TestBed.createComponent(TopbarComponent);
    authService = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
    themeService = TestBed.inject(ThemeService);
    fixture.detectChanges();
  });

  it('emits menu toggle, switches roles, and toggles theme', () => {
    const menuToggles: number[] = [];
    fixture.componentInstance.menuToggle.subscribe(() => menuToggles.push(1));
    spyOn(authService, 'switchRole').and.callThrough();
    spyOn(router, 'navigateByUrl').and.returnValue(Promise.resolve(true) as never);

    fixture.nativeElement.querySelector('.topbar__menu')?.click();
    fixture.nativeElement.querySelectorAll('.chip-button')[0]?.click();
    fixture.nativeElement.querySelectorAll('.chip-button')[1]?.click();
    fixture.nativeElement.querySelectorAll('.topbar__utility')[0]?.click();
    fixture.detectChanges();

    expect(menuToggles).toEqual([1]);
    expect(authService.switchRole).toHaveBeenCalledWith(Role.Admin);
    expect(authService.switchRole).toHaveBeenCalledWith(Role.OperationManager);
    expect(router.navigateByUrl).toHaveBeenCalledTimes(2);
    expect(themeService.isDarkMode()).toBeTrue();
    expect(document.documentElement.dataset['theme']).toBe('dark');
    expect(fixture.nativeElement.querySelector('.topbar__notification-badge')).not.toBeNull();
  });
});
