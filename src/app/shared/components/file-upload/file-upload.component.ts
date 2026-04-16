import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { Attachment } from '../../../models/app.models';
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
