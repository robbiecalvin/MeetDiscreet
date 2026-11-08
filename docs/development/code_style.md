# MeetDiscreet — Code Style Guidelines

## 1. Purpose

Keep MeetDiscreet’s code readable, consistent, and straightforward
to edit in VS Code.

These guidelines support page-by-page development, reusable components,
and later design revisions.

Follow established project conventions unless they conflict with
correctness, security, or an explicit current requirement.

Do not reformat unrelated files while completing a focused task.

## 2. General Principles

Prefer:

- Clear names.
- Explicit behaviour.
- Small, coherent modules.
- Straightforward control flow.
- Reusable components where justified.
- Consistent formatting.
- Minimal dependencies.
- Separation of presentation, domain rules, and infrastructure.

Avoid:

- Clever one-liners.
- Deep nesting.
- Hidden side effects.
- Unnecessary abstraction.
- Duplicated business rules.
- Unused code.
- Large unrelated refactors.

Optimize for someone understanding and editing the project later.

## 3. Formatting Defaults

Use existing formatter configuration when present.

Until tooling is selected, use:

- UTF-8 encoding.
- Two-space indentation for HTML, CSS, JavaScript, and JSON.
- Consistent LF line endings.
- A final newline.
- No trailing whitespace.
- Semicolons in JavaScript.
- Single quotes for ordinary JavaScript strings.
- Double quotes for HTML attributes.
- Trailing commas in multiline JavaScript structures where supported.

Aim for readable line lengths around 100 characters.
Do not distort readable markup or strings to satisfy an arbitrary limit.

Use automated formatting once configured.
Do not assume a formatter or lint command exists before checking.

## 4. Naming

Use names that describe purpose.

### Files and Directories

Prefer lowercase kebab-case for application source files:

- companion-profile.html
- booking-summary.css
- subscription-access.js

Preserve established documentation paths and tooling-required names.

### JavaScript

Use:

- camelCase for variables and functions.
- PascalCase for classes.
- UPPER_SNAKE_CASE for meaningful fixed constants.
- is, has, can, or should prefixes for boolean values.

Examples:

```javascript
const companionId = profile.companionId;
const isSubmitting = false;
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

function calculateBookingEstimate(booking) {
  // Implementation follows the confirmed pricing rules.
}
```

Example values in this document are illustrative.
They do not establish product limits.

### Domain Vocabulary

Use approved terms consistently:

- user
- companion
- presentation
- listing
- lookingFor
- offering
- subscription
- publishingPlan
- booking
- deposit
- boost

Avoid using “premium” interchangeably for user membership,
companion subscriptions, and publishing plans.

Use precise identifiers such as:

- userPremiumMembership
- companionSubscription
- companionPublishingPlan

## 5. HTML Structure

Use semantic elements appropriate to their purpose:

- header
- nav
- main
- section
- article
- aside
- footer
- form
- button

Use one clear page-level heading.
Maintain a logical heading hierarchy.

Use:

- Links for navigation.
- Buttons for actions.
- Lists for collections.
- Tables for genuinely tabular information.

Do not use clickable div elements when a native control is appropriate.

Keep IDs unique within the document.

Use meaningful page titles and appropriate document language.

Do not add redundant ARIA when native HTML already supplies
the correct semantics.

## 6. Forms

Every input must have an accessible name.

Prefer visible labels.
Do not use placeholder text as the only label.

Use appropriate:

- Input types.
- autocomplete values.
- inputmode values.
- Required-field indications.
- Error associations.
- Help text.

Set button types explicitly inside forms.

Group related fields with fieldset and legend where useful.

Preserve user-entered data after recoverable failures.

Client-side validation improves usability.
Backend validation remains authoritative.

Do not prevent pasting into password fields.

## 7. CSS Organization

Keep shared values in CSS custom properties.

Use the approved design system for:

- Colours.
- Typography.
- Spacing.
- Content widths.
- Borders.
- Radii.
- Shadows.
- Motion.

Do not invent a second competing token system.

Keep styles organized by responsibility:

- Tokens.
- Base elements.
- Shared layout.
- Reusable components.
- Page-specific rules.

Use descriptive component classes:

```css
.companion-card {}
.companion-card__name {}
.companion-card__action {}
.companion-card--featured {}
```

Use a consistent naming convention.
Do not mix several competing methodologies.

Avoid:

- IDs for routine styling.
- Deep selector chains.
- Excessive specificity.
- Broad selectors that unintentionally affect other pages.
- Repeated !important declarations.
- Unexplained negative margins.
- Arbitrary high z-index values.

Use !important only for a specific justified reason.

## 8. Responsive CSS

Prefer intrinsic layouts using Grid, Flexbox, and appropriate sizing.

Choose breakpoints based on content behaviour.
Use shared breakpoint conventions once established.

Do not use fixed heights for text-heavy components unless the design
requires them and overflow is handled deliberately.

Check long names, longer messages, empty states, and validation text.

Use logical properties where practical.

Do not hide essential actions merely to make a narrow layout fit.

Respect prefers-reduced-motion.

Keep page-specific visual variations explicit.
Do not accumulate fragile overrides to avoid editing the owning component.

## 9. JavaScript Modules

Use ES modules where supported by the selected environment.

Prefer:

- const by default.
- let when reassignment is needed.
- Named functions for substantial reusable operations.
- Arrow functions for concise callbacks.
- async/await for readable asynchronous control flow.
- Named exports where they clarify module responsibilities.

Avoid var in new code.

Keep browser modules focused on:

- Interface state.
- User interaction.
- Rendering.
- Calling backend APIs.
- Displaying results.

Do not place server secrets or authoritative permissions in browser modules.

Do not introduce TypeScript without an approved reason.

## 10. Function Design

Functions should perform one coherent task.

Prefer:

- Explicit parameters.
- Predictable return values.
- Early returns when they reduce nesting.
- Small helpers when they genuinely improve clarity.
- Pure functions for calculations where practical.

Avoid:

- Boolean parameters that obscure meaning.
- Functions that mix fetching, calculation, rendering, and persistence.
- Hidden reliance on unrelated global state.
- Excessively fragmented wrappers.

Do not split a clear function merely to meet an arbitrary line limit.

## 11. DOM and Event Handling

Prefer addEventListener over inline event attributes.

Keep event registration predictable.
Avoid attaching duplicate listeners during repeated rendering.

Use:

- textContent for untrusted plain text.
- Appropriate DOM APIs for structure.
- A vetted sanitization approach if approved rich text is required.

Do not insert user-controlled content into innerHTML.

Keep rendering separate from data retrieval where practical.

Use data attributes for stable behaviour hooks when helpful.
Do not couple all JavaScript selectors to decorative classes.

Manage focus deliberately when opening or closing dialogs.

## 12. State Management

Keep state ownership clear.

Distinguish:

- Local interface state.
- Session information.
- Server records.
- Derived values.
- Cached responses.

Do not maintain several conflicting copies of the same state.

Browser storage may hold suitable preferences or synthetic demo state.

It must not establish production authority for:

- Roles.
- Subscription access.
- Verification.
- Booking confirmation.
- Payment status.
- Boost balances.
- Payout balances.

Clear sensitive or account-specific cached state appropriately
when sessions change.

## 13. Asynchronous Operations

Handle:

- Loading.
- Success.
- Empty results.
- Validation failures.
- Network failures.
- Cancellation or stale responses where relevant.

Check HTTP status explicitly when using fetch.
A fulfilled fetch promise does not imply a successful HTTP response.

Use try/catch where recovery, translation, or cleanup is needed.
Do not wrap every function merely to swallow errors.

Prevent accidental duplicate submissions.
Backend idempotency is still required for consequential operations.

Avoid deeply nested promise chains.

Do not automatically retry every failed request.

Retry only appropriate transient failures, with bounded attempts
and protection against duplicated actions.

## 14. Error Handling

Use a consistent error structure at service boundaries.

Distinguish:

- Invalid input.
- Unauthenticated access.
- Forbidden access.
- Missing records.
- Conflicts.
- Rate limits.
- External-service failures.
- Unexpected internal failures.

Give users concise, actionable messages.

Keep stack traces, provider internals, and secrets out of user-facing errors.

Do not:

- Ignore errors silently.
- Show success after failure.
- Return empty data to conceal an authorization problem.
- Expose raw database errors in the interface.

Preserve diagnostic context safely.

## 15. API Boundaries

Centralize shared request behaviour when justified.

Keep page modules from independently implementing:

- Authentication headers.
- Error translation.
- Repeated endpoint configuration.
- Response normalization.

Define clear request and response shapes.

Validate external data at trust boundaries.

Use precise property names and consistent representations.
Translate database naming conventions at an explicit boundary if needed.

Do not assume frontend-supplied prices, ownership, or entitlements
are trustworthy.

## 16. Money and Time

### Money

Use integer minor currency units for authoritative calculations.

Use explicit names:

- amountMinor
- currency
- durationMinutes
- depositAmountMinor

Use approved domain formulas and rounding rules.

Use Intl.NumberFormat or an appropriate equivalent for presentation.

Do not calculate financial authority by parsing formatted display strings.

Keep prices and plan definitions centralized.

Frontend estimates must not replace server-confirmed amounts.

### Time

Distinguish:

- Calendar dates.
- Local scheduled times.
- Absolute timestamps.
- Durations.
- IANA time-zone identifiers.

Use explicit names and documented formats.

Do not rely on the machine’s default time zone for booking rules.

Use appropriate date/time handling for daylight-saving transitions.

## 17. Backend and Database Conventions

Follow the selected backend runtime and provider conventions.

Do not assume Node.js APIs exist in every JavaScript environment.

For SQL:

- Prefer descriptive snake_case identifiers unless existing conventions differ.
- Use parameterized queries.
- Add appropriate constraints and indexes.
- Version schema and permission changes.
- Keep migration ordering clear.
- Avoid SELECT * in public-facing response construction.

Enforce ownership and entitlements in the trusted backend or database layer.

Do not introduce Python, PHP, or another backend language solely
because the original framework included style examples for it.

Add language-specific conventions when that language is approved.

## 18. Duplication and Shared Components

Before adding logic:

1. Search for an existing implementation.
2. Check its responsibility and consumers.
3. Reuse or extend it when appropriate.
4. Create a new abstraction only when it adds clear value.

Centralize authoritative:

- Pricing.
- Revenue allocations.
- Entitlement rules.
- Posting allowances.
- Boost allowances.
- Booking transitions.
- Cancellation calculations.

Keep shared navigation, dialogs, cards, and forms consistent.

Avoid generic helper frameworks for isolated use cases.

## 19. Constants and Configuration

Use named constants for meaningful fixed values.

Use configuration for environment-dependent values.

Do not turn every literal into a constant.

Do not hardcode:

- Secret credentials.
- User-specific paths.
- Production endpoints across unrelated files.
- Duplicate plan prices.
- Unconfirmed product limits.

Configuration examples must not contain usable secrets.

Remember that browser-bundled configuration is public.

## 20. Imports and Dependencies

Import only what is used.

Group imports consistently:

1. External packages.
2. Shared application modules.
3. Local feature modules.

Follow tooling-specific requirements where applicable.

Avoid circular dependencies and unnecessary barrel exports.

Use explicit module paths compatible with the selected tooling.

Do not add a package for functionality already adequately supplied
by the platform or project.

## 21. Comments and Documentation

Comments should explain:

- Non-obvious reasoning.
- Important constraints.
- External-service quirks.
- Security boundaries.
- Financial or scheduling decisions.

Do not narrate obvious syntax.

Use JSDoc where it clarifies important public functions,
data shapes, or non-obvious contracts.

Do not add long framework essays inside source files.

Do not conceal unfinished work behind comments.

Track deferred implementation in the roadmap.
Describe limitations accurately.

Keep comments and customer-facing copy professional.

## 22. Logging

Use concise, structured logging where supported.

Record useful:

- Event names.
- Safe record identifiers.
- State transitions.
- Failure categories.
- Correlation identifiers.

Do not log:

- Passwords.
- Tokens.
- Secret keys.
- Payment credentials.
- Private messages.
- Sensitive profile details.
- Signed private-media URLs.

Do not leave noisy debugging output in production code.

## 23. Test Style

Tests should be readable and focused on observable behaviour.

Use descriptive names, for example:

```javascript
test('a subscription to one companion does not unlock another', () => {
  // Exercise the real entitlement rule with controlled test inputs.
});
```

This is a naming illustration, not a completed test.

Prefer:

- Arrange, act, assert structure.
- Deterministic fixtures.
- Explicit expected outcomes.
- Controlled clocks where needed.
- Isolated test environments.
- Stable browser-test selectors.

Avoid:

- Arbitrary sleeps.
- Unnecessary mocking.
- Tests that only restate implementation.
- Tests dependent on execution order.
- Real customer data.
- Production payment credentials.

Add regression coverage for meaningful bugs.

Do not write redundant tests for every trivial presentation adjustment.

## 24. Completion Checks

Before completing a change:

- Remove unused imports and dead code.
- Check naming and responsibility boundaries.
- Confirm shared rules remain centralized.
- Run configured formatting and relevant checks.
- Inspect affected interface behaviour where applicable.
- Preserve unrelated changes.
- Report verification limits honestly.

Do not claim linting, formatting, or tests passed unless those checks ran.

## 25. Final Rule

Write code Robbie can understand, revise, and maintain.

Prefer clear structure over cleverness.
Keep visual edits manageable.
Keep business authority on the backend.
Make important behaviour explicit and testable.