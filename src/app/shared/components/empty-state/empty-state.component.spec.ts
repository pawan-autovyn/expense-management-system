import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmptyStateComponent } from './empty-state.component';

describe('EmptyStateComponent', () => {
  let fixture: ComponentFixture<EmptyStateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmptyStateComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(EmptyStateComponent);
  });

  it('renders the empty state copy', () => {
    fixture.componentRef.setInput('icon', '⌁');
    fixture.componentRef.setInput('title', 'Nothing here yet');
    fixture.componentRef.setInput('description', 'Start by adding a record.');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('⌁');
    expect(fixture.nativeElement.textContent).toContain('Nothing here yet');
    expect(fixture.nativeElement.textContent).toContain('Start by adding a record.');
  });
});
