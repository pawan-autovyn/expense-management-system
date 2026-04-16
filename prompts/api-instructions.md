# Angular Service Implementation Instructions

Use these rules when creating or updating services in this enterprise expense platform.

## 1. Service Purpose

Services in this repo fall into two groups:

- app-wide state and business logic in `src/app/core/services/`
- feature-specific workflows in `src/app/features/<feature>/services/`

Create a service only when it clearly owns state, persistence, orchestration, or backend communication. Do not create a service just because a file feels large.

## 2. Service Naming

Name services after the responsibility, not after a generic API layer.

Examples:

- `AuthService`
- `ThemeService`
- `NotificationService`
- `ExpenseRepositoryService`
- `DirectoryService`
- `ExpenseApiService` if a real HTTP API is introduced later

## 3. Local-State Services

The current app is mostly local-state driven. For local state services:

- use `signal()` for stored values
- expose readonly signals with `.asReadonly()`
- derive values with `computed()`
- persist to local storage only when needed
- keep methods small and domain-focused

## 4. HTTP Service Rules

If a task introduces a real backend call:

- use Angular `HttpClient`
- keep request and response types in `src/app/models/` or `src/app/features/<feature>/types/`
- handle loading and error state in the service
- keep the public API small and readable
- avoid adding a shared HTTP base class unless there is a real reuse case

## 5. Recommended Shape

```typescript
import { HttpErrorResponse, HttpClient } from '@angular/common/http';
import { inject, signal, computed } from '@angular/core';

export class ExpenseApiService {
  private readonly http = inject(HttpClient);

  private readonly itemsStore = signal<Expense[] | null>(null);
  private readonly loadingStore = signal(false);
  private readonly errorStore = signal<HttpErrorResponse | null>(null);

  readonly items = this.itemsStore.asReadonly();
  readonly loading = this.loadingStore.asReadonly();
  readonly error = this.errorStore.asReadonly();
  readonly hasItems = computed(() => (this.items() ?? []).length > 0);
}
```

## 6. Method Design

- Keep one service method focused on one workflow.
- Return typed data when the method loads or mutates data.
- Reset error state before a new request.
- Set loading state before the request and clear it in `finally`.
- Keep mapping logic close to the API boundary.

## 7. Error Handling

- Convert unexpected failures into `HttpErrorResponse` or a typed domain error.
- Keep error messages user-friendly.
- Do not swallow errors silently.

## 8. Testing

Every new service should have a spec file beside it.

Test at least:

- creation
- initial state
- success path
- failure path
- reset or cleanup behavior

## 9. When Not to Create a Service

Do not create a service when:

- the logic is only template formatting
- the logic is only local component state
- the data is static seeded content with no reuse
- the component already remains small and readable without it

## 10. Coordination Rule

If a service is introduced for a form, page, or workflow, keep the service responsible for persistence and orchestration while the component stays responsible for UI state and user interaction.
