# MeetDiscreet

MeetDiscreet is a marketplace for discovering companions, arranging
platonic dates, and sharing social experiences.

The platform combines public listings, detailed profiles, individual
companion subscriptions, private communication, booking requests,
and paid advertising features.

## Project Status

MeetDiscreet is in planning and development.

This README describes the intended product. It does not establish that
any feature, payment integration, or deployment is operational.

The repository now includes a local frontend discovery prototype: a 30-day
entrance age confirmation, portrait provider grid, compact ads view, working
demo filters, public companion profiles with labelled locked-content previews,
public Offering ad details linked to their companion profiles, and a How it works
page with separate reference plans and FAQs, plus an in-memory listing editor
with Offering/Looking For draft previews. Nothing entered in the editor is saved
or published. The Community Guidelines & Boundaries reader is accessible before
age confirmation and does not grant browsing access. A searchable Help page
explains the demo and links to existing features; live support/report submission
is not connected. Sign-in, registration, and recovery screens support fictional
form validation only; they do not create accounts or send emails. Profiles, generated photos, online statuses, and ads are fictional.
Accounts, payments, bookings, communication, and production deployment are not
connected. See [the roadmap](./docs/next_steps.md) for verification and limitations.

## Product Overview

Users can discover company for coffee, dinner, concerts, cultural outings,
celebrations, sightseeing, and other agreed social activities.

The platform has two main listing categories:

- **Looking For:** users describe an outing or experience they want
  company for.
- **Offering:** companions advertise their availability and experiences.

Companion profiles provide progressively deeper access through public,
registered-member, and individual-subscriber tiers.

The current release supports platonic companionship. Detailed content
boundaries belong on the dedicated Community Guidelines & Boundaries page.

## Core Features

### Discovery and Listings

- Location-based discovery.
- Activity and availability filters.
- Looking For user posts.
- Offering companion ads.
- Chronological listing order.
- Paid boosts and promoted placement.
- Optional listing thumbnails, colours, and framing.

### Companion Profiles

- Public introduction and profile picture.
- Member-only biography, interests, and preferences.
- Up to three additional photos for registered members.
- Further photos and uploaded videos for subscribers.
- Experience catalogues and optional add-ons.
- Rates and availability.
- Linked two-companion experiences.
- Public reviews from eligible completed bookings.
- Up to two profile presentations under one companion account.

### Communication

An active subscription to a specific companion unlocks:

- Direct messaging.
- Photo and video messages.
- Timestamps and read receipts.
- In-app audio calls.
- In-app video calls.
- Booking requests.

A subscription unlocks communication and booking access.
The booked experience is priced separately.

### Bookings

- Date, time, duration, and venue requests.
- Experience and add-on selection.
- Estimated pricing.
- Companion acceptance, rejection, or proposed revisions.
- Deposit collection.
- Booking confirmation and history.
- Cancellation, refund, and dispute handling.

### Account Management

- Free user registration and profile creation.
- Companion onboarding and profile editing.
- Publishing-plan management.
- Individual companion subscription management.
- Premium user membership.
- Listing and boost management.
- Billing history and receipts.
- Companion earnings and payout information.
- Privacy controls, blocking, and reporting.

### Administration

- Account and role management.
- Profile, listing, and media moderation.
- Report handling.
- Booking disputes.
- Payment reconciliation.
- Audit records.

## Pricing Model

Amounts below preserve the agreed product model.
Currency must be confirmed before live payments.

| Item | Price or allocation |
|---|---|
| User registration and profile | Free |
| Companion account and unpublished profile | Free |
| Individual companion subscription | $11.99/month per companion |
| Companion share of individual subscriptions | 75% |
| Platform share of individual subscriptions | 25% |
| Premium user membership | $5.99/month |
| Companion publishing — monthly | $19.99/month |
| Companion publishing — annual | $59.99/year |
| Additional Offering ad | $5.99 per 30 days |
| Additional boost | $1.99 |
| Near-top placement | $9.99 for 24 hours |
| Listing thumbnail upgrade | $2.99 |
| Listing colour and framing upgrade | $3.99 |

### Looking For Allowances

Proposed interpretation, pending confirmation:

- Free users: one active post.
- Premium users: up to three active posts.
- Premium includes two boosts per post per 30-day period.
- Posts expire after 30 days.
- Boosting does not extend expiry.

Premium user membership provides posting benefits only.
It does not replace individual companion subscriptions.

### Offering Allowances

An active companion publishing plan includes:

- One Offering ad.
- One included boost per 30-day period.

Each additional paid Offering ad includes one boost.

### Booking Deposit

The proposed model uses one deposit equal to 10% of the agreed
booking price, collected after companion acceptance.

The deposit is allocated as follows:

- Platform: 10% of the deposit.
- Companion: 90% of the deposit.

The deposit counts toward the total booking price.

For a $200 booking, the deposit is $20:
$2 allocated to the platform and $18 to the companion.

This interpretation requires confirmation because the original plan
described both a request fee and a deposit.

Processing costs, taxes, rounding, payout timing, remaining-balance
collection, and refund treatment must be defined before live payments.

## Access Model

| Access level | Main capabilities |
|---|---|
| Visitor | Browse public listings and public profile information |
| Registered member | View member-tier information and manage their profile |
| Premium user | Receive additional Looking For posting and boost benefits |
| Subscriber to a companion | Access that companion’s subscriber content, communication, and booking requests |
| Companion | Manage their own presentations, experiences, listings, availability, and bookings |
| Moderator | Review content and reports within assigned permissions |
| Administrator | Manage authorized platform operations and configuration |

Roles and subscriptions are separate concepts.

A subscription to one companion does not unlock another companion.
Premium membership does not unlock companion communication.

Restricted information and media must be protected by backend permissions,
not merely hidden in the interface.

## Design and Page Production

MeetDiscreet is built page by page with Robbie directing the visual design.

Before implementing a new page, Codex must:

1. Read the relevant product requirements and existing design decisions.
2. Ask a focused set of questions about the page’s appearance.
3. Carry forward approved global choices without asking them again.
4. Establish the layout, content hierarchy, actions, and mobile behaviour.
5. Implement the agreed page.
6. Validate it and incorporate review feedback.

Approved design choices take precedence over automatic design variation.

Do not redesign approved pages simply to make them more unusual.

Use reusable components and shared design tokens so the website remains
consistent as pages are added.

### Copy and Guidelines Placement

Keep ordinary pages focused on discovery, profiles, activities, and bookings.

Do not repeat lengthy adult-eligibility or platonic-service disclaimers
throughout the interface.

Consolidate detailed boundaries and prohibited conduct into one standalone
Community Guidelines & Boundaries page.

Keep concise, relevant pricing, renewal, cancellation, and acceptance
information at the point where users make those decisions.

### Entrance Age Gate

Show a concise age-confirmation gate before normal browsing.

It must:

- Provide an “I am 18 or older” action.
- Provide an exit action.
- Apply to direct page visits.
- Preserve the requested destination after confirmation.
- Support keyboard navigation and screen readers.
- Use an agreed confirmation-retention period.

Entrance confirmation is self-attestation.
It does not replace backend account eligibility or verification.

## Technical Direction

### Frontend

Preferred foundation:

- Semantic HTML.
- Modern CSS.
- JavaScript ES modules.
- Shared components.
- Responsive layouts.
- Accessible forms and controls.
- Minimal justified dependencies.

A lightweight build tool may be introduced when its benefits are clear.
A large frontend framework is not assumed.

### Backend

Production functionality requires services for:

- Authentication.
- Database storage.
- Authorization and subscription entitlements.
- Private media storage.
- Payment processing and payouts.
- Booking management.
- Messaging and realtime events.
- Audio/video call authorization.
- Moderation and administration.

Backend providers and runtime versions remain to be selected.

Do not implement production accounts, payments, or permissions using
browser storage alone.

### Source Control and Hosting

Development takes place in VS Code.
Source code is maintained in GitHub.

The intended workflow is:

Edit → Preview locally → Validate → Commit → Push → Deploy

Production hosting must support the application’s commercial use and
selected integrations.

GitHub Pages is not the production hosting target for this paid marketplace.

Local, preview, and production environments must have separate configuration.

Never commit secrets, private media, or real user data.

## Project Documentation

### Entry Point

- [AGENTS.md](./AGENTS.md): project-wide instructions.
  Present at the repository root.

### Product Documents — Present

- `docs/project_context.md`: project overview and constraints.
- `docs/product/product_spec.md`: complete product requirements.
- `docs/product/access_matrix.md`: roles and entitlements.
- `docs/product/pricing_and_payments.md`: financial rules.
- `docs/product/booking_lifecycle.md`: booking states and transitions.
- `docs/product/content_and_boundaries.md`: content and eligibility rules.
- `docs/next_steps.md`: roadmap and current progress.
- `docs/decisions.md`: confirmed decisions and open questions.

### Design Documents

- [Design System](./docs/design/design_system.md)
- [Design Memory](./docs/design/design_memory.md)
- `docs/design/page_inventory.md`.
- `docs/design/page_briefs/` — contains the brief template; individual page briefs will be added as pages are designed.

### Architecture Documents

- [Architecture Guidelines](./docs/architecture/architecture.md)
- [Environment](./docs/architecture/environment.md)
- [Repository Map](./docs/architecture/repo_map.md)
- `docs/architecture/application_architecture.md`.
- `docs/architecture/application_diagram.md`.
- `docs/architecture/data_model.md`.

### Development and Security

- [Developer Workflow](./docs/development/developer_workflow.md)
- [Code Style](./docs/development/code_style.md)
- [Guardrails](./docs/security/guardrails.md)
- `docs/security/application_security.md`.
- `docs/development/deployment.md`.
- `docs/development/launch_acceptance.md`.

Existing framework documents must be adapted where they conflict with
approved MeetDiscreet requirements.

## Development Method

MeetDiscreet uses the Codex Master workflow:

Route → Resolve → Execute → Validate → Measure → Improve → Recover

Apply the workflow proportionally to the task.

- **Route:** identify the task and its dependencies.
- **Resolve:** read relevant context and settle critical unknowns.
- **Execute:** implement the agreed scope.
- **Validate:** check functionality, permissions, and presentation.
- **Measure:** compare results with concrete acceptance criteria.
- **Improve:** address observed problems and review feedback.
- **Recover:** diagnose failures and preserve a reviewable recovery path.

Named stages do not establish that separate agents or automated
orchestration are running.

## Implementation Phases

1. Verify documentation and resolve decisions when required by dependent work; region, currency, and providers need not block independent frontend work.
2. Establish the repository, development setup, and design foundation.
3. Build the entrance gate and public discovery pages.
4. Implement accounts, onboarding, and access tiers.
5. Build companion profiles, presentations, media, and publishing.
6. Build listing editors, allowances, boosts, and advertising upgrades.
7. Integrate subscriptions, billing, and entitlements.
8. Implement booking requests, deposits, and payment lifecycle.
9. Implement messaging, notifications, and audio/video calls.
10. Build moderation, support, reviews, and administration.
11. Complete production validation and launch preparation.

Dependencies may require adjustments to this order.
Deferred features must remain visible in the roadmap.

## Validation Standards

Verify the behaviour relevant to each change.

Priority checks include:

- Responsive and accessible interfaces.
- Correct public, member, and subscriber access.
- Isolation between individual companion subscriptions.
- Private media protection.
- Server-side price calculations.
- Verified payment events.
- Duplicate-event handling.
- Post and boost allowance enforcement.
- Booking conflict prevention.
- Cancellation and refund calculations.
- Reporting and blocking without paid access.
- Working production routes and asset paths.

Separate these statuses:

- Designed.
- Implemented.
- Tested.
- Integrated.
- Ready for production.

A completed page does not establish that the entire product is launch-ready.

## Future Adaptability

Keep content categories, profile-field definitions, eligibility requirements,
and moderation policies separate from core marketplace logic.

The owner may later change the platform’s content scope.
Implement only the currently approved release.

Any future scope change requires reassessing the application requirements
and the suitability of hosting, payment, storage, and verification providers.

## Working With Codex

For a new development task:

1. Read the root `AGENTS.md`.
2. Read the current roadmap and relevant product documents.
3. Identify dependencies and unresolved decisions.
4. Ask visual questions if the page has not been designed.
5. Implement the authorized task.
6. Run appropriate checks.
7. Report completed work and remaining limitations.
8. Update project progress and material decisions.

When repository editing is available, apply changes directly.
When manual copying is required, provide complete files and exact paths.

Do not fabricate integrations, verification, test results, or deployment status.

## Local Setup

Use Node.js 24.22.1 and npm on macOS or the cloud environment.
From the repository root:

```sh
npm ci
npm run dev
```

Build with `npm run build`; serve that output with `npm run preview`.
For browser checks on a fresh Mac, run `npx playwright install chromium`, then
`npm test`. Cloud tests reuse system Chromium when available.
See [environment instructions](./docs/architecture/environment.md) for details.

No credentials or backend are needed for this prototype. Agrandir is the preferred
font; licensed webfont assets are pending, so a system fallback is used.
Backend, currency, payment policies, and hosting remain decisions for dependent work.

## Project Ownership

Robbie directs the product, visual design, and business decisions.

Codex assists with architecture, implementation, testing, documentation,
and maintenance within the approved scope.