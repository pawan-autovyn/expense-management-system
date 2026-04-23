import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfirmDialogComponent } from './confirm-dialog.component';

describe('ConfirmDialogComponent', () => {
  let fixture: ComponentFixture<ConfirmDialogComponent>;
  let component: ConfirmDialogComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfirmDialogComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmDialogComponent);
    component = fixture.componentInstance;
  });

  it('stays hidden when closed', () => {
    fixture.componentRef.setInput('message', 'Delete this item?');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeNull();
  });

  it('renders the dialog and emits cancel and confirm events', () => {
    const cancelled: number[] = [];
    const confirmed: number[] = [];

    component.cancelled.subscribe(() => cancelled.push(1));
    component.confirmed.subscribe(() => confirmed.push(1));

    fixture.componentRef.setInput('open', true);
    fixture.componentRef.setInput('title', 'Remove expense');
    fixture.componentRef.setInput('message', 'Do you want to remove this expense?');
    fixture.detectChanges();

    fixture.nativeElement.querySelector('.overlay-backdrop')?.click();
    fixture.nativeElement.querySelector('.button--danger')?.click();

    expect(fixture.nativeElement.textContent).toContain('Remove expense');
    expect(cancelled).toEqual([1]);
    expect(confirmed).toEqual([1]);
  });
});
