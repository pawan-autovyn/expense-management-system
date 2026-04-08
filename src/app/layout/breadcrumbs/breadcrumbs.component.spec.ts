import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { BreadcrumbsComponent } from './breadcrumbs.component';

@Component({
  standalone: true,
  template: '',
})
class DummyComponent {}

describe('BreadcrumbsComponent', () => {
  let fixture: ComponentFixture<BreadcrumbsComponent>;
  let component: BreadcrumbsComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BreadcrumbsComponent, DummyComponent],
      providers: [
        provideRouter([
          { path: '', component: DummyComponent },
          { path: 'admin/reports', component: DummyComponent },
        ]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BreadcrumbsComponent);
    component = fixture.componentInstance;
  });

  it('creates home and nested breadcrumbs from the current url', () => {
    expect((component as unknown as { createBreadcrumbs: (url: string) => unknown[] }).createBreadcrumbs('/')).toEqual([
      { label: 'Home', route: '/' },
    ]);
    expect(
      (component as unknown as { createBreadcrumbs: (url: string) => unknown[] }).createBreadcrumbs(
        '/admin/reports?tab=month',
      ),
    ).toEqual([
      { label: 'Admin', route: '/admin' },
      { label: 'Reports', route: '/admin/reports' },
    ]);
  });

  it('updates breadcrumbs after router navigation events', async () => {
    const router = TestBed.inject(Router);

    await router.navigateByUrl('/admin/reports');
    fixture.detectChanges();

    expect(
      fixture.nativeElement.textContent.replace(/\s+/g, ' ').trim(),
    ).toContain('Reports');
  });
});
