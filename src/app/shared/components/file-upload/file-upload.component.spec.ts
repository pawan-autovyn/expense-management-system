import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Attachment } from '../../../models/app.models';
import { FileUploadComponent } from './file-upload.component';

class MockFileReader {
  onload: ((event: ProgressEvent<FileReader>) => void) | null = null;
  result: string | ArrayBuffer | null = 'data:image/png;base64,MOCK';

  readAsDataURL(): void {
    this.onload?.({
      target: {
        result: this.result,
      },
    } as unknown as ProgressEvent<FileReader>);
  }
}

describe('FileUploadComponent', () => {
  let fixture: ComponentFixture<FileUploadComponent>;
  let component: FileUploadComponent;
  let originalFileReader: typeof FileReader;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FileUploadComponent],
    }).compileComponents();

    originalFileReader = window.FileReader;
    fixture = TestBed.createComponent(FileUploadComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    window.FileReader = originalFileReader;
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

  it('emits an attachment when the user selects a file', () => {
    const emitSpy = spyOn(component.attachmentChange, 'emit');
    const file = new File(['bill'], 'receipt.png', { type: 'image/png' });

    window.FileReader = MockFileReader as unknown as typeof FileReader;

    (component as unknown as { onFileSelected: (event: Event) => void }).onFileSelected({
      target: { files: [file] },
    } as unknown as Event);

    expect(emitSpy).toHaveBeenCalledWith(
      jasmine.objectContaining({
        name: 'receipt.png',
        mimeType: 'image/png',
        url: 'data:image/png;base64,MOCK',
      }),
    );
  });
});
