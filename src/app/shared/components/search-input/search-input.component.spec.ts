import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SearchInputComponent } from './search-input.component';

describe('SearchInputComponent', () => {
  let fixture: ComponentFixture<SearchInputComponent>;
  let component: SearchInputComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SearchInputComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SearchInputComponent);
    component = fixture.componentInstance;
  });

  it('renders the placeholder and emits changed values', async () => {
    const values: string[] = [];
    component.valueChange.subscribe((value) => values.push(value));

    fixture.componentRef.setInput('placeholder', 'Search expenses');
    fixture.componentRef.setInput('value', 'tea');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
    expect(input.placeholder).toBe('Search expenses');
    expect(input.value).toBe('tea');

    input.value = 'milk';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    await fixture.whenStable();

    expect(values).toEqual(['milk']);
  });
});
