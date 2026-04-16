import { TestBed } from '@angular/core/testing';

import { ThemeMode } from '../../models/app.models';
import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  beforeEach(() => {
    document.documentElement.dataset['theme'] = '';
  });

  function createService(): ThemeService {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [ThemeService],
    });

    return TestBed.inject(ThemeService);
  }

  it('always applies the single light theme', () => {
    const service = createService();

    expect(service.activeTheme()).toBe(ThemeMode.Light);
    expect(document.documentElement.dataset['theme']).toBe(ThemeMode.Light);
  });

  it('keeps the light theme when setTheme is called', () => {
    const service = createService();

    service.setTheme();

    expect(service.activeTheme()).toBe(ThemeMode.Light);
    expect(document.documentElement.dataset['theme']).toBe(ThemeMode.Light);
  });
});
