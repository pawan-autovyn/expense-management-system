import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  host: {
    '[class.confirm-dialog--open]': 'open()',
    '[attr.aria-hidden]': 'open() ? null : "true"',
  },
  templateUrl: './confirm-dialog.component.html',
  styleUrl: './confirm-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmDialogComponent {
  readonly open = input(false);
  readonly title = input('Confirm action');
  readonly message = input.required<string>();
  readonly confirmed = output<void>();
  readonly cancelled = output<void>();
}
