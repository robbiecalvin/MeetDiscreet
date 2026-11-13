# MeetDiscreet — Roadmap and Next Steps

## 1. Purpose

Track the current phase, implementation progress, review status,
dependencies, and next actions for MeetDiscreet.

This is the authoritative roadmap.

Do not maintain a competing task list elsewhere.

Detailed requirements, design decisions, and financial rules belong
in their dedicated documents.

## 2. Current Position

Current phase: Frontend development with an initial Supabase development backend.

Current activity:
Complete the shared visual consistency pass following Robbie’s requested sexier
look and feel. The public discovery/profile/ad pages, account entry/security,
User/Provider setup and profile editors, listing tools, experience catalogue,
availability, photo workspace, conversation/booking previews, Help, guidelines,
entrance gate, saved-draft download and staff review have matching editorial styling. Exact rendering remains for
Robbie’s review. The selected palette, three-column mobile portrait grid and
compact ads remain intact. Relevant page briefs record per-increment validation.

Shared signed-in navigation now uses one narrow-screen layout across routes,
with consistent disabled-control and keyboard-focus feedback. Production build,
all 223 standard checks and all 131 mocked backend browser checks passed.
Mocked signed-in 320px overflow checks passed across 14 routes; discovery, profile
and conversation renders were inspected. Hosted integrations remain separately
unverified.
Saved-draft download visual follow-up: production build and five focused checks
passed; mocked signed-in 320/390/1440px renders inspected with no overflow and
all selection options initially unchecked. No download data scope changed.
Staff-review visual follow-up: production build, two review-route checks and 36
focused mocked backend checks passed. Fictional scoped-staff 320/390/1440px queue/
detail renders inspected without overflow. No permission or workflow logic changed.
The combined manual walkthrough remains deferred at Robbie’s request.
Discovery is synthetic; conversations/bookings/photos remain explicitly labelled
previews. Visual polish does not establish live marketplace readiness.
Licensed Agrandir files, macOS Safari, hosted migration/auth/email validation and
unresolved publishing/payment/scheduling policies remain outstanding.

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
- Netlify frontend hosting and Supabase development authentication/private drafts
  are connected. Hosted catalogue storage still needs its additional migration.
- Messaging, live bookings, payments, public publishing and production eligibility
  enforcement remain unimplemented.

Do not mark documents as installed merely because their contents
were supplied in chat.

## 3. Immediate Next Action

Build the non-payment pilot foundation: trusted provider intake, review and
controlled publishing, alongside independent frontend work. Defer the combined
manual walkthrough as requested. Apply missing prepared migrations during later
backend setup and verify hosted ownership/role checks before live access.
Preserve unresolved commercial/scheduling rules. Agrandir assets and macOS Safari
validation remain outstanding; no live transactions are enabled.

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

- Objective: Companion experience catalogue draft with included/extra controls and labelled previews.
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

### Listing Editor Increment

- USR-05/COM-08 frontend composer at `/?page=create-listing`, available through the header on desktop/mobile and the footer.
- Offering/Looking For selection, title/description validation, fictional examples, city/general area/activity, edit/preview/clear controls, and keyboard focus/error associations.
- Preview uses text nodes, so entered markup is displayed rather than executed. No network submission, account privilege, saved listing, publication, boost, allowance, payment, or new discovery result.
- Drafts remain in memory across in-app navigation and are lost on full refresh; the form states this explicitly. Author labels are demo personas, not role assignment.
- Build and 50 Chromium checks passed (40 existing plus 10 editor checks) including five responsive widths. Desktop/mobile form and preview screenshots inspected.
- Looking For draft preview does not resolve full-post public visibility. Publishing requires backend ownership/eligibility and confirmed policies in future work.

### Guidelines Reader Increment

- PUB-09 at `/?page=guidelines`, linked from age gate and footer as a standalone policy reader.
- Uses the existing content/boundaries requirements: current platonic scope, adult eligibility, personal choice, media, privacy/authenticity, and fair reporting/review principles.
- Clearly labelled working preview; no final legal policy, live moderation, identity verification, report submission, blocking, or acceptance recording is claimed.
- Accessible before confirmation while discovery remains hidden/inert. Return preserves the original route through section jumps and refresh, then restores the age gate if needed. Reading does not set the age timestamp.
- Build and 60 Chromium checks passed, including 10 guidelines checks plus all 50 existing regressions. Final section-jump/history change verified by rerunning guidelines checks. Desktop/mobile screenshots inspected.
- Source update prepared for GitHub/Netlify; live site verification remains blocked by environment network policy.

### Help Page Increment

- PUB-10 at `/?page=help`, available from the entrance gate and footer without confirmation.
- FAQ search and combined topic filtering, open search matches, native keyboard disclosures, live result counts, and empty/reset behaviour.
- Links to discovery, reference plans, listing drafts, and guidelines. Ordinary app pages remain gated for unconfirmed visitors; nested Help → Guidelines → Return preserves the source through refresh.
- Explains current fictional data, locked previews, draft memory, and unavailable account/payment/communication services. No support inbox, contact details, report submission, ticket, response time, or refund action is invented.
- An initial test identified an ambiguous select label; label/control association corrected, focused Help checks passed, and the full 70-test Chromium suite passed after the fix.
- Desktop/mobile views inspected; build passed. Live Netlify verification remains blocked by environment network policy.

### Account Entry Increment

- AUTH-01/AUTH-02/AUTH-04 layouts at `/?page=register`, `/?page=sign-in`, and `/?page=recover-account`, replacing the sign-in popup.
- Fictional sample fill, required/email validation, matching passwords, explicit unchecked adult self-attestation, show/hide controls, and clear no-action feedback.
- No authentication provider, real sign-in, registration, email, reset link, session, role, policy acceptance, or entitlement is created. No network writes or credential storage; fields clear after preview submission and the form DOM is removed on leaving account screens.
- Normal account-screen routes remain age gated. Public Help/Guidelines remain available before confirmation.

### Companion Profile Editor Increment

- COM-02 frontend draft editor at `/?page=edit-profile`, reachable from registration preview and the footer.
- Public identity, age, main fictional photo, tagline, and general location; member-only biography and interests are labelled separately.
- Fictional example, required/adult-age validation, safe preview, visitor/member/subscriber audience controls, return to editing, clear, and in-app draft retention.
- Visitor preview replaces biography/interests with labels. Subscriber preview contains no actual media/experience assets and grants no access. This is an owner-style synthetic draft, not backend authorization.
- No saved/published profile, real uploads, payments, account roles, entitlements, or discovery mutations. Full reload clears the draft; only the existing age timestamp is stored.

### Experience Catalogue Increment

- Partial COM-05 at `/?page=experiences`, linked from the profile editor through shared companion draft-tool navigation.
- Add/edit/remove experiences, descriptions/restrictions, offered status, included-in-hourly-rate status, and one-time/hourly extra drafts. Included clears/disables extra controls.
- Draft extra amounts use exact decimal-to-integer-minor-unit parsing, rejecting overprecision/negative/unsafe input without rounding. Currency and real billing policies remain pending; no quote or charge is calculated.
- Visitor preview shows only labels. Subscriber-layout preview includes offered synthetic items only; no account access is granted. Not-offered entries remain in the owner list.
- Catalogue/composer are in memory until full refresh. No save, publication, backend request, entitlement, or public profile/discovery change.

### Last Verified Result

- Vite build and all 103 tests passed: 92 regressions plus 11 catalogue/parser/navigation/preview/responsive checks.
- Desktop editor and mobile subscriber-layout screenshots inspected; widths 320/390/700/1024/1440px checked.
- Documentation links and diff whitespace checked. Established platform prices and pending commercial/access policies preserved.
- Safari, Agrandir, real authentication/ownership/storage, and live Netlify verification remain unverified/unimplemented as applicable.

### Supabase Development Increment

- Implemented feature-flagged email/password accounts, PKCE callbacks, recovery,
  sign-out, and private profile/listing draft save/load through the official SDK.
- Owner-only PostgreSQL migration committed separately. Robbie reports running
  it successfully; hosted schema verification remains outstanding.
- Build passed; all 109 default tests (including six PostgreSQL/configuration
  checks) and five mocked-provider browser integration tests passed. Policy
  checks exercise owner, cross-owner, anonymous, and invalid writes.
- Cloud access to Supabase now works. Hosted auth settings confirm email sign-in
  and required email confirmation. Both hosted draft tables deny anonymous reads.
- Robbie reports redeploying with backend variables, loading a saved private profile,
  and receiving no-draft feedback in the subsequent account check. Full hosted
  account separation, recovery, email and session lifecycle verification is pending.
- Saved listing management now includes type/city metadata, explicit new-versus-saved
  editing state, starting a separate draft, and confirmed owner-filtered deletion.
  Failed deletion preserves the saved selection and offers retry; deleting the
  selected draft keeps editor text as unsaved input. No public publishing.
- Build and seven mocked-provider browser tests passed for this increment.
- Robbie requested continued implementation, deferring the full manual walkthrough.
  Continue automated checks during development. See [setup](./development/backend-setup.md).

### Account Overview Increment

- Added `/?page=account` with a verified development-session check and links to
  profile drafts, listing draft management, and in-memory experiences.
- Signed-out and backend-disabled states are explicit. Identity content clears on
  sign-out/account changes; detached results cannot populate an old overview.
- Build, 109 regressions/policy checks, and eight backend UI checks passed.
  Mobile and desktop screenshots inspected; no horizontal overflow at 390/1440px.
- Header Account links target the overview; signed-out Sign in links retain their
  entry route. No role, entitlement, billing, or publication state is claimed.

### Profile Draft Deletion Increment

- Added confirmed deletion of the current account’s stored private profile draft.
- Editor input and authentication account remain; missing records are reported
  explicitly. Shared save/load/delete controls prevent overlapping operations and
  restore buttons after failure. No authentication account deletion is implied.
- Build, ten mocked-provider browser checks, and 16 profile/policy regression
  checks passed. Full manual walkthrough remains deferred at Robbie’s request.

### Private Experience Catalogue Persistence

- Added explicit private catalogue save/load with identity-change protection,
  refresh recovery, empty/missing records, and recoverable migration errors.
- New migration `202611090001_experience_drafts.sql` is prepared, tested locally,
  and must be applied after the original migration before hosted catalogue saves.
  It has not been applied remotely by the agent. No manual setup requested yet.
- One snapshot per owner; nested values and a technical 200 KB payload limit are
  validated in PostgreSQL. Existing currency-pending integer draft amounts and
  included/extra rules are preserved. No public pricing or subscription access.
- Only items added/updated in the catalogue are saved, not unfinished composer text.
- Extracted the pure amount parser so Node tests stay independent of browser config.
- Build, all 110 default tests, and 12 mocked-provider browser checks passed.
  Hosted catalogue schema and storage remain unverified until migration setup.

### Saved Catalogue Deletion

- Added confirmed owner-filtered deletion of a saved private catalogue, preserving
  local editor items and the authentication account. Explicit no-record and
  retry states prevent false success. Items can be saved again after deletion.
- Build, 14 backend UI checks, and 18 catalogue/policy checks passed.
- Reuses the existing catalogue migration; no additional database setup is needed.
  Hosted catalogue operations still require applying that pending migration.

### Account Security Increment

- Added account-linked password change at `/?page=account-security` with verified
  user lookup, current-password reauthentication, matching-new-password checks,
  provider-side updates, recovery links, and generic failure states.
- Clears credentials before provider requests and on navigation/sign-out/identity
  changes. No password persistence/logging, schema change, or paid service.
- Build, all 110 regressions/policy checks, and 17 backend UI checks passed.
  Three password checks were repeated after the accessibility association update;
  mobile screenshot inspected without horizontal overflow. Hosted password
  lifecycle testing remains deferred with the full walkthrough.

### Account Saved-Draft Summaries

- Account overview now independently loads profile saved state, exact listing
  count, and saved catalogue item count with per-card refresh controls.
- Empty records differ from unavailable status; catalogue migration failure does
  not block other cards or navigation. Detached account results are discarded.
- Build and all 19 backend UI checks passed; refreshed mobile summary layout
  inspected with no horizontal overflow. Hosted summary checks remain deferred.
- Listing counts use owner-filtered HEAD requests without loading listing bodies;
  profile checks select only owner ID. Catalogue reads remain private/owner-filtered.

### Unsaved Private Draft Protection

- Added in-memory snapshot tracking for profile, listing, and catalogue edits in
  connected mode. Browser-supported refresh/tab-close warnings apply while dirty.
- Successful saves mark the sent snapshot only, preserving dirty status for newer
  edits. Loads, explicit clear/new-draft actions, and identity resets mark clean.
- Deleting a saved record leaves retained local text/items unsaved. Catalogue
  saves do not mark unfinished composer input as saved. No extra persistence.
- Build, all 112 default checks, and 20 backend UI checks passed, including
  real Chromium beforeunload cancellation, saved reload, and sign-out clearing.
- This is a browser unload warning, not autosave or guaranteed mobile recovery;
  internal navigation retains existing module drafts without prompting.

### Saved Listing Library

- Added account-linked `/?page=my-listings` with combined text/type filters,
  clear/reset, refresh, empty/no-match/loading/error states, and a new-listing action.
- Build, 112 default checks, and 22 backend UI checks passed. Ten listing-editor
  regressions were repeated after final URL handling; mobile screenshot inspected.
- Private cards open owner-filtered draft deep links; refresh reloads the selected
  record. Missing/inaccessible records show blank fields and unavailable feedback.
- Saving/selecting a draft updates its refresh-safe URL; clear/new and deletion
  of the selected draft remove that selection. Draft-ID query state clears when navigating elsewhere. Account changes clear
  library content and discard detached reads. No additional migration is needed.

### Listing Library Management

- Added title/recent/oldest sorting, owner-only unsaved duplication, and confirmed
  deletion directly from private library cards. Failure keeps cards for retry.
- Duplicates insert a separate record only on explicit Save; no source update or
  automatic write occurs. Copy query state clears after loading and on navigation.
- Build, 25 backend UI checks, and 12 listing/snapshot regressions passed.
  Five library checks were repeated after the local-edit retention fix. Updated
  mobile screenshot inspected without horizontal overflow.
- Successful deletion detaches retained editor content from the deleted record.
  Revisiting the same loaded draft preserves unsaved local edits within the app.

### Availability Draft Increment

- Added partial COM-06 at `/?page=availability`, reachable from Account and
  companion draft tools: explicit IANA zone, weekly windows, edit/remove/cancel,
  overlap validation, and ordered preview. Same-day adjacency is allowed.
- In-memory only; no save, public availability, reservations or booking claims.
  Zone changes retain local clock times. Overnight windows, date exceptions and
  date-specific DST resolution remain outside this draft editor.
- Build, all 117 default checks, 25 existing backend UI checks and the new
  sign-out/no-write check passed. Five availability checks were repeated after
  final spacing changes; mobile/desktop screenshots inspected.
- Identity changes clear state; connected-mode browser unload protection applies.
  See [availability brief](./design/page_briefs/availability.md).

### Private Availability Persistence

- Added explicit owner-only save/load/confirmed delete for weekly availability
  sketches and an account summary showing saved count/time zone.
- New migration `202611090002_availability_drafts.sql` validates installed zones,
  nested window format/ranges and overlaps; technical payload ceiling is 32 KB.
- Saves exclude unfinished composer edits; loads clear the composer. Deletion
  preserves local windows and the authentication account. Identity guards and
  snapshot baselines prevent stale reads/saves replacing newer local edits.
- Build, all 118 default checks and 28 backend UI checks passed. Connected
  availability save/load/delete was repeated with a mobile screenshot inspection.
- Hosted migration application remains pending, alongside catalogue setup.
  No bookable availability, reservations, publication, or payment is introduced.

### User / Provider Onboarding Choice

- Registration requires User/Provider intent, stored as whitelisted user metadata
  with requested username. It never grants a role, paid access or verification.
- Account overview supports existing accounts choosing/revisiting a starting point.
  User choice opens discovery/Looking For guidance; Provider opens a separate
  guided setup page with independent saved-draft summaries
  and links to profile, catalogue, availability and listing management.
- Signed-out provider setup requests sign-in; demo mode stays a labelled preview.
  Metadata update failures retain existing state. No new migration is required.
- Build, all 119 default checks and 31 backend UI checks passed. The 23 account/
  profile checks were repeated after the chooser/layout updates. Registration and
  provider setup mobile screenshots inspected; no horizontal overflow.
- Dual-role policy and pilot approval were subsequently resolved in DEC-023. Live
  eligibility and publishing remain dependent work; untrusted intent metadata must
  never enforce access.

### Separate Private User Profile

- Added partial USR-02 at `/?page=edit-user-profile`, reachable from User setup
  and Account, distinct from the provider editor and stored record.
- Draft username, adult-age declaration and gender self-description/non-disclosure,
  with optional name/location/interests/languages/Looking For/Enjoy fields.
- Owner-only safe preview, fictional sample, explicit clear, private save/load/delete,
  snapshot protection and account-change clearing. No public visibility, username
  allocation, eligibility verification, uploads or role grants are implied.
- Build, all 124 default checks and 33 backend UI checks passed. User profile
  preview screenshots inspected at 390/1440px without horizontal overflow.
- Added `202611090003_user_profile_drafts.sql` for later hosted setup. Optional
  photo/orientation/accessibility fields remain planned, not removed from scope.

### User / Provider Listing Paths

- User setup opens Looking For-filtered private drafts; Provider setup opens
  Offering-filtered drafts. Matching create actions preselect the listing type.
- Library filter context survives refresh and editor return links. New-draft
  query flags are consumed once, while category context persists. Clearing filters
  restores the full owner library; editor field choices remain editable.
- Source context is limited to internal library routes and whitelisted kinds.
  It never grants posting permissions, roles, public visibility or paid access.
- Build, all 35 backend UI checks and 24 account/listing regressions passed,
  including direct category links, new-draft creation, save and filtered return.
- No additional database migration is required for this navigation increment.

### Booking Request Preview

- Added partial USR-09 at `/?page=booking-draft`, linked from User setup and Account.
- Fictional public provider/activity, calendar date, local time, explicit IANA zone,
  whole-minute duration, optional venue, unpriced expenses and notes; safe review
  with edit/clear and no send, reservation, quote or payment action.
- Format checks reject impossible dates and unsafe/fractional durations. Actual
  booking eligibility, subscriptions, availability, DST resolution, presentation/
  add-on selection and authoritative pricing remain unimplemented dependencies.
- Build, all 130 default checks and 36 backend UI checks passed. Help checks
  passed after the FAQ update; mobile editor and desktop review screenshots inspected.
  All five booking checks were repeated after the notes typography correction.
- In-memory only with account-change clearing and connected unload protection.
  No new migration or payment capability. See [brief](./design/page_briefs/booking-draft.md).

### Server-Controlled Role Foundation

- Prepared `202611090004_account_roles.sql`: owner-readable, server-writable roles,
  basic User bootstrap/backfill, and current-user role checks independent of metadata.
- No automatic Provider/moderator/admin grant. Own-role mutation and anonymous reads
  are denied; role preference does not imply eligibility, publishing or paid access.
- Trusted assignment changes create protected audit events. Browser audit access
  and service-API event rewriting are denied; audit retention/operations remain pending.
- Account and Provider setup display actual assignment status with retry. Missing
  schema reports unavailable permissions rather than assigning fallback roles.
- Build, all 133 default checks and 38 backend UI checks passed. PostgreSQL
  checks verify own-role reads, forbidden role/audit mutations, metadata-resistant
  signup, trusted role evaluation and protected audit events. Mobile status inspected.
- Hosted migration application, provider approval/eligibility, operational role
  management and controlled publishing are still required for a usable pilot.

### Private Provider Application Intake

- Added `/?page=provider-application` with save, explicit submit/withdraw, reload,
  and optional copy from the owner’s saved provider introduction.
- Prepared `202611090005_provider_applications.sql`: owner reads, RPC-only mutations,
  atomic draft/submitted/withdrawn transitions, status history and assigned-User
  submission checks. Direct client self-approval/status edits are denied.
- Actor binding is checked in the client and again against the actual server UID;
  changing accounts cannot transfer a pending form mutation into a new owner.
- Submitted applications lock editing until withdrawal. Failure preserves prior
  state; missing schema remains unavailable, not a fake empty/success state.
- Build and 140 default checks passed; 42 backend UI cases passed across the
  full run and added failure checks. Final SQL validation was rechecked with all
  15 database/security cases, and final layout/account checks passed. Mobile
  intake layout inspected; submitted editing, withdrawal and retry verified.
- Hosted application remains pending. Decision-making review operations and provider eligibility/approval,
  notifications, role grants and controlled publishing are still future work.
  See [brief](./design/page_briefs/provider-application.md).

### Scoped Staff Review Queue

- Added `/?page=provider-review` with bounded pagination, explicit introduction
  inspection, empty/unavailable/denied states, stale-response guards and data purge
  on denied refresh/sign-out. No application or role mutation controls are present.
- New `202611090006_provider_review_queue.sql` requires assigned staff membership
  plus a separate provider-review capability, rechecked on every RPC. Raw table
  browser reads remain owner-only; only submitted intake is returned to reviewers.
- Capability changes and successful private reads have protected audit metadata;
  no introduction text or credentials are logged. Audit retention remains pending.
- Build, all 144 default checks and 48 backend UI checks passed. All 18 database
  permission cases and the staff inspection/sign-out case were repeated after
  hardening; final preview checks passed. Mobile queue/detail screenshots inspected.
- Hosted migration application and staff provisioning are not done. Approval,
  rejection, eligibility/conflict rules and publication remain separate work.
  See [brief](./design/page_briefs/provider-review.md).

### Version-bound Application Feedback

- Migration 007 captures submission snapshots and backfills existing submitted intake.
  Staff need a separate feedback capability to request changes against the exact
  inspected version. Self-feedback, stale decisions and replay are rejected.
- Applicants can read private notes, save revisions and resubmit a new version.
  Browser reads exclude reviewer identity; feedback never grants Provider access.
- All 146 default checks (including 20 database/config/security cases) and 50
  backend UI checks passed. Hosted migration application remains pending.
- Approval authority and combined User/Provider membership were subsequently
  resolved in DEC-023; live eligibility/publishing remain separate.
  No approval, eligibility verification, role grant or public publishing is added.

### Private Applicant Submission History

- Added an explicit history loader with up to 20 recent submitted introductions,
  expandable version details and matching private feedback. An absent note never implies approval.
- Owner-bound reads use existing migration 007 RLS and feedback column permissions;
  no new database migration or staff privileges are introduced.
- History clears on refresh errors, application operations and sign-out. Entered
  markup is displayed as text; no private history is stored in browser storage.
- Build and all 147 default checks passed, including the new ownership-isolation
  test. The 50 existing backend UI cases passed; both new history cases passed
  after correcting a mocked error to avoid SDK server-error retries. Mobile history
  screenshot inspected. Hosted migration application and approval-policy answers
  remain pending.

### Application Progress in Account

- The provider application card now shows current owner-bound status with a
  state-specific editor link and independent refresh. It requests only owner/state,
  keeping introduction text and feedback on the private application page.
- Absent records and failed/unrecognized status reads are distinct; missing setup
  does not prevent other account cards loading. No additional migration is needed.
- Build and all 54 backend browser checks passed; mobile changes-requested card
  inspected. These include status transitions, navigation and missing-schema isolation.
- Pilot approval and combined roles were subsequently resolved in DEC-023; this
  card itself does not grant roles, notify applicants or enable publishing.

### Private Application Activity Timeline

- Applicants can explicitly load the latest 20 server-recorded status updates:
  draft saves, submissions, withdrawals and requests for changes. Timestamps and
  status history appear separately from submitted introduction snapshots.
- Existing owner-only event RLS applies; no new migration, notifications, staff
  identity exposure, approval or role-grant capability is introduced.
- Errors clear displayed activity and distinguish unavailable from empty; application
  operations and sign-out clear the view. Build and all 55 backend browser checks
  passed, including bounded loading, unavailable/empty distinctions, retry and
  clearing after saves/sign-out. Mobile activity layout inspected. Hosted migration
  validation remains pending as documented in backend setup.

### Profile-to-Booking Preview Continuity

- Public fictional profiles link to the unsent booking-plan preview with the
  selected person. The plan links back to that person's public profile.
- Existing drafts survive internal browsing. Switching from another profile
  preserves the old plan until an explicit confirmed replacement clears its fields.
- Direct links remain age-gated; unknown provider context is rejected. No backend
  write, entitlement, reservation, quote, payment or actual booking action is added.
- Build, all 150 standard checks and 55 backend browser checks passed. All eight
  booking-preview checks passed again after context-message cleanup; mobile profile
  entry inspected. No migration or commercial-policy change is required.

### Offering-to-Plan Preview Context

- Offering ads link to the unsent composer with their validated public source title
  and provider. Source context also survives passing through the related profile.
- Existing plans require confirmed replacement before adopting another Offering.
  Manual provider changes clear the old source; unknown, Looking For and mismatched
  sources are rejected. Source links and the review summary retain the public title.
- No activity, date, quote, reservation, entitlement or commercial agreement is
  inferred. All plan/source state stays in memory; no migration is introduced.
- Build, all 153 standard checks and 55 backend browser checks passed. All 11
  booking-preview checks passed again after final source/cancellation coverage.
  Mobile ad entry and source-context screenshots inspected. No hosted integration
  or actual booking operation is claimed.

### Private Unsent Booking-Plan Saving

- Connected accounts can explicitly save, load and delete one private unfinished
  plan, retaining fictional provider/Offering context. This extends the earlier
  in-memory-only preview; it sends no request, grants no access and reserves no time.
- Migration 008 adds bounded partial JSON with owner-only CRUD RLS. Load confirms
  replacement, preserves edits made while awaiting a response, and rejects stale
  fixture references. Delete leaves current text unsaved and cancels no booking.
- Account shows saved presence without reading plan content. Missing setup and
  network errors preserve editor text; identity changes clear local plan state.
- Build, all 155 standard checks (including 23 database/config/security cases)
  and 58 backend browser checks passed. The three booking-plan browser cases passed
  again after adding Account presence and field-validation checks. Mobile controls
  inspected. Hosted migration 008 application and hosted ownership validation
  remain pending.

### Resume Booking Plans from User Setup

- The User setup card checks saved-plan presence independently, offers refresh and
  shows Resume saved booking plan only after a successful nonempty owner read.
  It fetches no plan text for the card; unavailable and absent states are distinct.
- Resume uses the existing protected load, confirms replacement of local edits,
  and preserves text entered during a delayed response. Direct links wait behind
  age confirmation and account verification before consuming their one-time action.
- No new migration, storage flag, sending, reservation or financial action is added.
  Migration 008 still needs applying on the hosted project.
- Build and all 155 standard checks passed. The full 61-case backend suite passed;
  four focused resume cases then passed after adding the age-gate/startup guard,
  including a cold direct visit and cancellation preserving local text. Mobile
  User setup card inspected. Hosted migration/application checks remain pending.

### Account Other-Session Sign-Out

- Account security now offers a separate password-confirmed action that keeps the
  freshly authenticated session and revokes renewal for other sessions. Copy explains
  that already-issued sign-in tokens remain active until expiry.
- Requests use the verified user's JWT with `others` scope and preserve denied/error
  responses, including statuses the SDK's ordinary signOut method normalizes away.
  No service key, privilege grant, session/device count or database migration.
- Passwords clear before requests; cancellation makes no auth/logout request. Password
  changes and session actions cannot run together; detached results cannot update a
  different account's view. Hosted two-session verification remains pending.
- Build, all 155 standard checks and 70 backend browser checks passed. Coverage
  includes password reauthentication, 401/403/404 and server errors, cancellation,
  current-session retention and operation locking/secret clearing. Mobile session
  control inspected. Hosted refresh/revocation behavior remains unverified.

### Explicit Current-Session Sign-Out

- Ordinary Sign out now uses local scope, complementing the separate password-verified
  other-session action. Local credentials and private editor state clear before
  awaiting a remote logout response; refresh does not restore the cleared session.
- Notices distinguish local removal from an unconfirmed server revocation and never
  promise immediate invalidation of issued tokens. Account changes clear old notices.
- No database migration, role change or new service. Hosted token-revocation behavior
  remains pending the deferred walkthrough.
- Build, all 155 standard checks and 73 backend browser checks passed. New checks
  verify local request scope, private clearing before a stalled response, failed
  server revocation, and staying signed out after reload. Mobile notice inspected.
  Hosted remote token/revocation behavior remains unverified.

### Password-Confirmed Account Email Changes

- Account security shows current/pending addresses and lets owners request an email
  change after entering the new address twice and verifying their current password.
  A provider-reported pending address is distinct from an applied address change.
- Same-origin Auth callback reused; no email delivery, role/eligibility, SMTP setup,
  migration or paid service is implied. Hosted confirmation settings/delivery remain
  to be verified during the deferred walkthrough.
- Security forms share operation locking and password clearing; an applied address
  is used for subsequent password verification. Failed, cancelled or unconfirmed
  outcomes do not claim success. Pending state remains visible after reopening.
- Build, all 155 standard checks and 78 backend browser checks passed. New cases
  cover pending state after refresh, applied changes with later password verification,
  rejected reauthentication/update, matching validation and cancellation. Existing
  session checks also verify the shared lock and email-password clearing. Mobile
  email form inspected. Hosted inbox/callback completion remains unverified.

### Dedicated Looking For Public Summaries

- Looking For titles and View ad now open a dedicated age-gated `?ad=<id>` page
  instead of the short dialog. It shows only existing public card fields, without
  companion-role claims, private User profiles, full posts or contact tools.
- Back navigation retains Looking For category, search and list focus; browser
  history and refresh preserve the destination. Own-draft navigation opens only the
  viewer's private Looking For library and does not overwrite or publish a post.
- Full-post visibility remains unresolved. No migration, publishing, contact,
  subscription entitlement or booking action is introduced.
- Build, all 160 standard checks and 78 backend browser checks passed. New cases
  cover gated visits, refresh, limited public fields, list/history/focus return,
  own-draft navigation and 320/390/1440px layouts. Mobile/desktop screenshots
  inspected. See the [brief](./design/page_briefs/looking-for-summary.md).

### Selected Saved Draft Reference Downloads

- Account has an explicit download page for selected Provider/User profile, listing,
  catalogue, availability and unsent-plan drafts. Nothing is queried until selected;
  Auth/session objects, application history and unsaved input are excluded.
- Owner/projected-field checks, actor revalidation and stale-view guards prevent
  wrong-account or late downloads. Missing selected tables and incomplete listing
  counts abort the entire file. Existing migrations/RLS are reused without new grants.
- The JSON reference file has no import action or full-account/atomic snapshot claim.
  Technical bounds are 1,000 listings and 10 MiB; existing posting/pricing rules are
  unchanged. Keep the file private; free-form saved text is preserved.
- Pilot approval authority and combined roles were subsequently confirmed in
  DEC-023; the download itself never grants roles.
- Build, all 161 standard checks and 83 backend browser checks passed on stable
  sequential reruns. New cases cover selected-field JSON, omission of Auth/extra
  fields, missing-table retry, incomplete listing refusal, empty selection and
  sign-out preventing a late file. The download result now receives focus; all five
  focused download cases and a final mobile visual/focus check passed after this
  adjustment. Mobile download layout inspected. See the
  [brief](./design/page_briefs/draft-backup.md).

### Administrator Pilot Provider Approval

- DEC-023 records Robbie's confirmed Admin-only, explicit-capability approval and
  retention of User features under the same login. Onboarding intent remains untrusted.
- New approval migration locks current authority, base User membership and exact
  submitted version. It atomically records approval, adds Provider without removing
  User, and transitions intake. Self, stale, replayed, withdrawn and revoked-membership
  decisions fail; a failed role grant rolls back the entire approval.
- The staff page shows separately scoped approval after inspection and serializes
  decision controls. Missing setup preserves permitted inspection/feedback. Owners
  see read-only historical approval and version/time without reviewer identity;
  current role checks remain independent after any later revocation.
- No staff scopes/Provider role were assigned to real accounts by the agent, and
  the new migration has not been applied remotely. Identity/eligibility verification,
  paid access, notifications and public publishing remain separate.
- Build, all 165 standard checks (including 27 PostgreSQL/config/security cases)
  and 89 backend browser checks passed. New checks cover role/capability boundaries,
  exact-version approval, User retention, stale/replay/self/withdrawn denial, rollback
  on failed role grant, missing setup, revoked scope, owner history and distinction
  between historical approval and current roles. Mobile approval control inspected.
  Hosted migration/provisioning and actual JWT/concurrency behavior remain unverified.

### Administrator Own-Approval History

- The staff queue now lets authorized Admins explicitly load their own recorded
  approvals, newest first with bounded Older/Newer pagination. It shows original
  submitted name/city and timestamps, not another reviewer's decisions or private
  introduction/current-role information. History remains distinct from permissions.
- The new read RPC rechecks current Admin/review/approval scope, binds actual actor,
  validates page/cursor limits and records protected read metadata. Revoked scope,
  identity changes and failures clear or hide displayed history without cached fallback.
- No grants or role/application mutations are introduced; reading a historical
  decision cannot restore a revoked Provider role. Missing history schema preserves
  other permitted review operations with an explicit unavailable state.
- Build, all 168 standard checks (including 30 PostgreSQL/config/security cases)
  and 92 backend browser checks passed. Coverage includes own-actor isolation,
  cursor bounds, revoked scope, safe rendering, missing setup and history remaining
  visible without restoring a revoked role. Mobile timestamps/layout inspected with
  a Vancouver browser time zone. The new migration has not been applied remotely,
  and no real staff provisioning was performed.

### Pending Provider Application Search

- Assigned reviewers can search pending applications by name or city, with literal
  case-insensitive matching, retained filters across paging/refresh, and Clear to
  restore the unfiltered queue. No introduction or unsent-draft search is added.
- The new RPC enforces existing actual review authority, bounded query/cursor/pages
  and metadata-only read events. Old default listing remains usable if the new
  search setup is missing. Stale responses cannot overwrite a newer query.
- Build, all 171 standard checks (including 33 PostgreSQL/config/security cases)
  and 95 backend browser checks passed; mobile search controls inspected. Coverage
  includes literal matching, permission/actor boundaries, pagination, missing setup,
  and out-of-order responses. The migration has not been applied remotely, and
  hosted staff/JWT checks remain pending.

### Staff Submission Dates

- Review queue cards and application detail show the submitted instant in the
  viewer's browser time zone, with semantic machine-readable timestamps and an
  explicit unavailable state for missing/malformed dates. No deadline or new
  staff permission is introduced; existing server ordering remains authoritative.
- Build and all 95 backend browser checks passed, including assertions that queue
  and detail show the same browser-local instant and exact machine-readable time.
  Mobile detail inspected. This presentation change needs no new migration; earlier
  hosted migration and real staff-provisioning checks remain pending.

### Unsent Staff Feedback Protection

- Queue refresh/search/clear, pagination, switching or closing an application and
  the workspace Back link ask before discarding a nonblank feedback note. Cancel
  preserves text and sends no request; failed submission still keeps the note.
- The existing native unload warning covers active review notes where supported.
  Notes are never persisted. Sign-out/identity loss clears private text immediately.
  Unrelated header/history navigation has no new global SPA guard or recovery.
- Build, all 171 standard checks and 96 backend browser checks passed. The native
  unload tracker reads the current visible form without retaining detached private
  DOM; its final binding adjustment passed the build and three focused staff checks.
  Cancellation preserves notes without requests, confirmed discard removes them,
  and sign-out clears the form. No migration is added.

### Provider Setup Status and Retry

- Provider setup now shows the shared owner-only application summary and next
  action, with independent refresh. Approved application history does not imply
  present Provider membership; current roles stay in the separate permissions panel.
- Each saved-draft card now supports independent refresh/retry. Missing setup is
  unavailable rather than empty; no completeness score or publishing grant is added.
- Build, all 171 standard checks and 98 backend browser checks passed; mobile
  summary inspected. Coverage includes application states, role separation, private
  text exclusion, missing setup/retry, independent draft refresh and sign-out cleanup.
  No migration or new role/capability assignment is introduced.

### User Setup Saved-Draft Status

- User setup now shows saved User-profile existence and private Looking For draft
  counts with independent refresh/retry, alongside the existing saved-plan flow.
  Counts filter actual owner and Looking For kind, excluding Offering drafts.
- Reads request metadata only. Missing/denied setup or unusable exact counts show
  unavailable status; independent summaries/navigation remain usable. Sign-out
  removes private status and detached views ignore late responses. No publishing
  or completion score is inferred.
- Build, all 171 standard checks and 100 backend browser checks passed; mobile
  card inspected. Coverage includes category/owner query bounds, metadata-only
  reads, unavailable vs empty states, independent retry and sign-out cleanup.
  Existing saved-plan resume checks pass. No database migration is added.

### Saved Listing Library Pages

- Saved listing cards now use 12-item local pages, range/count status and accessible
  Previous/Next actions. Search/type/sort/clear/refresh reset the page; refresh
  retains filters. Deletion clamps remaining pages and locks paging while pending.
- Dedicated owner metadata reads omit full descriptions, check exact completeness
  and reverify identity. Missing counts, incomplete/cross-owner results or a library
  above the technical 1,000-row view bound show unavailable status, not partial
  search results. This bound grants or limits no product posting entitlement.
- Build, all 171 standard checks and 102 backend browser checks passed; mobile
  controls inspected. Coverage includes paging/filter/sort resets, exact-count
  completeness, other-owner denial and retry, plus existing edit/copy/delete flows.
  An older Provider intake test now waits for the settled start-application label
  instead of its transient loading label. No migration is introduced.

### Saved Public-Field Review for Future Publishing

- Provider setup now offers explicit private review of saved public profile-field
  candidates. Unsaved edits and member biography/interests are excluded. Owners
  can revisit missing draft fields and refresh saved values; no quality score or
  ready-to-publish claim is made. Demo portraits remain labelled as fictional.
- The owner-bound read projects only those fields and rechecks actor identity.
  Missing/empty/denied states stay distinct, stale content clears before retry,
  and sign-out prevents delayed responses from repopulating private fields.
- Build, all 171 standard checks and 105 backend browser checks passed; mobile
  preview inspected. Coverage includes explicit loading, public-only projection,
  safe text rendering, saved-value refresh, missing fields, denied/cross-owner
  responses, retry and sign-out during a delayed read. No publishing request/write,
  migration or live plan is enabled.
  Controlled public publishing still needs server-enforced eligibility/approval
  and plan rules; this preview is an independent preparation step.

### Controlled Publishing Contract Prepared

- Prepared the next version-bound submission/public-projection contract in the
  data model. It separates private drafts, immutable submitted candidates and
  approved public fields; it is a design note, not an implemented publishing API.
- OPEN-052/053 now track the two immediate choices: explicit publishing approval
  authority and visibility of an already-approved version during revision review.
  Recommendations were presented to Robbie; neither is recorded as approved.
- Existing Provider membership approval does not decide publication permission.
  Actual activation still needs eligibility, plan enforcement and hosted checks.
  Independent private/frontend work can continue without unrelated business rules.
- Documentation-only increment; no migration, application change or public data.

### Private Profile Submission Copies

- Provider setup can record an exact private copy after explicit saved-field
  review, inspect pending public-field candidates and confirm withdrawal without
  deleting the source draft. Staff publication decisions remain disconnected.
- Server RPCs bind actual owner, current User + Provider membership and source
  version; copy fields come from the server draft, not browser input. One pending
  copy is enforced; later draft edits cannot mutate it. Owners can still withdraw
  after role revocation. No staff/public read or publishing entitlement is added.
- Build, all 175 standard checks (37 PostgreSQL/config/security cases) and 108
  backend browser checks passed; mobile inspected. Coverage includes owner/RLS
  isolation, server-only field copies, role/version/duplicate rejection, immutable
  content, revocation-safe withdrawal and missing setup/retry.
  The new migration is not applied remotely.
  OPEN-052/053 remain unanswered; hosted JWT/concurrency and staff provisioning
  are unverified. This is the single-draft prototype, not a presentation rollout.

### Owner Profile-Copy History

- Owners can explicitly load retained private profile copies, including withdrawals,
  with 20-record newest-first pages and expandable recorded public fields. Viewer
  timestamps include the time zone; history is distinct from current membership
  and public approval. Read access remains owner-only after Provider revocation.
- Paired timestamp/UUID cursors preserve database precision, reads reverify actor,
  and failures clear old results. Pending-copy actions invalidate history, late
  responses are dropped, and sign-out clears the workspace. No new writes/grants.
- Build, all 175 standard checks and 111 backend browser checks passed; mobile
  history inspected. Coverage includes withdrawn records, tied timestamp paging
  with microsecond precision, safe fields, missing/empty/other-owner reads, retry,
  invalidated delayed responses and sign-out cleanup. No new migration; the prior
  private-submission migration is still required and has not been applied remotely.
  OPEN-052/053 remain unanswered.

### Fictional Conversation Frontend

- Added a searchable example inbox and text conversation layout, side by side on
  desktop and one panel at a time on mobile. Explicit local Preview message bubbles
  preserve per-example composer text while switching, with confirmed reset.
- All content is fictional/view-local, with no messaging requests or persistence.
  Leaving/reloading and identity changes clear local edits. Real entitlement,
  membership, blocking, history, receipts, calls and attachments remain separate.
- Build, all 182 standard checks and 112 backend browser checks passed. Desktop/
  mobile inspected; avatar positioning and shared heading spacing corrected. The
  final scoped presentation passed all seven conversation checks again. Coverage
  includes gate/search, escaped local composition, switching/reset/reload, five
  viewport sizes and Auth cleanup. No migration, public publishing or payments.

### Conversation Preview Text Search

- Added a per-conversation search disclosure, safe literal highlighting and
  Previous/Next matching-message navigation. Status reports current/empty/no-match
  states; matches preserve full message context. Clear keeps composer drafts.
- Queries are scoped to each example and reset with the conversation/view. Search
  scrolls only the message log, interprets no HTML/pattern syntax and makes no
  service request. Real message search/access enforcement remains unimplemented.
- Build, all 184 standard checks and 112 backend browser checks passed; mobile
  search inspected. Coverage includes literal HTML/pattern text, bounded match
  navigation, no-match context, composer preservation and per-example/reset scope.
  Existing auth cleanup checks pass. No migration or new business rule is added.

### Device-Local Photo Workspace

- Added local test-photo selection, tall main-image preview, ordering, individual
  removal and confirmed clear-all from Provider setup. Nothing is uploaded, saved
  to an account, assigned to a profile or published; device originals are untouched.
- Local MIME/signature/size/decode/pixel checks produce explicit errors. Capacity
  overflow preserves current photos. Blob URLs are revoked on removal, route exit
  and identity change; retired async decodes cannot restore images. Prototype
  bounds are technical only, not settled publishing/media allowances.
- Build, all 191 standard checks and 113 backend browser checks passed; desktop
  and mobile inspected. Coverage includes local selection/order/removal/reset,
  format/size/decode rejection, capacity preservation, URL cleanup on route exit
  and identity change, and four viewport sizes. No migration or paid service. Real
  storage, processing, moderation, retention/deletion and quota choices remain open.

### Scoped Staff Inspection of Profile Copies

- Added a separate pending-profile-copy workspace with oldest-first keyset pages
  and exact recorded public-field inspection. Current Moderator/Admin plus explicit
  `profile_publication_review` scope is required; intake approval never substitutes.
  Permissions navigation probes both scopes independently with safe missing setup.
- Server responses exclude withdrawn copies, current private drafts/member fields
  and arbitrary snapshot keys. Raw table access remains owner-only. Protected
  read events contain metadata, and current authority is checked per RPC.
- Build, all 196 standard checks (41 PostgreSQL/config/security cases) and 119
  backend browser checks passed; mobile detail inspected. Coverage includes actor/
  role/scope separation, keyset limits, withdrawn exclusion, safe projection and
  audit protection, unavailable setup/retry, revocation and delayed sign-out cleanup.
  No publishing decision, public profile, role grant, real staff provisioning or
  hosted migration is performed. OPEN-052/053 remain unanswered; hosted JWT/
  concurrency and operational retention checks remain pending.

### Staff Profile-Copy Search

- Staff profile inspection now supports explicit name/city search, retained filters
  across keyset pages/refresh and Clear back to the default queue. Literal matching
  excludes withdrawn copies and all other recorded fields. New searches close detail.
- The separate RPC rechecks current inspection scope and actor, bounds input/pages
  and records protected read metadata without the query. Missing search setup is
  unavailable rather than empty, and Clear keeps the original list usable. Late
  responses cannot overwrite newer searches. No approval/public access is added.
- Build, all 199 standard checks (44 PostgreSQL/config/security cases) and 122
  backend browser checks passed; mobile form inspected. Coverage includes literal
  matching, withdrawn/private-field exclusion, actor/scope/input boundaries, query
  pagination/refresh, missing search setup with Clear fallback and out-of-order
  responses. The new migration is not applied remotely; staff provisioning and
  hosted JWT checks remain pending.

### Fictional Booking Inbox and Read-only Detail

- Added clearly labelled User/Provider example inboxes with title/person/area search,
  status filtering and read-only request details. Desktop uses list/detail columns;
  mobile shows one panel with back navigation. Revision comparison preserves
  original/proposed example terms without recording any agreement.
- Accepted awaiting deposit remains distinct from confirmed. No quote, deposit
  amount, deadline, live request/action, participant grant or payment is created.
  View state resets on reload/identity change and the unsent-plan editor stays
  separate; its existing draft must not be overwritten by fixture navigation.
- Build, all 207 standard checks and 123 backend browser checks passed; desktop/
  mobile inspected. Coverage includes gate/perspective/filter behavior, deposit-
  vs-confirmed distinction, original/revised terms, five viewport sizes, preserved
  unsent-plan edits and identity cleanup. No migration. Real booking enforcement
  and unresolved lifecycle rules remain open.

### Fictional Booking Calendar View

- Added a Monday-first month calendar alongside the example inbox list. Month
  navigation, matching-date selection and a day-filter reset reuse current
  search/status filters. Detail/back restores the selected date and keyboard focus.
- Dates/counts describe example requests only. Blank days are noninteractive and
  explicitly not availability; no booking/reservation, permission or calendar
  subscription is created. Gregorian/UTC grid math avoids viewer-zone date shifts.
- Build, all 214 standard checks and 123 backend browser checks passed; desktop/
  mobile inspected. Coverage includes Gregorian leap/year boundaries, month/day
  filtering, empty-month semantics, preserved filters, selected-day focus, narrow
  layouts and identity reset. Existing unsent-plan preservation checks pass. No
  migration, live booking, pricing rule or plan overwrite is introduced.

### Local Booking Revision Composer

- Early booking examples now offer a local schedule/duration/area/notes composer
  and original-vs-local review. Source fixtures/calendar dates and the unsent
  booking plan stay unchanged. No proposal is sent, agreed, quoted or persisted.
- Calendar/time/duration/text checks show focused validation errors. Safe text
  rendering, edit invalidation, per-perspective/request drafts and confirmed reset
  keep the preview explicit. Reload/identity changes clear local drafts.
- Build, all 217 standard checks and 124 backend browser checks passed; mobile
  inspected. Coverage includes invalid calendar/time/duration/text input, safe
  comparisons, edit invalidation, per-context drafts/reset, unsent-plan preservation
  and sign-out cleanup. Existing inbox selectors now target the named static
  revision disclosure. No migration, live state restriction, eligibility/availability
  enforcement, payment rule or booking mutation is added.

### Fictional Booking Activity Preview

- Example request detail now includes an activity disclosure with fictional actor/
  timestamp entries and oldest/newest ordering. Events illustrate request, revision,
  acceptance and confirmed states without claiming actual transactions or records.
- Accepted stays distinct from confirmed; no deposit/fee/receipt is invented.
  Local revision reviews do not create events. Activity state stays within each
  example/perspective and resets with identity/reload; no backend log is added.
- Build, all 219 standard checks and 124 backend browser checks passed; mobile
  inspected. Coverage includes timestamp/order presentation, accepted-vs-confirmed
  distinction, no events from local revision reviews, per-example ordering and
  identity reset. No migration, live booking transition, payment verification or
  operational retention policy is added.

### Version-Bound Private Profile Feedback

- Separately scoped profile reviewers can record one immutable owner-visible note
  for an exact pending copy. Current staff role + inspection + new feedback scope
  are required; self/withdrawn/duplicate writes fail. The note/audit transaction
  changes no publication state, copy withdrawal, role or entitlement.
- Owners explicitly read feedback on pending/history copies without reviewer ID;
  withdrawal retains version feedback while a new copy starts separately. No email.
  Missing feedback setup preserves existing inspection and copy operations.
- Draft discard guards, in-flight workspace lock, safe text, failed-note preservation
  and stale-response checks protect the UI. Protected read/write logs contain
  metadata only. Build, all 223 standard checks (48 database/config/security cases)
  and 131 backend browser checks passed; mobile inspected. Coverage includes scope/
  actor/version boundaries, owner column privacy, self/duplicate/withdrawn denial,
  audit rollback, draft guards/commit lock, missing setup and retained history.
  Migration/scopes are not applied remotely; hosted JWT/concurrency, operational
  retention and public publishing remain pending.

### Next Action

Continue frontend increments using the approved direction and provisional routine
visual choices; record meaningful decisions in page briefs. Revisit visuals as
Robbie requests edits. Add licensed Agrandir webfont files when supplied.
Backend/access-policy choices remain prerequisites only for dependent real features.

### Current Limitations

Agrandir font assets are not present. Browser referrer policy can omit the prior
page or reduce its URL; Exit uses the available external source and falls back
to Google. When storage is blocked, age confirmation applies only to the visit.
Terms/Privacy notices remain prototype policy summaries. Actual publishing,
subscription actions and full Looking For posts remain unavailable. Development
authentication is integrated; hosted confirmation and operational checks remain pending.
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