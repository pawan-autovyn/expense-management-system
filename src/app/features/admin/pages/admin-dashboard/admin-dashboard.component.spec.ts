import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { AdminDashboardComponent } from './admin-dashboard.component';

describe('AdminDashboardComponent', () => {
  let fixture: ComponentFixture<AdminDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminDashboardComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminDashboardComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    const content = fixture.nativeElement as HTMLElement;

    expect(fixture.componentInstance).toBeTruthy();
    expect(content.textContent).toContain('Total Budget');
    expect(content.textContent).toContain('Total Spent');
    expect(content.textContent).toContain('Remaining Amount');
    expect(content.textContent).not.toContain('Workflow counts');
    expect(content.textContent).not.toContain('Decision Snapshot');
    expect(content.textContent).not.toContain('Location-wise spend health');
  });
});
