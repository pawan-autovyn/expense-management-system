import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app-root.component.html',
  styleUrl: './app-root.component.scss',
})
export class AppRootComponent implements OnInit {
  private readonly router = inject(Router);

  ngOnInit(): void {
    const currentUrl = this.router.url.split('?')[0].split('#')[0];

    if (
      currentUrl === '/' ||
      currentUrl === '' ||
      currentUrl === '/ems/login' ||
      currentUrl.startsWith('/hub')
    ) {
      void this.router.navigateByUrl('/login', { replaceUrl: true });
    }
  }
}
