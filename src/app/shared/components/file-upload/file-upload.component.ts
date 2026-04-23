import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';

import { Attachment } from '../../../models/app.models';
import { UploadApiService } from '../../../core/services/upload-api.service';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-file-upload',
  standalone: true,
  imports: [IconComponent],
  templateUrl: './file-upload.component.html',
  styleUrl: './file-upload.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FileUploadComponent {
  private readonly uploadApi = inject(UploadApiService);

  readonly existingAttachment = input<Attachment | undefined>(undefined);
  readonly attachmentChange = output<Attachment>();
  protected readonly isUploading = signal(false);

  protected async onFileSelected(event: Event): Promise<void> {
    const inputElement = event.target as HTMLInputElement;
    const file = inputElement.files?.[0];

    if (!file) {
      return;
    }

    this.isUploading.set(true);

    try {
      const attachment = await this.uploadApi.uploadReceipt(file);
      this.attachmentChange.emit(attachment);
    } finally {
      this.isUploading.set(false);
      inputElement.value = '';
    }
  }
}
