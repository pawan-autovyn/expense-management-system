# Angular Testing Instructions

Use these rules when creating or updating `.spec.ts` files in this enterprise expense platform.

## 1. Test Layout

- Keep each spec beside the file it tests.
- Match the feature folder structure already used by the app.
- Keep component, service, guard, utility, and route tests in the same feature scope when possible.

## 2. Naming Rules

- Name tests after the real product behavior, not demo or mock language.
- Use enterprise terms such as `Operation Manager`, `Recommender`, `Admin`, `login`, `dashboard`, `workflow`, and `records`.
- Avoid `demo`, `mock`, `EMS`, and prototype wording in test descriptions unless the file itself is testing sample data helpers.

## 3. Behavior Coverage

- Test the public contract of each component or service.
- Verify empty, populated, and error states when they exist.
- For routing, test redirects, guards, and lazy-loaded route groups.
- For forms, test validation, submission, and disabled states.
- For shared components, test rendering plus key inputs and outputs.

## 4. Assertions

- Prefer focused assertions that describe behavior the user can observe.
- Keep DOM assertions tied to the rendered copy, class state, or emitted events.
- Avoid testing private implementation details unless there is no better public signal.

## 5. Copy and Content

- If the UI copy changes, update the spec to match the new words.
- Keep helper text in specs aligned with the live page language.
- Use real role names and workflow labels from the app.

## 6. Test Quality

- Keep setup minimal and readable.
- Reuse existing test helpers when they fit.
- Cover important branches, but avoid repeating the same assertion in multiple forms.

## 7. Alignment Check

- Verify that the spec name, `describe()` text, and assertions all match the current page or service behavior.
- If a feature folder is renamed, update the related spec names and descriptions too.
