# Enterprise Expense Management System

Aurora Ledger is a premium Angular frontend for office and dealership expense operations. It is built for demo and presentation use with static mock data only, role-based access, polished dashboards, approval flows, bill previews, category budgets, and reusable enterprise UI primitives.

## Stack

- Angular `19.2.x`
- Standalone components with lazy-loaded feature routes
- TypeScript strict mode
- SCSS with Aurora Ledger theme tokens
- ESLint + Prettier
- Static mock repositories and local storage session persistence

Note: Angular `21.x` was not usable in this workspace because the local Node runtime is `20.18.0`, while Angular `21.2.6` requires Node `20.19.0+`. The app is therefore scaffolded on Angular `19.2.x` so it remains runnable on this machine.

## Demo Credentials

- Admin: `admin@auroraledger.demo`
- Operation Manager: `manager@auroraledger.demo`

No password is required. Login is simulated and persisted in local storage.

## Features

- Premium login with role switching and dark/light theme toggle
- Role-based shell, sidebar navigation, public pages, and route guards
- Admin dashboard with KPI cards, trends, status distribution, alerts, bill gallery, and manager spend summary
- Operation Manager dashboard with budget progress, recent submissions, and quick add flow
- Expense creation form with validation, draft submit flow, receipt upload, and budget indicator
- Expense tables with filters, sort controls, receipt preview modals, and row actions
- Finance review queue with mock approve, reject, and reopen actions
- Budget and category overview screens
- Reports, notifications, profile, and settings pages for live demo coverage

## Folder Overview

```text
src/app
├── core
│   ├── constants
│   ├── guards
│   └── services
├── features
│   ├── admin
│   ├── manager
│   ├── public
│   └── shared
├── layout
├── mock-data
├── models
└── shared
    ├── components
    └── utils
```

## Scripts

- `npm start`
- `npm run build`
- `npm run lint`
- `npm test`
- `npm run test:coverage`
- `npm run format`
- `npm run format:check`

## Verification Notes

- `ngc -p tsconfig.app.json` passes.
- `npm run lint` passes.
- `ng build` currently hits an environment-specific `esbuild` deadlock in this machine image, even after Angular compilation is clean. The source itself type-checks and Angular template-compiles successfully.

## Future Backend Integration

- Replace `ExpenseRepositoryService`, `NotificationService`, and `DirectoryService` mock repositories with API-backed services.
- Keep the same typed view models and component contracts to minimize UI churn.
- Move approval actions into real workflow endpoints.
- Add HTTP interceptors for auth headers, error normalization, and retry strategy.
- Persist budgets, categories, templates, locations, and approvals through backend resources.

## Theme Notes

Aurora Ledger uses:

- Deep hybrid background surfaces
- Glassmorphism cards with strong contrast
- Indigo, cyan, and violet enterprise accents
- Compact SaaS spacing and high-density data presentation
- Responsive shell layout with a floating quick action button
