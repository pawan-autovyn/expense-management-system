import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter, map, startWith } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';

import { IconComponent } from '../../shared/components/icon/icon.component';

interface Breadcrumb {
  label: string;
  route: string;
}

@Component({
  selector: 'app-breadcrumbs',
  standalone: true,
  imports: [RouterLink, IconComponent],
  templateUrl: './breadcrumbs.component.html',
  styleUrl: './breadcrumbs.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BreadcrumbsComponent {
  private readonly router = inject(Router);

  protected readonly breadcrumbs = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      startWith(null),
      map(() => this.createBreadcrumbs(this.router.url)),
    ),
    { initialValue: this.createBreadcrumbs(this.router.url) },
  );

  private createBreadcrumbs(url: string): Breadcrumb[] {
    const cleanUrl = url.split('?')[0];
    const segments = cleanUrl.split('/').filter(Boolean);

    if (!segments.length) {
      return [{ label: 'Home', route: '/' }];
    }

    return segments.map((segment, index) => ({
      label: segment
        .replace(/-/g, ' ')
        .replace(/\b\w/g, (letter) => letter.toUpperCase()),
      route: `/${segments.slice(0, index + 1).join('/')}`,
    }));
  }
}
