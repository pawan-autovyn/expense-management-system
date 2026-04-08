import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

const ICON_PATHS: Record<string, string[]> = {
  dashboard: ['M3 13h8V3H3v10Zm0 8h8v-6H3v6Zm10 0h8V11h-8v10Zm0-18v6h8V3h-8Z'],
  receipt: [
    'M7 3h10l4 4v14l-2-1.2L17 21l-2-1.2L13 21l-2-1.2L9 21l-2-1.2L5 21V5a2 2 0 0 1 2-2Z',
    'M9 9h6',
    'M9 13h8',
    'M9 17h5',
  ],
  layers: ['M12 3 2 8l10 5 10-5-10-5Zm-10 9 10 5 10-5M2 16l10 5 10-5'],
  wallet: ['M3 7h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Zm0 0 2-3h11l2 3', 'M16 12h.01'],
  activity: ['M3 12h4l3-7 4 14 3-7h4'],
  users: ['M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2', 'M9.5 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z', 'M20 8v6', 'M23 11h-6'],
  alert: ['M12 9v4', 'M12 17h.01', 'M10.3 3.9 1.8 18.5a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z'],
  settings: ['M12 3v4', 'M12 17v4', 'M4.93 4.93l2.83 2.83', 'M16.24 16.24l2.83 2.83', 'M3 12h4', 'M17 12h4', 'M4.93 19.07l2.83-2.83', 'M16.24 7.76l2.83-2.83', 'M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z'],
  'plus-circle': ['M12 8v8', 'M8 12h8', 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z'],
  bell: ['M6 8a6 6 0 1 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9', 'M10 21a2 2 0 0 0 4 0'],
  'user-circle': ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z', 'M8 18a5 5 0 0 1 8 0', 'M12 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z'],
  search: ['m21 21-4.3-4.3', 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14Z'],
  mail: ['M4 6h16v12H4V6Z', 'm4 7 8 6 8-6'],
  lock: ['M7 11V8a5 5 0 0 1 10 0v3', 'M6 11h12v10H6V11Z', 'M12 15v2'],
  sun: ['M12 3v2', 'M12 19v2', 'M5.64 5.64l1.41 1.41', 'M16.95 16.95l1.41 1.41', 'M3 12h2', 'M19 12h2', 'M5.64 18.36l1.41-1.41', 'M16.95 7.05l1.41-1.41', 'M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z'],
  moon: ['M21 12.8A9 9 0 1 1 11.2 3a7 7 0 1 0 9.8 9.8Z'],
  logout: ['M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4', 'M16 17l5-5-5-5', 'M21 12H9'],
  menu: ['M4 7h16', 'M4 12h16', 'M4 17h16'],
  'chevron-right': ['m9 18 6-6-6-6'],
  'chevron-left': ['m15 18-6-6 6-6'],
  filter: ['M4 6h16', 'M7 12h10', 'M10 18h4'],
  eye: ['M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z', 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z'],
  trash: ['M3 6h18', 'M8 6V4h8v2', 'M6 6l1 14h10l1-14', 'M10 10v6', 'M14 10v6'],
  pencil: ['M4 20l4.5-1 9.6-9.6a2.1 2.1 0 0 0-3-3L5.5 16 4 20Z'],
  upload: ['M12 17V7', 'm7 12 5-5 5 5', 'M5 21h14'],
  x: ['M6 6l12 12', 'M18 6 6 18'],
  'check-circle': ['M9 12l2 2 4-4', 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z'],
  clock: ['M12 6v6l4 2', 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z'],
  'arrow-up-right': ['M7 17 17 7', 'M7 7h10v10'],
  download: ['M12 3v10', 'm8-4-8 8-8-8', 'M4 21h16'],
};

@Component({
  selector: 'app-icon',
  standalone: true,
  template: `
    <svg
      [attr.width]="size()"
      [attr.height]="size()"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-linecap="round"
      stroke-linejoin="round"
      [attr.stroke-width]="strokeWidth()"
      aria-hidden="true"
    >
      @for (path of paths(); track path) {
        <path [attr.d]="path" />
      }
    </svg>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IconComponent {
  readonly name = input('dashboard');
  readonly size = input(18);
  readonly strokeWidth = input(1.8);
  protected readonly paths = computed(() => ICON_PATHS[this.name()] ?? ICON_PATHS['dashboard']);
}
