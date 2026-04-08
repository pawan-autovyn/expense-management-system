import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app-root.component.html',
  styleUrl: './app-root.component.scss',
})
export class AppRootComponent {}
