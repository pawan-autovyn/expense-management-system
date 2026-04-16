# Enterprise Expense Platform - Main Copilot Instructions

You are working in a standalone Angular expense-management app. The codebase is feature-driven and uses local signal-based services, reusable shared components, and a design system under `src/styles/`.

## 1. Instruction Dispatcher

Before writing code, identify the task type and read the matching prompt file from `prompts/`:

- UI, styling, SCSS, layout, theme work -> `prompts/design-instructions.md`
- Figma-to-code work -> `prompts/figma-instructions.md`
- API or service work -> `prompts/api-instructions.md`
- HTML or template work -> `prompts/template-instructions.md`
- Forms or validation work -> `prompts/forms-instructions.md`
- Test files or spec updates -> `prompts/testing-instructions.md`
- New feature, route, page, component, or folder structure -> `prompts/structure-instructions.md`

If the task touches more than one area, read every relevant file before editing.

## 2. Real Project Structure

This repository uses a feature-driven layout. Follow the actual app structure:

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
├── mock-data/   # seeded enterprise sample data
├── models/
└── root/
```

Global design files live in `src/styles/`.

## 3. Service Rules

- Keep app-wide state and reusable business logic in `src/app/core/services/`.
- Keep feature-only services under `src/app/features/<feature>/services/` when they are truly scoped to that feature.
- Prefer one service per responsibility. Do not mix unrelated workflows in a single service.
- For local state, use Angular signals and `computed()` instead of inventing HTTP plumbing.
- For real API work, create a service only when there is an actual backend contract.

## 4. Component Rules

- Use standalone components.
- Keep route screens in `features/.../pages/`.
- Keep app chrome in `layout/`.
- Keep reusable UI in `shared/components/`.
- Keep pure helpers in `shared/utils/`.
- Keep enums, interfaces, and app-wide types in `models/`.

## 5. Template and Styling Rules

- Use Angular 21 control flow syntax: `@if`, `@for`, and `@switch`.
- Use signal reads as function calls in templates.
- Use the design system in `src/styles/` before adding custom one-off styles.
- If you are editing any `.scss` file, read `prompts/design-instructions.md` first.

## 6. Product Context

This project is a reusable enterprise expense-management platform with:

- Operation Manager, Recommender, and Admin roles
- Seeded enterprise data and local persistence
- Shared layout shell with sidebar and topbar
- Reusable charts, tables, dialogs, and utility components

Keep changes aligned with that context unless the user explicitly asks for a different architecture.
