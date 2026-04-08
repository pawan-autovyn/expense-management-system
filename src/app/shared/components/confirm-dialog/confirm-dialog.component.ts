import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  template: `
    @if (open()) {
      <div
        class="overlay-backdrop"
        tabindex="0"
        (click)="cancelled.emit()"
        (keydown.enter)="cancelled.emit()"
      ></div>
      <section class="overlay-panel glass-card" role="dialog" aria-modal="true">
        <p class="eyebrow">{{ title() }}</p>
        <h3>{{ message() }}</h3>
        <div class="overlay-panel__actions">
          <button type="button" class="button button--ghost" (click)="cancelled.emit()">Cancel</button>
          <button type="button" class="button button--danger" (click)="confirmed.emit()">Confirm</button>
        </div>
      </section>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmDialogComponent {
  readonly open = input(false);
  readonly title = input('Confirm action');
  readonly message = input.required<string>();
  readonly confirmed = output<void>();
  readonly cancelled = output<void>();
}
