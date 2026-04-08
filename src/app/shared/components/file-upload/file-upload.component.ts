import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { Attachment } from '../../../models/app.models';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-file-upload',
  standalone: true,
  imports: [IconComponent],
  template: `
    <label class="upload-field">
      <input type="file" accept="image/*" (change)="onFileSelected($event)" />
      <span class="upload-field__content">
        <app-icon name="upload" [size]="18" />
        <strong>{{ existingAttachment()?.name ?? 'Upload bill or receipt' }}</strong>
        <small>PNG, JPG or SVG preview in mock mode</small>
      </span>
    </label>

    @if (existingAttachment()) {
      <div class="upload-preview">
        <img [src]="existingAttachment()!.url" [alt]="existingAttachment()!.name" />
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FileUploadComponent {
  readonly existingAttachment = input<Attachment | undefined>(undefined);
  readonly attachmentChange = output<Attachment>();

  protected onFileSelected(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    const file = inputElement.files?.[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      this.attachmentChange.emit({
        id: `att-${Date.now()}`,
        name: file.name,
        url: String(reader.result),
        mimeType: file.type,
      });
    };
    reader.readAsDataURL(file);
  }
}
