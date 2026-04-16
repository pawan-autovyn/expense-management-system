# Angular Design System Instructions

Use these rules for every styling task in this enterprise expense platform.

## 1. Source of Truth

The canonical design system now lives in:

- `src/styles/variables.scss`
- `src/styles/mixins.scss`
- `src/styles/utilities.scss`
- `src/styles/design-system.scss`

`src/app/theme/theme.scss` exists only as a compatibility bridge for older imports.

## 2. Design Direction

The app uses a professional blue-led system with soft surfaces, high contrast text, and gentle elevation. Prefer:

- blue primary actions
- neutral cards and panels
- clear hierarchy over decorative complexity
- accessible contrast and focus states
- responsive layouts that collapse cleanly on mobile

## 3. Token Usage

Prefer tokens instead of hardcoded values:

- Colors: `--primary-blue`, `--primary-blue-light`, `--bg-main`, `--bg-card`, `--text-primary`, `--text-secondary`, `--border-color`
- Typography: `--font-family-primary`, `--font-family-display`, `--font-size-*`, `--font-weight-*`
- Spacing: `--space-*`
- Radius: `--radius-*`
- Shadows: `--shadow-*`

If a token exists, use it. If a token is missing, add it to `src/styles/variables.scss` before inventing a one-off value.

## 4. SCSS File Rules

- Import mixins with `@use '../../../styles/mixins' as *;` or the correct relative path.
- Use design tokens for spacing, radius, and color.
- Keep component SCSS small and focused.
- Avoid `!important` unless you are overriding a utility class on purpose.
- Avoid absolute positioning unless the element is an overlay, menu, tooltip, or modal layer.

## 5. Preferred Mixins

Use the provided mixins when they fit:

- Typography: `heading-h1`, `heading-h2`, `heading-h3`, `body-text`, `body-text-small`, `label-text`
- Layout: `app-container`, `auth-container`, `page-header`, `content-area`, `sidebar`
- Material-style surfaces: `mat-card`, `mat-button-primary`, `mat-button-secondary`, `mat-button-danger`, `mat-form-field`, `mat-table`
- Forms: `input-field`, `form-field-wrapper`, `validation-message`
- Motion: `slide-up-animation`, `fade-in-animation`, `pulse-animation`, `loading-spinner`, `skeleton-loader`
- Responsive helpers: `mobile`, `tablet`, `desktop`, `large-desktop`

## 6. Global Utility Classes

Use `src/styles/utilities.scss` for common layout helpers such as:

- flex and grid utilities
- alignment helpers
- spacing helpers
- text and background helpers
- border, radius, and shadow helpers

Prefer utility classes for simple layout. Use SCSS when the styling is component-specific.

## 7. Base Styling Rules

- Keep the body background layered and subtle.
- Use readable, intentional typography.
- Make buttons feel interactive without becoming noisy.
- Ensure forms have strong focus states.
- Design for desktop first only when the interaction truly requires it. Otherwise start mobile-first.

## 8. Component Styling Pattern

For a typical page component:

```scss
@use '../../../../styles/mixins' as *;

.page {
  @include content-area;

  .page__header {
    @include page-header;
  }

  .page__card {
    @include mat-card;
    padding: var(--space-6);
  }
}
```

## 9. Theme Compatibility

If you encounter older imports that still point to `src/app/theme/`, keep them working, but treat `src/styles/` as the canonical source.
