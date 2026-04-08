
import { Injectable, computed, inject, signal, DOCUMENT } from '@angular/core';

import { ThemeMode } from '../../models/app.models';
import { STORAGE_KEYS } from '../constants/app.constants';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly themeStore = signal<ThemeMode>(this.restoreTheme());

  readonly activeTheme = this.themeStore.asReadonly();
  readonly isDarkMode = computed(() => this.activeTheme() === ThemeMode.Dark);

  constructor() {
    this.applyTheme(this.activeTheme());
  }

  toggleTheme(): void {
    this.setTheme(this.isDarkMode() ? ThemeMode.Light : ThemeMode.Dark);
  }

  setTheme(theme: ThemeMode): void {
    this.themeStore.set(theme);
    this.applyTheme(theme);
    localStorage.setItem(STORAGE_KEYS.theme, theme);
  }

  private restoreTheme(): ThemeMode {
    const storedTheme = localStorage.getItem(STORAGE_KEYS.theme);

    return storedTheme === ThemeMode.Dark ? ThemeMode.Dark : ThemeMode.Light;
  }

  private applyTheme(theme: ThemeMode): void {
    this.document.documentElement.dataset['theme'] = theme;
  }
}
