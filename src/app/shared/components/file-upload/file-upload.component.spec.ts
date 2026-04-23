import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Attachment } from '../../../models/app.models';
import { UploadApiService } from '../../../core/services/upload-api.service';
import { FileUploadComponent } from './file-upload.component';

describe('FileUploadComponent', () => {
  let fixture: ComponentFixture<FileUploadComponent>;
  let component: FileUploadComponent;
  let uploadApi: jasmine.SpyObj<UploadApiService>;

  beforeEach(async () => {
    uploadApi = jasmine.createSpyObj<UploadApiService>('UploadApiService', ['uploadReceipt']);

    await TestBed.configureTestingModule({
      imports: [FileUploadComponent],
      providers: [{ provide: UploadApiService, useValue: uploadApi }],
    }).compileComponents();

    fixture = TestBed.createComponent(FileUploadComponent);
    component = fixture.componentInstance;
  });

  it('renders the preview when an attachment already exists', () => {
    const attachment: Attachment = {
      id: 'att-1',
      name: 'receipt.svg',
      url: '/assets/receipts/receipt.svg',
      mimeType: 'image/svg+xml',
    };

    fixture.componentRef.setInput('existingAttachment', attachment);
    fixture.detectChanges();

    const image = fixture.nativeElement.querySelector('img');

    expect(image).not.toBeNull();
    expect(image.getAttribute('alt')).toBe('receipt.svg');
    expect(image.getAttribute('src')).toContain('/assets/receipts/receipt.svg');
  });

  it('ignores file inputs that do not contain a file', () => {
    const emitSpy = spyOn(component.attachmentChange, 'emit');

    (component as unknown as { onFileSelected: (event: Event) => void }).onFileSelected({
      target: { files: [] },
    } as unknown as Event);

    expect(emitSpy).not.toHaveBeenCalled();
  });

  it('emits an attachment when the user selects a file', async () => {
    const emitSpy = spyOn(component.attachmentChange, 'emit');
    const file = new File(['bill'], 'receipt.png', { type: 'image/png' });
    uploadApi.uploadReceipt.and.resolveTo({
      id: 'att-async',
      name: 'receipt.png',
      url: 'https://example.com/receipt.png',
      mimeType: 'image/png',
    });

    await (component as unknown as { onFileSelected: (event: Event) => Promise<void> }).onFileSelected({
      target: { files: [file] },
    } as unknown as Event);

    expect(emitSpy).toHaveBeenCalledWith(
      jasmine.objectContaining({
        name: 'receipt.png',
        mimeType: 'image/png',
        url: 'https://example.com/receipt.png',
      }),
    );
  });
});
