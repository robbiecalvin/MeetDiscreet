# MeetDiscreet — Roadmap and Next Steps

## 1. Purpose

Track the current phase, implementation progress, review status,
dependencies, and next actions for MeetDiscreet.

This is the authoritative roadmap.

Do not maintain a competing task list elsewhere.

Detailed requirements, design decisions, and financial rules belong
in their dedicated documents.

## 2. Current Position

Current phase: Phase 1 — Local frontend foundation, with the first Phase 2 discovery prototype.

Current activity:
Discovery, public companion profiles, and Offering ad details implemented. Routine visual choices are provisional under Robbie’s request to keep building and revise later.

Known status:

- Product name selected: MeetDiscreet.
- Current release defined as a platonic social companion marketplace.
- Page-by-page visual collaboration established.
- All 49 existing Markdown documents verified present; task-relevant contents reviewed selectively.
- Relative documentation links and inherited framework conflicts corrected.
- .gitignore added before tooling.
- Vanilla frontend, npm/Vite workflow, package lockfile, runtime pin, and Playwright tests added.
- Initial dark/elegant visual direction and discovery grid recorded in DEC-014.
- Synthetic profiles, generated portraits, online statuses, city filters, and ads only.
- No backend, accounts, messages, bookings, payments, or deployment connected.

Do not mark documents as installed merely because their contents
were supplied in chat.

## 3. Immediate Next Action

Review the first discovery prototype against [the page brief](./design/page_briefs/discovery.md).
Refine the visual layout from Robbie’s feedback and provide licensed Agrandir
webfont assets when available. macOS Safari validation remains outstanding.

Backend, live currency, payment policy, and hosting choices remain open until
their dependent work is needed. Do not expand the prototype into the entire
application or introduce live transactions or production deployment.

## 4. Documentation Preparation

Status definitions:

- Present: file or directory exists in the checkout.
- Contents reviewed: relevant sections inspected for the current task.
- Repository verified: actual files checked rather than inferred from chat.
- Approved: explicitly accepted by Robbie.

These statuses are independent.

### Existing Project Documents

| Path | Approval status | Repository status |
|---|---|---|
| docs/architecture/application_architecture.md | Unchanged by cleanup | Presence verified |
| docs/architecture/application_diagram.md | Unchanged by cleanup | Presence verified |
| docs/project_context.md | Unchanged by cleanup | Presence verified |
| docs/next_steps.md | Unchanged by cleanup | Presence verified |
| docs/product/product_spec.md | Unchanged by cleanup | Presence verified |
| docs/product/access_matrix.md | Unchanged by cleanup | Presence verified |
| docs/product/pricing_and_payments.md | Unchanged by cleanup | Presence verified |
| docs/product/booking_lifecycle.md | Unchanged by cleanup | Presence verified |
| docs/product/content_and_boundaries.md | Unchanged by cleanup | Presence verified |
| docs/design/page_inventory.md | Unchanged by cleanup | Presence verified |
| docs/design/page_briefs/ | Unchanged by cleanup | Presence verified |
| docs/decisions.md | Unchanged by cleanup | Presence verified |
| docs/architecture/data_model.md | Unchanged by cleanup | Presence verified |
| docs/security/application_security.md | Unchanged by cleanup | Presence verified |
| docs/development/deployment.md | Unchanged by cleanup | Presence verified |
| docs/development/launch_acceptance.md | Unchanged by cleanup | Presence verified |

Create individual page briefs when their pages enter design.
A directory alone is not a completed deliverable.

### Existing Project Guidance

- Root README.md.
- Root AGENTS.md.
- docs/architecture/environment.md.
- docs/architecture/repo_map.md.
- docs/design/design_system.md.
- docs/design/design_memory.md.
- docs/development/developer_workflow.md.
- docs/workflow/state_manager.md.
- docs/workflow/task_template.md.
- docs/development/code_style.md.

These files are present in the checkout. Existence and consistency review do not imply approval, implementation, testing, or deployment.

Refresh this inventory when the repository structure changes.

## 5. Status Tracking

For meaningful work, distinguish:

### Implementation

- Not started.
- In progress.
- Implemented.

### Verification

- Not checked.
- Partially checked.
- Passed relevant checks.
- Failed.
- Blocked.

### Visual Review

- Not requested.
- Awaiting review.
- Changes requested.
- Approved.

### Integration

- Not connected.
- Synthetic demo.
- Test-mode integration.
- Live integration.

### Delivery

- Local only.
- Committed.
- Pushed.
- Deployed to preview.
- Deployed to production.
- Failed deployment.

Use only the dimensions relevant to the task.

Never infer production readiness from a completed layout.

## 6. Phase 0 — Definition and Feasibility

Status: In progress.

### Outcomes

- Project documents prepared and installed.
- Requirements distinguished from proposals.
- Foundational decisions recorded.
- Service feasibility understood.

### Required Work

- Documentation set verified present; relative links corrected.
- Inherited framework guidance aligned with root instructions.
- Local workflow and initial page-design decisions recorded in DEC-014.
- Continue resolving remaining foundational decisions only before dependent work.
- Confirm launch region and currency.
- Confirm initial account and companion model.
- Select a suitable development and hosting direction.
- Assess payment-provider suitability for the actual product.
- Record unresolved commercial rules.

### Decisions Needed Before Dependent Work

- Backend and hosting selection before infrastructure integration.
- Currency and payment rules before live checkout.
- Initial visual direction before page styling.
- Deposit interpretation before booking-payment implementation.

### Acceptance

Relevant files are present and internally consistent.
Open questions are explicit.
No selected provider is falsely described as configured.

### Deployable Result

Documentation only.
No production functionality implied.

## 7. Phase 1 — Repository and Design Foundation

Status: Frontend foundation implemented and validated in Linux Chromium; visual review and macOS verification pending.

Dependencies: Only decisions needed for the chosen local workflow and first page. Backend and production-provider choices do not gate this frontend foundation.

### Deliverables

- Understandable application structure.
- Verified local preview process.
- Selected runtime/tooling configuration.
- Shared design tokens.
- Reusable navigation and footer foundation.
- Environment configuration templates.
- Relevant automated checks.
- Deployment configuration where selected.

### Visual Process

Ask only the initial shared questions needed to start:

- Colour direction.
- Typography.
- Navigation.
- Content density.
- Brand assets.
- Mobile priorities.

Provisional decisions are permitted when Robbie delegates them.

### Acceptance

The project runs through documented commands.
Shared components render.
Secrets are excluded.
The initial frontend can be reviewed.

### Deployable Result

A frontend foundation in an appropriate preview environment.
No real accounts or payments unless separately implemented.

## 8. Phase 2 — Entrance and Public Discovery

Status: Initial entrance/discovery prototype implemented. Remaining public pages are not started; legal/profile/ad details are limited demo dialogs.

Dependencies: Shared foundation and relevant page briefs.

### Deliverables

- Entrance age gate.
- Homepage/discovery.
- Looking For results.
- Offering results.
- Listing detail pages.
- Public companion profile presentation.
- Community Guidelines & Boundaries page.
- Essential navigation and not-found handling.

### Requirements

- Ask visual questions before each undesigned page.
- Preserve direct-link destinations through the entrance gate.
- Use clearly identified synthetic fixtures until data is connected.
- Keep restricted information out of public responses.
- Avoid repeated disclaimer sections.

### Acceptance

Public navigation and filters behave as implemented.
Responsive layouts are inspected.
Age-gate behaviour is checked.
Demo content is not presented as real marketplace activity.

### Deployable Result

A clearly scoped public prototype or preview.
Not a working paid marketplace.

## 9. Phase 3 — Accounts and Access Boundaries

Status: Not started.

Dependencies: Selected backend, data model, and access rules.

### Deliverables

- Registration and sign-in.
- Confirmation and recovery flows where applicable.
- Onboarding.
- Roles and ownership.
- Account settings.
- Member-tier access.
- Backend permissions.
- Initial administrator access controls.

### Acceptance

Ownership and role checks are verified.
Unauthorized requests are rejected.
Authentication works across configured environments.

### Deployable Result

An account-enabled test environment.

Public account collection requires appropriate operational
and privacy readiness.

## 10. Phase 4 — Companion Profiles and Publishing

Status: Not started.

Dependencies: Accounts, storage, and profile requirements.

### Deliverables

- Profile editor.
- Up to two companion presentations.
- Media management.
- Experience and rate editor.
- Availability.
- Publishing eligibility.
- Companion dashboard.
- Profile preview and visibility controls.

### Acceptance

Owners can manage their own information.
Visibility tiers are enforced.
Private originals remain protected.
Presentation ownership is consistent.

### Deployable Result

Profile-management functionality in a test environment.

Paid publishing requires Phase 6 payment integration.

## 11. Phase 5 — Classifieds and Advertising

Status: Not started.

Dependencies: Accounts, publishing rules, and listing specifications.

### Deliverables

- Looking For editor.
- Offering editor.
- Draft and preview states.
- Post management.
- Expiry.
- Posting allowances.
- Boost allowances.
- Advertising upgrade interfaces.
- Sponsored-placement ordering.

### Acceptance

Allowances cannot be bypassed through direct requests.
Drafts remain unpublished.
Expiry and boosts follow confirmed rules.
Public ads expose only public information.

### Deployable Result

Listing-management functionality.

Paid upgrades remain test-only until payment integration is verified.

## 12. Phase 6 — Subscriptions and Billing

Status: Not started.

Dependencies: Provider suitability, currency, and confirmed financial rules.

### Deliverables

- Companion publishing payments.
- Individual companion subscriptions.
- User premium membership.
- Advertising purchases.
- Verified payment events.
- Entitlement updates.
- Billing history.
- Cancellation and renewal handling.
- Revenue-allocation records.
- Reconciliation.

### Acceptance

- Correct product and account receive entitlements.
- Companion subscriptions remain isolated.
- Failed payments do not grant access.
- Duplicate events do not duplicate allocations.
- Confirmed expiry and refund rules work.
- Browser-edited prices are rejected.

### Deployable Result

A verified test-mode commercial flow.

Live charging requires operational readiness and explicit release scope.

## 13. Phase 7 — Booking and Deposit Lifecycle

Status: Not started.

Dependencies: Confirmed booking policies, availability, and payments.

### Deliverables

- Booking request form.
- Price estimate.
- Companion review.
- Revisions and acceptance.
- Accepted price snapshots.
- Reservation handling.
- Deposit payment.
- Confirmation.
- Booking history.
- Cancellation and refund workflows.
- Remaining-balance handling.

### Acceptance

Concurrent requests cannot violate booking constraints.
Material changes require acceptance.
Payment and booking states remain distinct.
Late payments and expired reservations have defined outcomes.

### Deployable Result

A testable booking flow.

No live booking payments before required policies and operations are ready.

## 14. Phase 8 — Messaging and Calls

Status: Not started.

Dependencies: Entitlements, private storage, and selected infrastructure.

### Deliverables

- Conversations.
- Text messages.
- Photo/video attachments.
- Read receipts.
- Realtime updates.
- Notification preferences.
- Audio calls.
- Video calls.
- Relevant connection and permission states.

### Acceptance

Membership, subscriptions, and blocks are enforced.
Attachments remain private.
Missed updates can be recovered.
Calling works in the tested browser matrix.
Recording is not enabled by default.

### Deployable Result

Communication features in the verified environment.

Do not describe decorative controls as implemented communication.

## 15. Phase 9 — Reviews and Operations

Status: Not started.

Dependencies: Accounts and relevant transaction records.

### Deliverables

- Booking-linked reviews.
- Reporting.
- Blocking.
- Moderation queue.
- Content and account actions.
- Dispute workflows.
- Earnings and payout visibility.
- Audit records.
- Support tools.

### Acceptance

Review eligibility is enforced.
Operational permissions are limited appropriately.
Reports do not automatically establish misconduct.
Financial and moderation actions are auditable.

### Dependency Note

Basic reporting, blocking, and moderation must be available before
affected features are opened to real users.

Do not postpone essential protections merely because their full
administration interface appears in this phase.

### Deployable Result

Operational workflows supporting the approved release.

## 16. Phase 10 — Production Readiness

Status: Not started.

Dependencies: A defined launch scope and completed prerequisite work.

### Deliverables

- Launch acceptance review.
- End-to-end permission checks.
- Payment reconciliation checks.
- Browser and device verification.
- Accessibility review.
- Performance checks.
- Monitoring and alerting.
- Backup and recovery verification.
- Production configuration review.
- Support and incident procedures.
- Deployment and rollback verification.

### Acceptance

All launch-blocking requirements for the selected release are satisfied
with recorded evidence.

Unresolved limitations are explicit.
Robbie controls the release decision.

### Deployable Result

Only the verified and authorized production release.

## 17. Dependency and Scope Rules

Phase order may change when dependencies justify it.

Do not:

- Silently remove difficult features.
- Enable live transactions before required policies exist.
- Expose communication without relevant blocking and reporting.
- Assume frontend completion establishes backend readiness.
- Build every page before obtaining visual direction.

If launch scope is reduced:

1. Obtain an explicit scope decision.
2. Record deferred features.
3. Keep them visible in the roadmap.
4. Remove misleading interface claims.
5. Verify the resulting release as a coherent product.

## 18. Current Work Snapshot

- Objective: How it works and reference plans integrated with discovery/profile/Offering navigation.
- Completed: Pinned Node/npm/Vite workflow; age gate; default portrait grid with three columns on mobile; bottom people/ads switch; one-column ad cards; city, search, online, and interest filters; empty reset; limited public demo dialogs.
- Visual direction: #121521 / #38476b / #b6192e, Agrandir preferred, bold headings and thin body text. Licensed font assets absent; system fallback currently used.
- Gate: 30-day browser confirmation; external referrer exit with Google fallback. No role or account privileges are granted.
- Data: Fictional profile/online/ad fixtures and AI-generated portraits. No live location or backend integration.
- Delivery: Discovery source was pushed to GitHub; Robbie supplied a Netlify Published screenshot for commit d6c121f at https://jade-chebakia-c21282.netlify.app/. Profile increment prepared for the same GitHub-connected demo deployment; no live financial services.

### Public Profile Increment

- Public profile route `/?profile=<id>` opens from provider cards and supports refresh and direct visits through the entrance gate.
- Full-width photo region above details; section order matches DEC-015. Desktop uses the existing portrait with a softened photo backdrop to preserve the whole face; mobile fills the photo region.
- Member/subscriber preview labels contain no protected profile data or media.
- General rates and availability use honest empty states rather than invented prices/dates.
- Subscribe action explains the $11.99/month reference model and pending terms; no charge, access, account, or booking is created.
- Fixed subscription action on mobile; browser back/forward and explicit return preserve in-app discovery filters and focus.
- Build and 20 Chromium checks pass, including all discovery regressions and nine profile/navigation/access-label/responsive checks. Desktop and mobile screenshots inspected.
- Visual direction selected; rendered profile awaits Robbie’s review. Safari and Agrandir remain unverified.

### Offering Detail Increment

- PUB-05 at `/?ad=<offering-id>`: compact provider header, title, public description, general location, rate/availability empty states, and companion-profile action fixed on mobile.
- Offering titles and View ad navigate to details; same-city related ads navigate correctly. Profile links include a return-to-ad path.
- Direct/refresh/age-gated URLs, filtered-list return, keyboard focus, browser history, wrong-category and missing-ad recovery covered.
- No changes to member/subscriber access or financial rules. Looking For remains a limited preview pending full-post visibility policy.
- Build and 31 Chromium tests passed (20 discovery/profile regressions plus 11 Offering tests). Desktop/mobile screenshots inspected.
- GitHub source update prepared for the existing Netlify-connected demo site. No live deployment verification; environment policy blocks Netlify access.

### How It Works Increment

- PUB-08 at `/?page=how-it-works`, available in desktop navigation and mobile footer.
- Working user/companion journey switch, distinct reference-plan cards, native keyboard-operable FAQs, and discovery return links.
- Reference prices centralized in src/pricing.js and reused by profile and explanation: subscription $11.99/month, Premium $5.99/month, publishing $19.99/month or $59.99/twelve months. No currency, renewal, cancellation, or tax decision inferred.
- No purchase actions or fake account/booking functionality. Pending deposit and allowance interpretations remain unconfirmed.
- Vite build and 40 Chromium checks passed; desktop/mobile screenshots inspected. Final navigation-active styling checked with the How it works suite.
- GitHub source prepared for the existing Netlify-connected demo. Live Netlify verification remains blocked by environment network policy.

### Last Verified Result

- Frozen-lockfile npm ci completed; Vite build passed.
- 11 Playwright Chromium checks passed: age persistence/expiry, blocking Escape, policy access, blocked storage, exit routing, filters/empty state, profile dialog, ads/category switching, and responsive layout at 320/390/700/1024/1440px.
- Desktop and mobile screenshots inspected. Initial hover movement affecting alignment checks removed; final rerun passed.
- macOS Safari, actual Agrandir rendering, real geolocation, and all backend behaviour remain unverified/unimplemented.

### Next Action

Continue frontend increments using the approved direction and provisional routine
visual choices; record meaningful decisions in page briefs. Revisit visuals as
Robbie requests edits. Add licensed Agrandir webfont files when supplied.
Backend/access-policy choices remain prerequisites only for dependent real features.

### Current Limitations

Agrandir font assets are not present. Browser referrer policy can omit the prior
page or reduce its URL; Exit uses the available external source and falls back
to Google. When storage is blocked, age confirmation applies only to the visit.
Policy notices, sign-in, posting, subscription actions, and Looking For detail previews remain
explicit prototype summaries rather than complete services or legal documents.
The public profile is implemented with fictional data and labelled locked previews.

Earlier cloud configuration saves returned INVALID_ARGUMENT. Robbie subsequently
reported publishing the environment, and the restored checkout contains the
prototype and dependencies. Repository setup instructions remain in README.md
and the environment guide; publication does not deploy the application.

## 19. Updating This Roadmap

After meaningful work:

- Update the relevant phase.
- Record completed outcomes.
- Preserve unresolved dependencies.
- Update the current snapshot.
- Replace stale next actions.
- Reference evidence where useful.

Keep detailed design feedback in page briefs.
Keep financial rules in the payment specification.
Keep confirmed decisions in the decision log.

Do not mark work approved based on silence.

Do not mark files saved, committed, pushed, or deployed without evidence.

## 20. Final Rule

Keep this roadmap aligned with reality.

The next person or session should be able to identify:

- What is happening now.
- What has actually been completed.
- What still needs review.
- What is blocked.
- What can proceed.
- What should happen next.