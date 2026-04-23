import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { ProfileApiService } from '../../../../core/services/profile-api.service';
import { ManagerProfileComponent } from './manager-profile.component';

describe('ManagerProfileComponent', () => {
  let fixture: ComponentFixture<ManagerProfileComponent>;
  let component: ManagerProfileComponent & {
    currentPassword: { set(value: string): void };
    newPassword: { set(value: string): void };
    confirmPassword: { set(value: string): void };
    passwordMessage: { (): string; set(value: string): void };
    requirePasswordReset: { (): boolean; set(value: boolean): void };
    signOutOtherDevices: { (): boolean; set(value: boolean): void };
    updatePassword(): void;
    applyStrongPreset(): void;
    clearSecurityForm(): void;
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManagerProfileComponent],
      providers: [
        provideRouter([]),
        {
          provide: ProfileApiService,
          useValue: {
            updatePassword: () => of({ message: 'Password updated successfully.' }),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ManagerProfileComponent);
    component = fixture.componentInstance as typeof component;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('shows password controls and accepts a secure update flow', async () => {
    component.currentPassword.set('OldPass123!');
    component.newPassword.set('NewPass123!');
    component.confirmPassword.set('NewPass123!');
    component.requirePasswordReset.set(true);
    component.signOutOtherDevices.set(true);

    await component.updatePassword();
    fixture.detectChanges();

    expect(component.passwordMessage()).toContain('Password updated successfully');
    expect(fixture.nativeElement.textContent).toContain('Password change options');
  });

  it('fills a strong password preset and clears the security form', () => {
    component.applyStrongPreset();
    expect(component.newPassword()).toBe('ExpenseFlow#2026');
    expect(component.confirmPassword()).toBe('ExpenseFlow#2026');

    component.clearSecurityForm();
    expect(component.newPassword()).toBe('');
    expect(component.confirmPassword()).toBe('');
    expect(component.requirePasswordReset()).toBeTrue();
    expect(component.signOutOtherDevices()).toBeTrue();
  });
});
