# Angular HTML Template Instructions

Use these rules whenever you edit a `.component.html` file in this enterprise expense platform.

## 1. Required Syntax

Use Angular 21 control flow only:

- `@if`
- `@for`
- `@switch`

Do not use `*ngIf`, `*ngFor`, or `ngSwitch` in new work.

## 2. Signals in Templates

- Read signals as functions: `title()`, `items()`, `loading()`.
- Use optional chaining when a value can be null.
- Keep logic in the component when the template starts getting busy.

## 3. Semantic Markup

- Use `main`, `header`, `section`, `nav`, `article`, and `aside` when they fit.
- Keep buttons as real `<button>` elements.
- Use labels for inputs.
- Add accessible attributes such as `aria-label`, `aria-current`, and `role` when needed.

## 4. List Rendering

```html
@if (items(); as itemList) {
  <div class="list">
    @for (item of itemList; track item.id) {
      <article class="list__item">
        <h3>{{ item.title }}</h3>
        <p>{{ item.description }}</p>
      </article>
    } @empty {
      <p class="muted">No records found.</p>
    }
  </div>
}
```

## 5. Conditional Rendering

```html
@if (error(); as currentError) {
  <p class="text-error">{{ currentError.message }}</p>
} @else if (loading()) {
  <p class="muted">Loading...</p>
} @else {
  <p class="muted">Ready</p>
}
```

## 6. Existing App Patterns

Templates in this repo commonly render:

- dashboard cards
- tables and lists
- sidebar navigation
- topbar actions
- dialogs and confirmation states
- forms with validation messages

Keep the markup consistent with those patterns and with the shared components already available in `src/app/shared/components/`.

## 7. Class and State Binding

- Prefer clear class names over inline style clutter.
- Bind class state directly from signals when it is simple.
- Keep visual state in CSS, not in template expressions.

## 8. Buttons and Actions

- Use real buttons for interactions.
- Keep the primary action visually obvious.
- Disable buttons when a submission or destructive action is in progress.
- Keep confirmation actions explicit.
