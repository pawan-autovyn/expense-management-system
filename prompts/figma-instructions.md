# Figma-to-Code Instructions

Use these rules when translating a design mock into Angular components in this enterprise expense platform.

## 1. Translation Goal

- Match structure, hierarchy, spacing, and responsiveness first.
- Preserve the app's blue-led enterprise theme unless the design system changes intentionally.
- Prefer reusable components from `src/app/shared/components/` when the design fits them.

## 2. What to Build

- Use standalone Angular components.
- Keep page-level work in `src/app/features/<feature>/pages/`.
- Keep reusable pieces in `src/app/shared/components/` only when they truly repeat.
- Keep styling in the component SCSS file unless the pattern belongs in the design system.

## 3. Fidelity Rules

- Respect layout proportions, card structure, and visual hierarchy.
- Use real semantic HTML.
- Keep spacing consistent with the design system tokens.
- Do not copy pixel values blindly if the design system already provides a matching token.

## 4. Workflow

1. Read the mock carefully.
2. Identify shared patterns and reusable pieces.
3. Build the page structure.
4. Wire up copy, labels, and state.
5. Adjust styling against the design system.
6. Add or update tests for the new behavior.

## 5. Output Expectations

- The result should feel production-ready, not like a one-off mock.
- Keep code easy to maintain and easy to extend.
- Do not introduce extra abstractions unless the design truly needs them.
