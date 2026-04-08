import { TestBed } from '@angular/core/testing';

import { ThemeMode } from '../../models/app.models';
import { STORAGE_KEYS } from '../constants/app.constants';
import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.dataset['theme'] = '';
  });

  function createService(): ThemeService {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [ThemeService],
    });

    return TestBed.inject(ThemeService);
  }

  it('defaults to light theme and toggles to dark', () => {
    const service = createService();

    expect(service.activeTheme()).toBe(ThemeMode.Light);
    expect(service.isDarkMode()).toBeFalse();
    expect(document.documentElement.dataset['theme']).toBe(ThemeMode.Light);

    service.toggleTheme();

    expect(service.activeTheme()).toBe(ThemeMode.Dark);
    expect(service.isDarkMode()).toBeTrue();
    expect(localStorage.getItem(STORAGE_KEYS.theme)).toBe(ThemeMode.Dark);
  });

  it('restores the saved dark theme and persists manual changes', () => {
    localStorage.setItem(STORAGE_KEYS.theme, ThemeMode.Dark);

    const service = createService();

    expect(service.activeTheme()).toBe(ThemeMode.Dark);
    expect(document.documentElement.dataset['theme']).toBe(ThemeMode.Dark);

    service.toggleTheme();

    expect(service.activeTheme()).toBe(ThemeMode.Light);
    expect(localStorage.getItem(STORAGE_KEYS.theme)).toBe(ThemeMode.Light);
  });
});
