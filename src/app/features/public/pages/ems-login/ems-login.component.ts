import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

import { IconComponent } from '../../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-ems-login',
  standalone: true,
  imports: [IconComponent],
  templateUrl: './ems-login.component.html',
  styleUrl: './ems-login.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmsLoginComponent {
  protected readonly email = signal('');

  protected updateEmail(value: string): void {
    this.email.set(value);
  }

  protected submit(): void {
    // Placeholder for the enterprise app login handoff.
  }
}
