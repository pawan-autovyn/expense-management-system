import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

import { Attachment } from '../../../models/app.models';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-receipt-preview-modal',
  standalone: true,
  imports: [IconComponent],
  host: {
    '[class.receipt-preview-modal--open]': 'attachment() !== null',
    '[attr.aria-hidden]': 'attachment() ? null : "true"',
  },
  templateUrl: './receipt-preview-modal.component.html',
  styleUrl: './receipt-preview-modal.component.scss',
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
