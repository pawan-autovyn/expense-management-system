import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReceiptPreviewModalComponent } from './receipt-preview-modal.component';

describe('ReceiptPreviewModalComponent', () => {
  let fixture: ComponentFixture<ReceiptPreviewModalComponent>;
  let component: ReceiptPreviewModalComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReceiptPreviewModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ReceiptPreviewModalComponent);
    component = fixture.componentInstance;
  });

  it('stays hidden without an attachment', () => {
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeNull();
  });

  it('renders the preview and emits close requests', () => {
    const closed: number[] = [];
    component.closeRequested.subscribe(() => closed.push(1));

    fixture.componentRef.setInput('attachment', {
      id: 'att-1',
      name: 'receipt.svg',
      url: '/assets/receipt.svg',
      mimeType: 'image/svg+xml',
    });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Bill Preview');
    expect(fixture.nativeElement.textContent).toContain('receipt.svg');
    expect(fixture.nativeElement.textContent).toContain('SVG document');
    expect(fixture.nativeElement.textContent).toContain('Open original');

    fixture.nativeElement.querySelector('.overlay-backdrop')?.click();

    expect(closed).toEqual([1]);
  });
});
