# Angular Project Structure & Scaffolding Instructions

Use these rules when creating new pages, features, components, services, or route groups in this enterprise expense platform.

## 1. Repository Shape

This app is feature-driven, not module-driven. Use the existing layout:

```text
src/app/
├── core/
│   ├── constants/
│   ├── guards/
│   └── services/
├── features/
│   ├── admin/
│   │   ├── admin.routes.ts
│   │   └── pages/
│   ├── manager/
│   │   ├── manager.routes.ts
│   │   └── pages/
│   ├── public/
│   │   └── pages/
│   └── shared/
├── layout/
├── shared/
│   ├── components/
│   └── utils/
├── models/
├── mock-data/
└── root/
```

## 2. Creating a New Feature

When adding a new feature area, create:

```text
src/app/features/[feature-name]/
├── [feature-name].routes.ts
├── pages/
│   └── [page-name]/
│       ├── [page-name].component.ts
│       ├── [page-name].component.html
│       ├── [page-name].component.scss
│       └── [page-name].component.spec.ts
├── services/            # only when the feature owns state or API calls
└── types/               # only when the feature needs feature-specific types
```

## 3. Routing Rules

- Add the feature route to `src/app/app.routes.ts`.
- Lazy-load feature route groups with `loadChildren`.
- Keep route guards in `src/app/core/guards/`.
- Keep shared detail screens in `features/shared/` if multiple roles use them.

## 4. Creating a New Page Component

Use a standalone component and keep it inside the feature page folder:

```typescript
import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-example-page',
  standalone: true,
  templateUrl: './example-page.component.html',
  styleUrl: './example-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExamplePageComponent {}
```

## 5. Shared Component Rules

- Put reusable controls and widgets in `src/app/shared/components/`.
- Put small pure helpers in `src/app/shared/utils/`.
- Use shared components before creating duplicate UI.
- If a component is only needed once, keep it local to the feature page.

## 6. Service Placement Rules

- Use `src/app/core/services/` for app-wide services such as auth, theme, notifications, and directory-style state.
- Use `src/app/features/<feature>/services/` for feature-owned workflows.
- Do not create a service unless there is a clear state, workflow, or data boundary.

## 7. Type Placement Rules

- Put app-wide enums and interfaces in `src/app/models/`.
- Put feature-specific request/response types in `src/app/features/<feature>/types/`.
- Keep file names descriptive and aligned with the domain.

## 8. Checklist

- [ ] Feature route file created
- [ ] Route added to `app.routes.ts`
- [ ] Page component created under `features/.../pages/`
- [ ] Shared UI reused where possible
- [ ] Service added only if required
- [ ] Types placed in the correct scope
