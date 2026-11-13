# MeetDiscreet — Repository Orientation Guide

## 1. Purpose

This document explains how to navigate the MeetDiscreet repository,
locate relevant code, and choose the correct place for changes.

Read relevant repository files before modifying implementation.

This map describes the intended organization.
It does not establish that every listed directory or feature exists.

Inspect the actual repository before relying on a path.
Update this document as the approved structure is implemented.

Do not generate empty directories or speculative modules merely to
match this guide.

## 2. Starting Point

Before beginning a task:

1. Read the repository-root AGENTS.md.
2. Read README.md.
3. Read docs/project_context.md if present.
4. Read docs/next_steps.md if present.
5. Check docs/decisions.md for relevant decisions.
6. Inspect the current repository structure and Git status.
7. Read the documents and implementation relevant to the task.

Identify:

- The current phase.
- The requested page or feature.
- Existing implementation.
- Required dependencies.
- Unresolved decisions.
- Related tests.
- Unrelated changes that must be preserved.

Do not treat a planning document as evidence that a feature has
already been implemented.

## 3. Documentation Map

### Root Instructions

- AGENTS.md
  Project-wide engineering and collaboration instructions.

- README.md
  Product overview, development direction, and documentation entry point.

### Project Context

- docs/project_context.md
  Current product purpose, audience, constraints, and selected services.

- docs/next_steps.md
  Current phase, active tasks, completed work, and deferred requirements.

- docs/decisions.md
  Confirmed decisions and unresolved questions.

### Product Requirements

- docs/product/product_spec.md
  Authoritative functional requirements.

- docs/product/access_matrix.md
  Roles, ownership, visibility tiers, and subscription entitlements.

- docs/product/pricing_and_payments.md
  Prices, allowances, revenue allocations, renewals, and payment policies.

- docs/product/booking_lifecycle.md
  Booking states, revisions, acceptance, deposits, and cancellations.

- docs/product/content_and_boundaries.md
  Eligibility, content rules, age-gate requirements, and guidelines placement.

### Design

- docs/design/design_system.md
  Approved global visual rules and reusable component specifications.

- docs/design/design_memory.md
  Actionable feedback and lessons relevant to this project.

- docs/design/page_inventory.md
  Pages, audiences, dependencies, and implementation/review status.

- docs/design/page_briefs/
  Approved visual and behavioural requirements for individual pages.

### Architecture

- docs/architecture/architecture.md
  General engineering architecture guidelines.

- docs/architecture/application_architecture.md
  Actual MeetDiscreet architecture and service responsibilities.

- docs/architecture/application_diagram.md
  Application components and their connections.

- docs/architecture/environment.md
  Actual development, runtime, and deployment requirements.

- docs/architecture/data_model.md
  Entities, relationships, ownership, and data constraints.

- docs/architecture/repo_map.md
  This document.

### Security and Delivery

- docs/security/application_security.md
  Application threats, permissions, private media, and security controls.

- docs/development/deployment.md
  Setup, deployment, configuration, and rollback instructions.

- docs/development/launch_acceptance.md
  Evidence required before production launch.

Framework workflow documents remain under their existing
docs/workflow/, docs/strategy/, docs/development/, and docs/security/
locations.

Follow applicable project instructions when older framework defaults
conflict with approved MeetDiscreet decisions.

## Current Frontend Paths

- index.html: discovery shell and native age/filter/detail dialogs.
- src/main.js: age self-attestation, filtering, people/ads switching, public demo dialogs, and query-based profile navigation.
- src/profile.js: public companion profile, labelled restricted-content previews, and subscription explanation.
- src/offering.js: public Offering detail, provider navigation, and related Offering ads.
- src/how-it-works.js: user/companion journey explanation, reference plans, and FAQ disclosures.
- src/pricing.js: centralized reference amounts in minor units; not a payment authority.
- src/listing-editor.js: in-memory Offering/Looking For draft form, validation, and safe preview.
- src/guidelines.js: standalone pre-confirmation guidelines reader; no age or policy acceptance record.
- src/help.js: public searchable FAQ, topic filtering, help navigation, and accurate support integration limits.
- src/account.js: sign-in/registration/recovery layout validation using fictional data; no authentication or credential persistence.
- src/profile-editor.js: in-memory companion draft, validation, and owner-style audience previews; no persisted profile or access grant.
- src/draft-tools.js: shared navigation between implemented companion draft tools.
- src/experiences.js: in-memory experience catalogue, exact draft-amount parsing, and labelled audience previews; no billing authority.
- src/styles.css: shared tokens, portrait grid, single-column ads, responsive layout.
- src/data.js: synthetic public profile and ad fixtures; no live presence.
- public/images/demo-portraits.png: locally served AI-generated fictional portrait sheet.
- package.json, package-lock.json, .nvmrc: pinned npm/Vite development workflow.
- playwright.config.js, tests/discovery.spec.js, tests/profile.spec.js, tests/offering.spec.js: discovery/profile/Offering behaviour and layout checks.
- .gitignore: local secrets, dependencies, generated artifacts, and private-media paths.
- docs/design/page_briefs/discovery.md: current discovery/entrance brief.

This is a frontend prototype. Authentication, production authorization, payments,
bookings, messaging, private storage, and deployment are not implemented.

## 4. Proposed Application Layout

Use the following as an orientation target, subject to the approved
tooling and actual implementation.

| Location | Responsibility |
|---|---|
| Root HTML entry points or approved page-source directory | Page structure and entry points |
| assets/styles/ | Shared and page-specific CSS |
| assets/js/ | Browser-side JavaScript modules |
| assets/images/ | Public, repository-owned images |
| assets/icons/ | Public interface icons |
| assets/fonts/ | Approved self-hosted fonts, if used |
| backend/ | Trusted server-side application code |
| database/ | Schema migrations, policies, and synthetic seeds |
| tests/ | Automated verification |
| docs/ | Requirements, decisions, architecture, and design |
| scripts/ | Justified development and maintenance tools |
| Approved build-output directory | Generated deployment files, if a build is used |

Confirm the structure when the frontend tooling and backend provider
are selected.

If tooling requires a different layout, document the actual paths
rather than maintaining a fictional parallel structure.

Do not place uploaded user media in assets/ or elsewhere in Git.

## 5. Page Entry Points

Use docs/design/page_inventory.md to track the actual page URLs
and source files.

Expected page groups include:

### Public

- Homepage and discovery.
- Looking For listings and post detail.
- Offering listings and ad detail.
- Companion profiles.
- Pricing and how it works.
- Community Guidelines & Boundaries.
- Help and contact.
- Terms and Privacy.
- Payment and cancellation information.
- Not-found page.

### Authentication

- Registration.
- Sign-in.
- Email confirmation.
- Password reset.
- User and companion onboarding.

### User Workspace

- Dashboard.
- Profile editor.
- Subscriptions.
- Premium membership.
- Looking For editor and post management.
- Messages and calls.
- Booking requests and booking history.
- Billing.
- Settings, privacy, and blocked accounts.

### Companion Workspace

- Dashboard.
- Profile and presentation editor.
- Media management.
- Experience and rate editor.
- Availability.
- Publishing plan.
- Offering editor and ad management.
- Booking inbox.
- Earnings and payouts.

### Administration

- Account management.
- Content review.
- Reports.
- Booking disputes.
- Payment reconciliation.
- Audit records.

These are feature groups, not a requirement to create one HTML file
for every item.

Use pages, tabs, dialogs, or drawers according to approved design decisions.

## 6. Frontend Styles

Suggested organization within assets/styles/:

- tokens.css
  Shared colours, typography, spacing, radii, and other design tokens.

- base.css
  Document defaults, typography, and basic element styles.

- layout.css
  Shared page containers, navigation regions, and responsive layout rules.

- components/
  Reusable buttons, forms, cards, listings, dialogs, and other components.

- pages/
  Styles specific to individual pages.

Adapt filenames to the actual implementation.

Before adding styles:

1. Inspect the design system.
2. Search existing tokens.
3. Look for an existing component.
4. Check desktop and mobile usage.
5. Add page-specific rules only when the behaviour is genuinely local.

Do not copy independent versions of navigation, button, or card styles
into every page.

Do not change shared tokens to fix one page without checking the impact
on other approved pages.

## 7. Browser JavaScript

Suggested organization within assets/js/:

### components/

Reusable interface behaviour:

- Navigation.
- Dialogs.
- Tabs.
- Filters.
- Form controls.
- Listing cards.
- Media viewers.

### pages/

Page initialization and page-specific interaction.

Page modules coordinate components and API calls.
They must not become the authority for financial or permission rules.

### api/

Browser clients for approved backend services.

Responsibilities include:

- Making requests.
- Handling responses.
- Normalizing errors.
- Managing request cancellation where appropriate.

Never place server secrets in browser API modules.

### auth/

Browser session integration and authentication-related interface behaviour.

Frontend authentication state supports the interface.
The backend still validates authorization.

### features/

Feature-specific browser modules where their complexity justifies
separate organization.

Examples:

- Discovery.
- Profiles.
- Listings.
- Bookings.
- Messaging.
- Calls.
- Billing.

### utils/

Small shared utilities with demonstrated reuse.

Avoid turning this directory into a collection of unrelated business logic.

### config/

Browser-public configuration only.

Do not store payment secrets, service-role credentials, or other
server-only values here.

## 8. Shared Interface Behaviour

Locate or create one reusable implementation for:

- Navigation.
- Footer.
- Entrance age gate.
- Dialog management.
- Toasts and feedback.
- Form validation presentation.
- Loading states.
- Currency display.
- Time-zone display.
- Subscription prompts.
- Media access presentation.

The implementation method depends on the selected tooling.

Do not assume that duplicating HTML across pages is the only way
to retain an understandable multipage application.

Do not put protected content into the page merely to hide it with CSS
or JavaScript.

## 9. Backend Organization

Actual paths depend on the selected provider.

Keep these responsibilities identifiable:

### Domain Rules

- Pricing.
- Revenue allocations.
- Subscription entitlements.
- Publishing rules.
- Post allowances.
- Boost allowances.
- Booking transitions.
- Cancellation calculations.

Keep these rules explicit and testable.

### Request Handlers

- Authenticated API entry points.
- Input validation.
- Authorization.
- Calling domain logic.
- Returning appropriate responses.

### Service Integrations

- Payment provider.
- Storage provider.
- Notifications.
- Realtime messaging.
- Calling infrastructure.

### Webhooks

- Signature verification.
- Event validation.
- Duplicate-event handling.
- Subscription/payment reconciliation.

### Background Work

- Post expiry.
- Reservation expiry.
- Notifications.
- Media processing.
- Reconciliation.
- Other approved scheduled jobs.

Documentation about a workflow does not implement a background job.
Verify that the required runtime scheduling exists.

## 10. Database Organization

Use database/ or the selected provider’s required equivalent.

Keep identifiable locations for:

- Schema migrations.
- Ownership and access policies.
- Indexes and constraints.
- Database functions where used.
- Synthetic development seeds.

Separate migration history from illustrative data-model documentation.

Do not edit production data as a substitute for a reproducible migration.

Never seed development environments with copied private customer data.

Permission-sensitive changes require inspection of both the application
code and the database policies or equivalent authorization mechanism.

## 11. Feature Lookup Guide

| Task | Inspect first | Likely implementation areas |
|---|---|---|
| Homepage or discovery layout | Design system and page brief | HTML entry point, page CSS, discovery modules |
| Listing editor | Product specification and pricing rules | Editor page, forms, listing API, allowance enforcement |
| Companion profile | Access matrix and presentation rules | Profile page, media client, profile API, data policies |
| Subscription gate | Access matrix and payment rules | Entitlement service, backend authorization, frontend state |
| Publishing plan | Pricing and publishing decisions | Billing integration, publishing status, listing visibility |
| Booking request | Booking lifecycle and pricing | Booking UI, domain rules, availability, database constraints |
| Deposit calculation | Payment specification | Backend pricing, payment integration, financial tests |
| Boost | Listing allowances and placement rules | Listing UI, backend counters, ordering logic |
| Messaging | Access matrix and communication rules | Conversation UI, realtime authorization, attachments |
| Audio/video call | Architecture and environment | Call interface, signaling, credentials, provider integration |
| Refund or cancellation | Payment and booking policies | Domain calculations, payment API, reconciliation |
| Review | Review eligibility rules | Booking linkage, review API, moderation |
| Report or block | Access matrix and moderation rules | Shared controls, backend enforcement, admin workspace |
| Deployment failure | Environment and deployment guide | Build configuration, paths, hosting, service configuration |

Verify actual filenames before making changes.

## 12. Design Questions and Page Briefs

Before implementing a previously undesigned page:

1. Locate its entry in the page inventory.
2. Read existing global design decisions.
3. Ask Robbie the unresolved visual questions.
4. Record the agreed design in its page brief.
5. Implement against that brief.

A page brief should record:

- Page purpose.
- Audience and access tier.
- Layout.
- Content hierarchy.
- Primary and secondary actions.
- Shared components.
- Desktop behaviour.
- Mobile behaviour.
- Loading, empty, and error states.
- Review status.
- Relevant references.

Do not treat framework design variation rules as permission to replace
Robbie’s approved choices.

## 13. Guidelines and Age-Gate Placement

Keep detailed eligibility and content boundaries on the designated
Community Guidelines & Boundaries page.

Before adding warning text elsewhere, check whether it duplicates
that page.

Keep concise transaction-specific information at the relevant action.

The entrance gate should use shared behaviour across applicable
page entry points.

Check direct navigation, refreshes, and intended-destination handling
when modifying the gate.

Do not confuse entrance confirmation with backend access authorization.

## 14. Finding Relevant Code

Before writing a new implementation:

1. Search for the feature name.
2. Search related UI labels and API endpoints.
3. Inspect imports and callers.
4. Look for shared components and utilities.
5. Inspect relevant tests.
6. Read the underlying product rule.

Prefer existing patterns when they meet the requirement.

Do not duplicate a function merely because its name differs from
the requested feature.

If existing logic is unsuitable, explain why before replacing or
extending it.

## 15. Avoiding Duplicate Sources of Truth

Keep one authoritative implementation for:

- Price definitions.
- Financial calculations.
- Entitlement checks.
- Publishing requirements.
- Post and boost allowances.
- Booking transitions.
- Refund calculations.

The browser may display or preview these rules.
The backend must enforce authoritative outcomes.

Frontend estimates must be reconciled with server calculations.

Do not independently hardcode the same business rule in multiple
page modules.

Avoid competing documentation for the same requirement.

## 16. Dependency Awareness

Before changing a shared module, identify:

- Importing modules.
- Affected page entry points.
- Backend consumers.
- API response contracts.
- Database dependencies.
- Related tests.
- Design components affected.

Pay particular attention to:

- Shared navigation changes.
- Profile field changes across both presentations.
- Entitlements used by media, messaging, and bookings.
- Pricing used in quotes, checkout, receipts, and earnings.
- Blocking used by discovery, messages, and calls.

Update affected consumers together when an intentional contract
change is required.

## 17. Test Discovery

Inspect tests/ and any provider-specific test locations.

Expected test groups may include:

- Unit tests.
- Integration tests.
- Browser tests.

Locate tests for the actual changed behaviour rather than assuming
all tests belong in one directory.

For critical features, inspect coverage of:

- Ownership checks.
- Subscriber isolation.
- Private media.
- Post and boost limits.
- Financial calculations.
- Duplicate payment events.
- Booking conflicts.
- Cancellation outcomes.
- Reporting and blocking.

For page changes, inspect the rendered interface at relevant widths
and verify critical interactions.

Do not create empty test suites to satisfy the proposed structure.

## 18. Modification Discipline

Make changes in the layer that owns the responsibility.

| Change | Appropriate layer |
|---|---|
| Colours, spacing, typography | Shared tokens or relevant styles |
| Page content order | Page structure or template |
| Reusable interface behaviour | Shared frontend component |
| Page-specific interaction | Page module |
| Authoritative business calculation | Backend domain logic |
| External service request | Integration module |
| Authorization | Backend permission boundary |
| Data constraints | Database schema or policies |
| Payment event processing | Webhook and payment services |
| Deployment behaviour | Deployment configuration |

Do not fix backend permission failures by hiding interface controls.

Do not fix a page-specific issue by changing global behaviour without
checking other pages.

Do not refactor unrelated areas while implementing a focused task.

## 19. Documentation Updates

Update this map when:

- A directory is introduced or renamed.
- Entry points move.
- A provider imposes a different layout.
- Shared responsibilities move between modules.
- Build or deployment structure changes.

Record implemented paths accurately.

Keep proposed structure distinct from existing structure.

Update the page inventory when pages are added, consolidated, or removed.

Update the roadmap and decision log for meaningful progress and decisions.

## 20. Final Verification

Before completing a change, confirm:

- The correct files and responsibility layers were modified.
- Existing utilities were considered.
- No duplicate business rule was introduced.
- Shared consumers remain compatible.
- Access restrictions remain enforced.
- Relevant checks were performed.
- Desktop and mobile behaviour were checked where applicable.
- Documentation reflects material structural changes.
- Unrelated user changes remain intact.

Report checks that could not be completed.

A directory, document, or interface control is not evidence that its
underlying feature is operational.

## Development Backend Increment

- `src/backend/`: public configuration validation, official Supabase SDK client,
  authentication callback handling, private draft repository and UI controls.
- `supabase/migrations/`: versioned owner-only PostgreSQL draft schema and RLS.
- `tests/backend-security.spec.js`: migration/grants/RLS checks in PGlite.
- `backend-tests/` and `playwright.backend.config.js`: mocked-provider browser checks.
- `.env.example`, `vite.config.js`, `public/_headers`: public configuration template,
  build validation and hosted browser security headers.
- [Backend setup](../development/backend-setup.md): activation and live validation.

- `src/account-overview.js`: verified development-session workspace and draft-tool
  navigation, with signed-out and backend-disabled states.

- `src/draft-amount.js`: pure exact decimal parser for currency-pending draft amounts.
- `supabase/migrations/202611090001_experience_drafts.sql`: private catalogue snapshot
  validation, grants and owner policies; apply separately after the first migration.

- `src/account-security.js`: verified email-account password changes with current
  password reauthentication, credential clearing, and recovery navigation.

- `src/draft-changes.js`: in-memory private draft snapshots and browser unload
  protection, with race-aware save baselines and identity reset handling.

- `src/listing-library.js`: private saved-listing search/filter workspace and
  owner-scoped editor links. Selected draft URLs load through `src/backend/drafts.js`.

- `src/availability.js`: in-memory weekly availability editor and preview.
- `src/weekly-schedule.js`: pure weekday ordering, IANA zone validation and
  same-day window validation; not an authoritative booking scheduler.

- `supabase/migrations/202611090002_availability_drafts.sql`: owner-only weekly
  sketch storage with zone/window/overlap validation; requires later hosted setup.

- `src/provider-setup.js`: guided private provider-draft onboarding; User/Provider
  intent is stored in Auth user metadata, separate from authoritative roles.

- `src/user-setup.js`: separate User starting page linking discovery and private
  Looking For draft tools, with same-login provider setup navigation.

- `src/user-profile-editor.js`: separate private User introduction/editor/preview.
- `supabase/migrations/202611090003_user_profile_drafts.sql`: owner-only User draft
  schema and declaration/non-disclosure constraints; later hosted setup required.

- `src/booking-draft.js`: unsent fictional plan composer/review with explicit owner-only private draft save/load/delete.
- `src/booking-draft-rules.js`: UI calendar/time/zone/duration-format validation,
  separate from future authoritative scheduling and pricing services.

- `src/backend/permissions.js`: verified current-user role reads from trusted rows.
- `src/account-permissions.js`: assigned-role status and retry, separate from intent.
- `supabase/migrations/202611090004_account_roles.sql`: protected roles, basic-user
  initialization, invoker role checks and restricted role-change event storage.

- `src/provider-application.js`: private intake form and stateful save/submit/withdraw.
- `src/backend/provider-applications.js`: verified actor-bound application reads/RPCs.
- `supabase/migrations/202611090005_provider_applications.sql`: owner-only intake,
  protected transitions and status history, with no automatic role assignment.

- `src/provider-review.js`: scoped intake queue, introduction inspection and version-bound request-changes form.
- `src/backend/provider-review.js`: reviewer binding and reauthorized review RPCs.
- `supabase/migrations/202611090006_provider_review_queue.sql`: explicit review
  capabilities, bounded submitted-intake reads and protected access audit metadata.

- `supabase/migrations/202611090007_provider_submission_feedback.sql`: submission snapshots, private feedback and separately scoped version-bound changes requests.

- `src/provider-application-history.js`: on-demand owner submission snapshots with version-matched feedback, bounded reads and stale-response clearing.

- `src/provider-application-activity.js`: explicit owner-only recent status timeline using existing application event reads.

- `src/backend/booking-plans.js`: actor-bound private planning draft operations.
- `supabase/migrations/202611090008_booking_plan_drafts.sql`: bounded partial plan storage with owner CRUD RLS; no booking authority.

- `src/account-sessions.js`: reauthenticated, confirmed revocation of other session refresh capability with error-preserving user-JWT logout.

- `src/account-email.js`: password-confirmed current/pending email changes through the existing Auth callback and shared security-operation lock.

- `src/looking-for.js`: dedicated public-card-only Looking For summary renderer, sharing the ad query route/container with Offering details and preserving own-draft navigation.

- `src/draft-backup.js`: gated, verified-account selection and explicit JSON reference download with stale-view guards and short-lived Blob URL.
- `src/backend/draft-backup.js`: allowlisted owner draft reads, projected fields, count/completeness checks and actor revalidation; no application or Auth object export.

- `supabase/migrations/202611100001_provider_application_approval.sql`: Admin-only explicit-scope, version-bound pilot approval with atomic additive Provider membership and protected approval records.

- `src/provider-approval-history.js`: explicit, paginated own-approval metadata panel within the staff queue, with separate stale-response guards and no cached records.
- `supabase/migrations/202611100002_provider_approval_history.sql`: current-scope actor-only history RPC, reviewer index and protected access-event action; no role grants.

- `supabase/migrations/202611100003_provider_review_search.sql`: bounded actor-bound pending name/city search and protected read-event action; original list RPC preserved.

- `src/provider-application-status.js`: shared owner-only application summary and refresh/action labels for account overview and Provider setup; no private introduction reads or role inference.

- Listing library uses `listListingDraftSummaries` in `src/backend/drafts.js` for bounded, count-checked owner card metadata; editor full-draft reads remain separate.

- `src/saved-public-profile-preview.js`: explicit private saved-field review in Provider setup, with missing-field guidance, refresh/error states and text-only content rendering.
- `src/backend/public-profile-preview.js`: owner-bound projection of saved public draft fields, with post-read actor verification; no member fields or publishing mutation.

- `src/profile-submission.js` / `src/backend/profile-submissions.js`: explicit owner-only check, version-bound private submit and confirmed withdrawal; no staff/public operations.
- `supabase/migrations/202611100004_private_profile_submissions.sql`: protected immutable public-field candidates, one pending owner copy, source/role checks and owner withdrawal.

- `src/profile-submission-history.js`: explicit owner history of retained private profile copies, keyset pages, viewer-local timestamps and expandable allowlisted fields; shared field renderer for the pending-copy panel.

- `src/messages-preview.js`: age-gated synthetic inbox/conversation UI with view-local composer drafts and preview bubbles; no messaging API, persistence or entitlement authority.

- `src/photo-preview.js`: device-local test image validation, main-image/order preview and Blob URL lifecycle cleanup; no upload, saved profile mutation or persistence.

- `src/profile-review.js` / `src/backend/profile-review.js`: independently scoped pending-copy inspection UI/RPC client, with keyset pages, immutable public-field detail and stale-response cleanup.
- `supabase/migrations/202611100005_profile_publication_review.sql`: new explicit read-capability name, curated pending list/detail RPCs, protected read metadata and query indexes; no publication decisions/grants.

- `supabase/migrations/202611130001_profile_review_search.sql`: bounded, actor-bound literal search of pending profile-copy names/cities with metadata-only read events; default list RPC preserved.
