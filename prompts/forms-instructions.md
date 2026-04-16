# Angular Forms Implementation Instructions

Use these rules when creating or updating forms in this enterprise expense platform.

## 1. Reuse Check First

Before building a form UI, check `src/app/shared/components/` for reusable pieces such as:

- `search-input`
- `file-upload`
- `expense-filter-bar`
- `confirm-dialog`
- `status-badge`

If a UI element is repeated across pages, prefer a shared component. If it is unique to one workflow, keep it local to that page.

## 2. Current Form Philosophy

- Use Reactive Forms by default.
- Use Angular 21 control flow syntax in templates.
- Keep validation logic in the component or in a dedicated validator helper.
- Use signals for UI state like `loading`, `submitting`, and `error`.
- Keep form submissions inside a service when the workflow has persistence or shared business rules.

## 3. Shared Control Rule

This repo does not currently ship with generic `app-input` or `app-textarea` form wrappers. Only create wrapper controls if:

- the same field pattern repeats in at least two places, or
- the control needs custom behavior that native HTML cannot provide cleanly.

If you do create wrappers, place them in `src/app/shared/components/` under a clear subfolder such as `form-controls/`.

## 4. Form Component Shape

```typescript
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-example-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './example-form.component.html',
  styleUrl: './example-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExampleFormComponent {
  private readonly fb = inject(FormBuilder);

  readonly isSubmitting = signal(false);

  readonly form = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
  });
}
```

## 5. Form Template Rules

- Bind the form with `[formGroup]`.
- Use `formControlName` for every field.
- Show validation messages with `@if`.
- Disable submit while invalid or submitting.
- Use shared components when they exist.

Example:

```html
<form [formGroup]="form" (ngSubmit)="onSubmit()" class="form-shell">
  <label class="field">
    <span class="field__label">Title</span>
    <input formControlName="title" type="text" />
  </label>

  @if (form.get('title')?.touched && form.get('title')?.invalid) {
    <p class="field__error">Title is required.</p>
  }

  <div class="form-actions">
    <button type="button">Cancel</button>
    <button type="submit" [disabled]="form.invalid || isSubmitting()">Save</button>
  </div>
</form>
```

## 6. Validation Rules

- Keep simple checks inline with `Validators`.
- Move shared cross-field validation into a helper function.
- Show errors only after touch, dirty, or submit states.
- Keep error copy short and user-friendly.

## 7. File Uploads and Search

- Use `file-upload` for receipt-style attachments or document upload flows.
- Use `search-input` for live filtering and searchable lists.
- Keep those components reusable rather than duplicating the markup in every page.

## 8. Service Coordination

If the form submits data to a service:

- keep form mapping inside the component or a small adapter helper,
- keep persistence in the service,
- keep UI-only state in the component.

That separation keeps the form easy to test and easy to maintain.
