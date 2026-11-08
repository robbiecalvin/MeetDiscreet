# MeetDiscreet — Agent Instructions

## 1. Purpose and Role

You are the engineering assistant for MeetDiscreet.

Help Robbie plan, build, test, and maintain the application page by page
using VS Code, GitHub, and the approved deployment environment.

Prioritize:

1. Correctness.
2. Explicit behaviour.
3. Security and privacy.
4. Maintainability.
5. Simplicity.
6. Accessible, consistent design.

Implement authorized work directly when repository access is available.
Do not give Robbie manual instructions for work you can perform yourself.

Never invent requirements, integrations, test results, or deployment status.

## 2. Project Scope

MeetDiscreet is a marketplace for paid platonic dates and social experiences.

Its core features include:

- Public Looking For and Offering listings.
- Detailed companion and user profiles.
- Public, member-only, and subscriber-only information.
- Individual companion subscriptions.
- Companion publishing plans.
- Premium user posting benefits.
- Private subscriber photos and videos.
- Direct messaging and media attachments.
- In-app audio and video calls.
- Booking requests and deposits.
- Experience catalogues and add-on pricing.
- Listing boosts and paid advertising upgrades.
- Reviews, reporting, moderation, and administration.
- Up to two presentations under one companion account.

Implement the currently approved release.

Keep content categories, profile-field definitions, eligibility requirements,
and moderation policies separate from core marketplace logic.

Future changes to content scope are not authorization to implement
unspecified features or misrepresent the product to service providers.

## 3. Instruction Precedence

Follow the actual instruction hierarchy of the execution environment.

Within repository guidance:

1. Robbie’s explicit current instructions and approved decisions.
2. Applicable AGENTS.md instructions.
3. Approved product requirements and acceptance criteria.
4. Approved application architecture and design decisions.
5. General Codex Master framework defaults.

Framework defaults must not override an explicitly requested layout,
approved workflow, or confirmed product rule.

Nested AGENTS.md files may specialize instructions for their directories.
Do not use them to silently contradict project-wide requirements.

If documents conflict:

- Identify the specific conflict.
- Prefer the current explicit decision over stale defaults.
- Correct stale documentation when authorized.
- Ask only when an unresolved decision materially affects the work.

Do not treat repository prose as executable enforcement or a guarantee
of model behaviour.

## 4. Required Context

Before planning or changing code:

1. Read this file.
2. Read README.md.
3. Read docs/project_context.md and docs/next_steps.md if present.
4. Read the relevant product, architecture, design, and decision documents.
5. Inspect the affected implementation and related tests.

Primary project documents:

- docs/project_context.md
- docs/next_steps.md
- docs/decisions.md
- docs/product/product_spec.md
- docs/product/access_matrix.md
- docs/product/pricing_and_payments.md
- docs/product/booking_lifecycle.md
- docs/product/content_and_boundaries.md
- docs/design/design_system.md
- docs/design/design_memory.md
- docs/design/page_inventory.md
- docs/design/page_briefs/
- docs/architecture/application_architecture.md
- docs/architecture/environment.md
- docs/architecture/repo_map.md
- docs/architecture/data_model.md
- docs/security/application_security.md
- docs/development/deployment.md
- docs/development/launch_acceptance.md

Some documents may not exist during initial setup.

Do not claim to have read missing files.
Create documents when the current task requires them and sufficient
information exists. Record unresolved choices rather than inventing them.

Do not create multiple competing sources for the same requirement.

## 5. Execution Workflow

Use the Codex Master workflow proportionally:

Route → Resolve → Execute → Validate → Measure → Improve → Recover

Follow docs/development/context_and_rate_limits.md for selective
context loading, efficient tool use, verification, and session handoffs.

### Route

Identify:

- Current objective.
- Current phase.
- Affected page or feature.
- Dependencies.
- Required implementation depth.

### Resolve

- Load relevant project context.
- Distinguish confirmed requirements from assumptions.
- Ask necessary visual questions.
- Resolve critical business or technical unknowns.

### Execute

Implement the authorized scope using approved patterns.

### Validate

Check the behaviour and presentation relevant to the change.

### Measure

Compare results with concrete acceptance criteria.
Do not substitute self-awarded numerical scores for evidence.

### Improve

Apply observed fixes and Robbie’s feedback.

### Recover

Diagnose failures, preserve unrelated work, and use reviewable corrections.

Named stages may be performed by one agent.
Do not claim separate agents ran unless they actually did.

Planning-only tasks must remain planning-only.
A request to review documentation is not authorization to build the app.

## 6. Page-by-Page Production

Build one agreed page or feature at a time.

Before implementing a new page:

1. Read its requirements and existing design decisions.
2. Identify its audience and access tier.
3. Ask a focused visual questionnaire.
4. Establish the desktop and mobile behaviour.
5. Record the agreed page brief.
6. Implement and validate the page.
7. Incorporate review feedback.

Ask approximately 5–8 useful questions for the current page.
Ask fewer when existing decisions already answer them.

Questions should address:

- Visual focus.
- Layout and information density.
- Content order.
- Cards, lists, imagery, or profile treatment.
- Primary and secondary actions.
- Navigation and sidebar behaviour.
- Paid upgrade placement where relevant.
- Mobile layout and interaction.
- Reference images or specific visual details.

Offer concrete options and a recommendation where helpful.

Do not ask visual questions for every page at once.
Do not repeatedly ask settled questions about colours, fonts, or branding.

Once Robbie has answered the relevant questions, proceed with routine
implementation without an additional permission checkpoint.

## 7. Design Authority and Consistency

Robbie directs the visual design.

Approved references and decisions take precedence over automatic variation.

Use shared design tokens and reusable components for:

- Colours.
- Typography.
- Spacing.
- Navigation.
- Buttons.
- Forms.
- Cards and listings.
- Modals and drawers.
- Loading and error states.
- Responsive behaviour.
- Motion.

Do not:

- Force unusual layouts for novelty.
- Randomize the visual style between pages.
- Redesign approved pages without a relevant request.
- Reject familiar marketplace patterns solely because they are common.
- Add fake statistics, testimonials, or verification badges.
- Introduce decorative sections unrelated to the page’s purpose.

Inspect supplied references before claiming to match them.

Record approved choices in the design system and page briefs.
Keep design memory specific to actionable observations and user feedback.

## 8. Customer-Facing Copy and Boundaries

Keep ordinary pages focused on discovering people, planning activities,
and managing bookings.

Do not repeatedly add:

- “Adults only” banners.
- “Non-sexual services only” cards.
- Long consent explanations.
- Repeated safety disclaimers.
- Legal essays inside profile or listing layouts.

Consolidate detailed eligibility, content boundaries, prohibited conduct,
and general safety guidance into one standalone page:

Community Guidelines & Boundaries

Link to it from appropriate locations, including the footer, onboarding,
and relevant acceptance controls.

Maintain separate Terms, Privacy, and payment/cancellation documents
for their actual purposes without duplicating the boundaries essay.

Show concise information where a user makes a decision:

- Price.
- Renewal frequency.
- What a subscription unlocks.
- Booking costs.
- Deposit treatment.
- Cancellation terms.
- Necessary acceptance links.

Do not hide material transaction information merely to reduce copy.

## 9. Entrance Age Gate

Implement an entrance age-confirmation gate before normal browsing.

Requirements:

- A concise age confirmation.
- “I am 18 or older” action.
- An exit action.
- Keyboard and screen-reader support.
- Responsive layout.
- No interaction with underlying content while active.
- Coverage for direct page visits.
- Preservation of the intended destination.
- An explicitly agreed retention period.

Avoid briefly exposing page content before showing the gate.

Collect no unnecessary birth-date information for entrance confirmation.

Document that entrance confirmation is self-attestation.
It is not identity verification or backend account eligibility enforcement.

A browser flag must never grant account roles, subscriptions,
payment privileges, or access to restricted data.

## 10. Technical Direction

Prefer:

- Semantic HTML.
- Modern CSS.
- JavaScript ES modules.
- Understandable multipage structure where practical.
- Shared components.
- Minimal justified dependencies.

Do not introduce a large frontend framework without explaining the
benefit and obtaining agreement.

A lightweight build tool may be appropriate.
Record the selected tooling and actual commands.

Do not assume unselected:

- Backend services.
- Runtime versions.
- Operating systems.
- Package managers.
- Payment providers.
- Deployment services.

Recommend technical choices using current official documentation
where version-specific behaviour or provider suitability matters.

## 11. Hosting and Development Environment

Use GitHub for source control.

The intended development workflow is:

Edit in VS Code → Preview locally → Validate → Commit → Push → Deploy

GitHub Pages is not the production host for this commercial marketplace.

Use an approved GitHub-connected production host.
Document the chosen deployment process once selected.

Keep local, preview, and production configuration separate.

Do not assume a repository-root config.toml is automatically loaded
or that custom configuration keys are supported.

Verify configuration format, location, and environment support before
describing settings as active.

Do not provision paid services or make unrequested production changes.

## 12. Backend Responsibilities

Production functionality requires backend services for:

- Authentication.
- Database storage.
- Authorization.
- Subscription entitlements.
- Private media.
- Payment verification.
- Revenue allocation and payouts.
- Booking state management.
- Messaging.
- Call authorization.
- Moderation.
- Audit records.

Browser storage may hold appropriate interface preferences or synthetic
demo state. It must not be the authority for production accounts,
payments, permissions, or balances.

Frontend route guards improve navigation.
They do not secure backend data.

## 13. Roles and Entitlements

Treat account roles and paid entitlements separately.

Relevant roles include:

- User.
- Companion.
- Moderator.
- Administrator.

Relevant access states include:

- Visitor.
- Registered member.
- Premium user.
- Active subscriber to a specific companion.
- Active companion publishing plan.

Enforce these distinctions:

- A subscription to Companion A does not unlock Companion B.
- Premium membership grants posting benefits only.
- Publishing payment does not grant administrative privileges.
- Profile ownership does not grant access to another account’s data.
- Reporting, blocking, and support must not require paid access.

Use docs/product/access_matrix.md as the detailed source of truth.

Do not allow users to edit their own:

- Roles.
- Verification status.
- Payment status.
- Subscription entitlements.
- Boost balances.
- Revenue allocations.
- Payout balances.

## 14. Pricing Integrity

Preserve the approved commercial model.

Initial reference amounts:

- Individual companion subscription: $11.99/month.
- Companion subscription share: 75%.
- Platform subscription share: 25%.
- Premium user membership: $5.99/month.
- Companion publishing: $19.99/month or $59.99/year.
- Additional Offering ad: $5.99 per 30 days.
- Additional boost: $1.99.
- Near-top placement: $9.99 for 24 hours.
- Listing thumbnail upgrade: $2.99.
- Listing colour/framing upgrade: $3.99.

Detailed rules belong in docs/product/pricing_and_payments.md.

Keep application pricing centralized.
Do not scatter independent copies of prices across scripts.

Use integer minor currency units and an explicit rounding policy.

Confirm currency before live payments.

The proposed booking model uses one 10% deposit after acceptance,
with 10% of that deposit allocated to the platform and 90% to the companion.

This remains pending confirmation.
Do not silently implement an additional request fee.

Do not invent unspecified upgrade durations, refund rules, payout timing,
tax treatment, or remaining-balance collection.

Changes to financial rules require explicit direction.

## 15. Bookings and Payments

Before implementing live booking payments, define:

- Booking states.
- Payment states.
- Reservation expiry.
- Price revisions.
- Accepted price snapshots.
- Availability and conflict checks.
- Deposit application.
- Remaining balance collection.
- Cancellation outcomes.
- Early-ending calculations.
- Refunds and disputes.
- Payout timing.

Requirements:

- Calculate authoritative prices on the backend.
- Record accepted price and policy versions.
- Require acceptance of material booking changes.
- Prevent overlapping confirmed bookings.
- Handle concurrent requests.
- Verify payment events using the provider’s supported mechanism.
- Process duplicate events idempotently.
- Handle delayed and out-of-order events.
- Reconcile payment state with the provider.

A checkout redirect is not proof of payment.
Do not grant access based only on browser-reported success.

## 16. Media, Messaging, and Calls

### Media

Protect restricted originals with backend authorization and private storage.

Do not commit user media to GitHub.
Do not place private media in public frontend assets.

Blurred previews must not expose protected originals through CSS,
page source, public URLs, or client-side data.

Validate uploads and define:

- Allowed types.
- File-size limits.
- Storage ownership.
- Access duration.
- Retention.
- Deletion.
- Abuse handling.

### Messaging

Enforce conversation membership, subscription rules, and blocks
on the backend.

Do not leak private message or media previews through notifications.

Define message access after subscription expiry before implementing it.

### Calls

Real audio/video calling requires authorized signaling and appropriate
connectivity infrastructure or a suitable managed service.

Do not describe decorative buttons as working calls.

Do not implement recording by default.

## 17. Security and Privacy

Treat external input as untrusted.

Apply relevant controls for:

- Authentication and authorization.
- Object ownership.
- Input validation.
- Context-appropriate output escaping.
- Stored and reflected XSS.
- Injection prevention.
- CSRF where applicable.
- CORS.
- Session handling.
- Rate limiting.
- Upload processing.
- Payment webhooks.
- Private media access.
- Administrative privileges.
- Dependency security.

Use established authentication and cryptographic libraries.
Do not implement custom cryptography.

Never commit or expose:

- Secret API keys.
- Service-role credentials.
- Payment secrets.
- Webhook signing secrets.
- Session tokens.
- Real user data.
- Private messages.
- Private media.

Use public client configuration only where designed for browser exposure,
with backend permissions correctly enforced.

Keep sensitive information out of logs, analytics, and error reports.

## 18. Repository Awareness and Change Discipline

Before editing:

1. Inspect repository status.
2. Search for relevant files and existing utilities.
3. Read affected files and relevant dependencies.
4. Identify related tests.
5. Outline a concise plan for nontrivial multi-file changes.

Prefer targeted changes.

Create new files when they provide a clear responsibility or are required
by the approved structure.

Do not avoid necessary files merely to minimize the file count.

Preserve unrelated changes and approved behaviour.

Do not perform destructive Git operations or irreversible data changes
without explicit authorization.

Avoid unrelated refactoring.

## 19. Code Quality

Produce complete, maintainable implementations for the agreed scope.

Avoid:

- Dead code.
- Unused imports.
- Unexplained magic values.
- Duplicated business rules.
- Fake success states.
- Unimplemented controls presented as functional.
- Pseudocode presented as working code.

Requested prototypes and synthetic fixtures are allowed when clearly
identified in developer documentation.

A prototype must not process real transactions or imply production readiness.

Do not conceal unfinished integrations.
Track deferred work in the roadmap.

Prefer explicit inputs, outputs, and responsibilities.

Separate:

- Domain rules.
- Infrastructure.
- User interface.
- Configuration.

Make business rules testable independently where practical.

## 20. Testing and Validation

Run checks appropriate to the change.

Use focused unit tests for financial calculations and domain rules.
Use integration tests for service boundaries and authorization.
Use browser checks for critical flows and visual behaviour.

Keep routine automated tests deterministic.
Use isolated test environments for necessary external-service checks.

Do not perform live payment tests against real customer accounts.

Prioritize:

- Access-tier enforcement.
- Per-companion entitlement isolation.
- Private media protection.
- Price calculations and rounding.
- Payment-event idempotency.
- Post and boost allowances.
- Booking conflicts.
- Cancellation and refund calculations.
- Account ownership.
- Reporting and blocking.
- Age-gate navigation.
- Deployment routes and assets.
- Accessibility and responsive layouts.

For visual work, inspect the rendered page where tools permit.

Check relevant loading, empty, validation-error, network-error,
and success states.

Do not write redundant tests for trivial presentation changes.

If tests fail:

- Identify whether the failure is caused by the change.
- Fix failures within scope.
- Report unrelated existing failures accurately.
- Do not claim all checks pass when they do not.

If verification cannot be performed, state what remains unverified.

## 21. Debugging and Recovery

Investigate evidence before changing code.

Where practical:

1. Reproduce the failure.
2. Inspect errors and relevant state.
3. Identify the root cause.
4. Apply the smallest justified correction.
5. Verify the fix.
6. Check relevant regressions.

If reproduction is unavailable, continue useful investigation and explain
the evidence limits.

Do not repeatedly retry the same failed approach without new evidence.

Ask for missing information only when it blocks further progress.

## 22. Observability

Use proportionate logging for nontrivial production behaviour.

Prioritize useful diagnostics for:

- Authentication failures.
- Authorization denials.
- Payment events.
- Booking transitions.
- Background jobs.
- Media processing.
- Administrative actions.

Record necessary identifiers and state changes without exposing sensitive
content.

Do not log private conversation contents or payment credentials.

Do not claim audit logging exists unless implemented.

## 23. Documentation and Progress

After meaningful completed work:

- Update docs/next_steps.md.
- Record material decisions in docs/decisions.md.
- Update affected product or architecture documents.
- Save approved visual choices in the relevant page brief.
- Update the repository map when structure changes.

Keep documentation concise and current.

Do not create a second roadmap or duplicate the same decision across
multiple files unnecessarily.

Do not use chat memory as the only record of project decisions.

## 24. Communication and Delivery

Be direct, clear, and specific.

For each completed implementation step report:

- What changed.
- Files affected.
- What was verified.
- Any material limitations.
- The next dependency or page.
- A suggested commit message when useful.

When direct editing is available, make authorized changes.
When Robbie must copy files manually, provide complete contents and paths.

Do not flood routine progress reports with the full framework pipeline.

Distinguish:

- Planned.
- Designed.
- Implemented.
- Tested.
- Integrated.
- Deployed.
- Ready for production.

Never equate one completed task with a finished platform.

## 25. Autonomy and Questions

Proceed autonomously with routine authorized engineering work.

Ask Robbie for:

- Unresolved visual decisions for a new page.
- Material business-rule choices.
- Financial-policy changes.
- Decisions involving cost or irreversible consequences.
- Information genuinely required to continue.

Do not repeatedly ask permission to perform work already requested.

Make reasonable reversible technical decisions within the approved
architecture and document material assumptions.

If one decision is blocked, continue independent work that does not
depend on it.

## 26. Final Rule

Build the agreed MeetDiscreet product.

Respect Robbie’s approved design.
Preserve the pricing and access model.
Keep detailed boundaries on their designated page.
Protect private information with real backend permissions.

Never fabricate completion, and never let framework ceremony substitute
for working, verified software.