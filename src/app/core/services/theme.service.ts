
import { DOCUMENT, Injectable, inject, signal } from '@angular/core';

import { ThemeMode } from '../../models/app.models';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly themeStore = signal<ThemeMode>(ThemeMode.Light);

  readonly activeTheme = this.themeStore.asReadonly();

  constructor() {
    this.applyTheme();
  }

  setTheme(): void {
    this.themeStore.set(ThemeMode.Light);
    this.applyTheme();
  }

  private applyTheme(): void {
    this.document.documentElement.dataset['theme'] = ThemeMode.Light;
  }
}
