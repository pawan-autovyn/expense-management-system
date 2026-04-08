import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

import { Attachment } from '../../../models/app.models';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-receipt-preview-modal',
  standalone: true,
  imports: [IconComponent],
  template: `
    @if (attachment()) {
      <div
        class="overlay-backdrop"
        tabindex="0"
        (click)="closeRequested.emit()"
        (keydown.enter)="closeRequested.emit()"
      ></div>
      <section
        class="overlay-panel overlay-panel--wide glass-card receipt-modal-shell"
        role="dialog"
        aria-modal="true"
        [attr.aria-label]="'Bill preview for ' + attachment()!.name"
      >
        <div class="overlay-panel__header receipt-modal-shell__header">
          <div>
            <p class="eyebrow">Bill Preview</p>
            <h3>{{ attachment()!.name }}</h3>
            <div class="receipt-modal-shell__meta">
              <span class="receipt-modal-chip">{{ fileType() }}</span>
              <span class="receipt-modal-chip receipt-modal-chip--soft">Preview only</span>
            </div>
          </div>
          <button
            type="button"
            class="icon-button icon-button--plain receipt-modal-shell__close"
            aria-label="Close bill preview"
            (click)="closeRequested.emit()"
          >
            <app-icon name="x" [size]="18" />
          </button>
        </div>
        <div class="receipt-modal-shell__frame">
          <div class="receipt-modal">
            <img [src]="attachment()!.url" [alt]="attachment()!.name" />
          </div>
        </div>
        <div class="receipt-modal-shell__footer">
          <p>Best viewed at 100% zoom for reading exact bill details.</p>
          <a
            class="button button--ghost receipt-modal-shell__action"
            [href]="attachment()!.url"
            target="_blank"
            rel="noopener noreferrer"
          >
            Open original
          </a>
        </div>
      </section>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReceiptPreviewModalComponent {
  readonly attachment = input<Attachment | null>(null);
  readonly closeRequested = output<void>();
  protected readonly fileType = computed(() => {
    const attachment = this.attachment();
    const mimeType = attachment?.mimeType ?? '';

    if (mimeType.includes('svg')) {
      return 'SVG document';
    }

    if (mimeType.includes('pdf')) {
      return 'PDF document';
    }

    if (mimeType.includes('png')) {
      return 'PNG image';
    }

    if (mimeType.includes('jpeg') || mimeType.includes('jpg')) {
      return 'JPEG image';
    }

    return 'Receipt file';
  });
}
