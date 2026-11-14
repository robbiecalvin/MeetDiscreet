# Development backend setup

Supabase Free was selected for the first real backend increment. Keep this in a
Free organization; do not enable paid upgrades. Supabase's current documentation
says Free organizations support two active free projects, subject to quotas.
Check the dashboard's plan and usage limits before changing settings.

## Scope

- Email/password development accounts, confirmation, recovery/reset, sign-out,
  password/email changes after current-password reauthentication, and explicitly confirmed
  revocation of other sessions after fresh password verification.
- Private owner-only profile, listing, catalogue, availability and unsent booking-plan drafts, subject
  to the separately applied migrations below.
- Server-controlled membership-role foundation with basic User initialization;
  Provider/operational role assignment and live eligibility workflows remain separate.
- Private provider application intake (save/submit/withdraw) with owner-bound
  transitions; version-bound feedback is available after migration 007. Pilot approval
  is prepared in the later approval migration; notifications remain unimplemented.
- No public publishing, paid entitlements, payments, messaging,
  real discovery data, uploads, or completed eligibility verification.
- Private experience catalogue snapshots require the additional migration below.

Use test accounts/data until final eligibility, Privacy/Terms, support, moderation,
and launch controls are established. The frontend flag is a deployment switch,
not an authorization boundary; database policies enforce ownership.

## Apply the migration

In the new Supabase project's SQL Editor, run the complete file:

[supabase/migrations/202611080001_private_drafts.sql](../../supabase/migrations/202611080001_private_drafts.sql)

Run this initial migration once on the new project. It uses a transaction, creates
two private tables, enables/forces RLS, revokes anonymous grants, and adds separate
owner-only select/insert/update/delete policies. It does not modify existing auth
users or publish anything. Do not run it repeatedly over an existing schema.

The code agent has the public project URL/key but no admin or database credential;
those cannot apply migrations. Never share the database password, a secret key,
or service_role key in chat or browser environment variables.

## Add private catalogue storage

After the initial migration, run this separate migration once when setting up
catalogue persistence:

[202611090001_experience_drafts.sql](../../supabase/migrations/202611090001_experience_drafts.sql)

It creates owner-only `experience_catalogue_drafts`, with a validated JSON array
snapshot, private grants/RLS, and server-maintained update timestamps. The 200 KB
snapshot ceiling is an operational payload limit, not a commercial allowance.
Catalogue controls also support confirmed deletion of the saved snapshot while
retaining editor items and the account. Only added/updated catalogue items are saved; the unfinished item composer is not.
Amounts retain their exact minor-unit draft format without selecting currency or
creating live prices. Nothing is published. Missing migration errors allow retry;
existing profile/listing drafts remain separate. This migration has been tested
locally but has not been applied to the hosted project by the agent.

## Add private availability storage

After the initial migration, run this additional file once for weekly schedule
persistence (do not rerun migrations already applied):

[202611090002_availability_drafts.sql](../../supabase/migrations/202611090002_availability_drafts.sql)

It adds one owner-protected availability sketch per user. PostgreSQL validates the
time zone against its installed time-zone names, validates HH:mm same-day windows,
and rejects nested overlapping windows while allowing adjacency. The 32 KB payload
ceiling is a technical bound, not a plan allowance. Save includes added/updated
windows and the selected zone; unfinished window edits are excluded. Load restores
the private sketch. Confirmed deletion retains editor state and the auth account.
No date-specific availability, appointments, conflicts with bookings, DST date
resolution, reservations, public publishing, or scheduling policy is implemented.
The agent has tested this migration locally but has not applied it remotely.

## Add private User profile storage

Run this additional migration once after the initial migration when enabling
separate User profile drafts:

[202611090003_user_profile_drafts.sql](../../supabase/migrations/202611090003_user_profile_drafts.sql)

It adds `user_profile_drafts` with owner-only RLS and draft field bounds, nullable
adult-age declaration (when populated, at least 18) and gender non-disclosure
constraints. Username uniqueness, verified eligibility and field visibility are
not determined here. Save/load/delete never modifies provider profile drafts,
roles or the auth account. The agent has not applied this migration remotely.
Only apply migrations not already run; do not rerun the original schema.

## Add server-controlled account roles

Run the following migration once for the permission foundation:

[202611090004_account_roles.sql](../../supabase/migrations/202611090004_account_roles.sql)

It creates owner-readable `account_roles`. Authenticated browser accounts have
SELECT only; they cannot insert, update or delete roles, including their own.
Only trusted database/server operations can manage assignments. The browser still
uses only the publishable key; never configure a service-role key in Vite/Netlify
browser variables or share it in chat.

The migration backfills basic `user` membership for existing auth users and adds an
Auth-user insert trigger assigning only `user` to future accounts. Signup metadata,
including `onboarding_intent`, is never read by that trigger. This membership does
not establish verified eligibility, provider status, posting allowances or any
paid entitlement. The Auth-user trigger never assigns Provider/moderator/admin.
DEC-023 confirms that normal approved Providers retain User membership. Pilot
approval adds Provider through the separately scoped transaction described below;
this foundational role migration alone assigns no real Provider role.

`has_account_role(text)` checks the current authenticated user using invoker
security and owner RLS. It is a building block for future backend policies, not a
replacement for subscription, publishing-plan, eligibility, block or ownership
checks. Current private drafting continues under existing owner policies.

Role insert/update/delete events are recorded by a protected trigger with old/new
user IDs and roles, request user ID when present, database actor role and server
time. Browser clients have no audit access. Service APIs can read but cannot
rewrite events; a database administrator remains trusted. No passwords, tokens or
profile content are logged. Audit retention/export and administrative approval
operations remain launch dependencies. No production tamper-proof claim is made.

Account and Provider setup show assigned role status independently of the editable
starting preference. Missing schema/read failures show unknown permissions; no
role is inferred from metadata. Applying the migration and testing new signup plus
role checks against the hosted project remain pending. Do not rerun older files
that have already been applied.

## Add private provider application intake

Apply this migration after the initial draft helpers and account-role migration:

[202611090005_provider_applications.sql](../../supabase/migrations/202611090005_provider_applications.sql)

It creates private owner-readable intake records and status events. Browser and
service API clients have no direct row mutations. Authenticated owner-bound
`save_provider_application`, `submit_provider_application`, and
`withdraw_provider_application` RPCs implement draft/submitted/withdrawn transitions.
Submitted applications cannot be edited without withdrawal or a staff request for changes. Submission requires
assigned User membership and nonblank name/city/introduction; these are intake
requirements, not approved provider eligibility criteria. Save/submit/withdraw grant no Provider role.

The browser binds mutations to the verified account that loaded the editor; the
server compares the expected owner with the actual JWT user and always writes
using `auth.uid()`. This protects against changing accounts during asynchronous
requests. Status events contain owner, state and server time rather than duplicated
application content. They follow auth-account deletion. Later migrations add
submitted snapshots and pilot approval records; operational audit retention still
needs definition before live operations.

A separately scoped staff inspection workspace is implemented below; migration 007 adds feedback.
Pilot approval and additive Provider assignment are implemented by the later
approval migration below. Denial, notifications, response deadlines, identity/eligibility
verification and public publishing remain separate work. Each approval verifies
current authority and the exact submitted version before its atomic role change. This migration has not been applied remotely by
the agent. Run only missing migrations; keep the existing schema intact.

## Add scoped staff review access

After the role/application migrations, apply this file once:

[202611090006_provider_review_queue.sql](../../supabase/migrations/202611090006_provider_review_queue.sql)

It adds server-controlled `staff_capabilities` with no default grants. Review needs
both an assigned `moderator` or `admin` role and the separate
`provider_application_review` capability. Administrator membership alone does not
imply every operational capability. Browser clients can read only their own
capability assignments and cannot change them. No privileged key belongs in the
browser; staff use ordinary verified sessions and protected RPCs.

`list_provider_applications_for_review` and `get_provider_application_for_review`
check actual current role/capability rows and expected reviewer identity before
returning a curated submitted-intake view. Raw application table RLS remains
owner-only for browser requests. Pagination is keyset-based, bounded to 50 server
rows; the UI requests 21 and displays 20. Drafts/withdrawn entries are excluded;
withdrawn details return no record. These RPCs never decide or mutate applications.

Capability changes have protected audit events. Authorized queue/detail reads also
record private access metadata, with no introduction text or credentials in logs.
These read RPCs use POST because they record audit metadata. Browser audit access
and service-API audit rewriting are denied; trusted database administration remains
outside those restrictions. Retention/export and incident operations remain launch
requirements. No immutable/compliance guarantee is implied.

A trusted operator must provision staff role plus capability through a separately
authorized administrative process before hosted review is usable. No account gets
staff access automatically, and the agent has not assigned any real staff privileges
or applied this migration. Pilot approval now has the separate scoped transaction
below; rejection, live eligibility, broader conflict rules and public publishing
remain future implementation/policy.

## Registration starting preference

Signup requires User or Provider and stores `onboarding_intent` with
`requested_username` in Auth user metadata. Existing accounts can update the
whitelisted preference from Account; Provider opens guided private draft setup.
This requires no migration. User metadata is editable and must never authorize
roles, publication, verification or paid access. Non-recovery auth callbacks now
land on Account rather than assuming a companion profile flow. Provider eligibility
and authoritative role assignment are not implemented by this preference.

## Authentication settings

Keep email confirmation enabled. In Authentication → URL Configuration:

- Site URL: the existing Netlify HTTPS site origin.
- Redirect allowlist: that same site's `/?page=auth-callback` and
  `/?page=auth-callback&type=recovery` routes. If the dashboard requires a pattern,
  limit it to the exact site origin; do not allow arbitrary external domains.
- For local development only, add the matching localhost callback URLs for port 5173.

The app constructs redirects from its own origin; it does not accept a return URL
from user input. Auth links use the SDK's PKCE flow. Browser-managed verification
state must be available in the browser opening the link. SDK 2.119.0 appends an
`sb_flow_id`; the callback captures it before removing it from the URL and passes
it explicitly to the supported exchange method. Keep redirect patterns scoped to
the exact Netlify origin, including callback query variations. Callback codes/errors are
removed from the address bar before exchange; Netlify headers disable referrers.

Supabase's default email sender has restrictions and rate limits. Use the project
owner/team test email first; delivery to other recipients may require a separately
configured SMTP service. Do not disable confirmation to disguise a delivery problem.
No paid mail provider is selected or required by this code change.

## Browser configuration

Copy `.env.example` to ignored `.env.local` locally. In Netlify, add these as build
variables, then deploy the new commit after database/settings validation:

| Variable | Value |
|---|---|
| VITE_SUPABASE_URL | HTTPS Project URL from Supabase Connect/Data API |
| VITE_SUPABASE_PUBLISHABLE_KEY | New `sb_publishable_...` browser key |
| VITE_ENABLE_BACKEND | `true` for this development integration; default `false` |

These are browser-visible values. The build rejects secret/service_role/legacy JWT
keys in this slot and restricts the configured Project URL to HTTPS Supabase project
hosts. No admin key is needed in the app. Changing Vite variables needs a new build.

The SDK uses its supported default browser token storage and refresh mechanism.
Passwords are not persisted or logged by application code. Unsaved private draft
edits trigger the browser’s supported unload warning; this is not autosave and
browsers may suppress prompts, especially on mobile. Draft snapshots remain in
memory only. Browser tokens remain
sensitive to same-origin script compromise; headers disallow external scripts,
framing, objects, and external form submission. This is not a complete security
review. Sign-out clears owner draft state; stale account-load results are discarded.

## Validation

- `npm run build`
- `npm test` for frontend regressions and PostgreSQL policy checks.
- `npm run test:backend-ui` for mocked-provider browser integration tests.

Database tests run the actual migration in PGlite (PostgreSQL) using a test auth.uid
function. They exercise real grants/RLS for owner, another account, anonymous, and
invalid/spoofed writes. They do not validate hosted Supabase configuration, JWT
verification, email delivery, or live account lifecycle. Mocked UI tests do not
replace live authentication/storage checks.

For live validation, use two test accounts: save/reload each account's drafts;
verify cross-account read/update/delete denial, sign-out state clearing, confirmation,
recovery/reset, and anonymous denial. Do not claim the integration ready before
these checks run against the configured project.

## Cloud networking

The cloud allowlist now includes the exact project hostname; live Supabase
connection and anonymous draft-read denial were verified. Public
Netlify visitors use their own network; cloud egress settings do not configure
Netlify variables or Supabase redirect settings. Draft configuration tools have
returned INVALID_ARGUMENT, so their persistence must not be assumed.

## Sources

- [Supabase billing](https://supabase.com/docs/guides/platform/billing-on-supabase)
- [Row level security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Password authentication](https://supabase.com/docs/guides/auth/passwords)
- [Redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls)
- [SMTP limitations](https://supabase.com/docs/guides/auth/auth-smtp)

Official billing/RLS source was also inspected in the supabase/supabase GitHub docs
because this cloud environment blocks the supabase.com documentation host.


## Add version-bound application feedback

After migration 006, apply [202611090007_provider_submission_feedback.sql](../../supabase/migrations/202611090007_provider_submission_feedback.sql) once.
It backfills current submissions and captures a new text snapshot on every submission.
Application/API grants prevent snapshot rewriting; trusted database administration
remains outside those restrictions. Snapshots follow account deletion.

Requesting changes requires the existing review scope plus the separately assigned
`provider_application_feedback` capability. No capability is granted automatically.
The RPC checks the actual reviewer, denies self-feedback, locks the application and
requires the exact inspected submission ID. Stale or repeated decisions fail.
The resulting `changes_requested` state lets the applicant save revisions and
explicitly resubmit a new version. Owners can read their feedback note/time, with
no browser permission to read reviewer identity or rewrite feedback.

This migration has not been applied to the hosted project by the agent. DEC-023
resolves pilot approval authority and combined User/Provider membership. Pilot
approval requires the later migration below; public publishing remains unavailable.


The applicant's submission-history control uses the same migration 007 snapshot
and feedback tables, with no additional migration. It reads at most 20 recent
owner snapshots and only matching feedback using the allowed browser columns.
Missing schema/read failures display unavailable; they do not claim an empty history.


Application activity uses owner-readable `provider_application_events` from migration
005 (extended for changes-requested state by 007). Its explicit loader requests at
most 20 events, newest event ID first, without application text or reviewer identity.
No additional migration or capability provisioning is needed for this owner view.


## Add private unfinished booking plans

After the earlier draft migrations, apply
[202611090008_booking_plan_drafts.sql](../../supabase/migrations/202611090008_booking_plan_drafts.sql)
once. Run only missing migrations. This file has not been applied remotely by the
agent. It adds one owner-only `booking_plan_drafts` row containing bounded partial
plan JSON, with authenticated owner CRUD RLS, server update timestamps and account
deletion cascade. Anonymous/API service access is not granted. No staff or provider
role grants, booking request, notification, reservation or pricing logic is added.

The browser explicitly saves/loads/deletes the verified owner's plan. Without this
migration, operations show unavailable and retain current editor text; the unsent
local preview remains usable. Use fictional data. Hosted ownership, JWT and lifecycle
checks remain pending; local PostgreSQL and mocked browser tests do not replace them.
Plan retention follows account deletion or explicit owner deletion, with no revision
history or separate operational retention policy established by this increment.


User setup can check saved booking-plan presence and resume it through the existing
owner-bound load. Presence queries select only owner ID; all actual plan reads still
require the verified owner and RLS. This uses migration 008 without an additional
migration. The resume query parameter has no authority and waits behind age confirmation.


## Other-session sign-out

Account security can revoke other sessions using the freshly reauthenticated user's
JWT and `others` scope. No service-role key or admin credential is used. The installed
SDK's `auth.admin.signOut(userJwt, 'others')` targets the same normal `/logout` endpoint
as `auth.signOut`, but preserves 401/403/404 errors that the latter currently swallows.
It also binds the request to the verified token rather than a mutable current session.
The freshly authenticated session remains; other refresh capability is revoked only
on a successful provider response. Already-issued access JWTs remain valid until
expiry. Neither immediate remote logout nor a count of affected devices is claimed.

This uses existing Supabase Auth with no migration. Automated tests mock Auth HTTP
responses with the real SDK; actual hosted two-session refresh/revocation behavior
has not been exercised. Use test sessions during the deferred hosted walkthrough.


## Current-session sign-out

Header Sign out calls `auth.signOut({scope: 'local'})`, keeping independent sessions
separate from the explicit other-session action. The SDK removes local credentials
before awaiting the server logout request. The app checks `getSession()` for local
absence, while SDK auth-state callbacks purge private DOM and in-memory drafts.
A failed revocation request cannot by itself imply local failure: the notice says
signed out here when removal is confirmed and states server revocation is unconfirmed.
Nominal success claims no remote or immediate JWT invalidation. No migration.

Automated checks cover local scope, refresh staying signed out, private data clearing,
and a pending/failed server logout. Actual remote token lifetime/revocation remains
part of the deferred hosted walkthrough.


## Account email changes

The separate email-change form uses current-password verification followed by
`auth.updateUser({email}, {emailRedirectTo: authRedirect()})`. The callback is the
existing same-origin `/?page=auth-callback`; keep it in the project redirect allowlist.
Do not pass a user-controlled redirect. Browser configuration remains the public
project URL/key; no privileged key or new database migration.

The installed SDK documents Secure email change as requiring confirmation from both
current and new inboxes by default. Actual project settings and delivery have not
been checked here. Verify Secure email change, email confirmation and rate limits
in the hosted test walkthrough; do not assume defaults or silently change them.
The UI shows the provider's current address and `new_email` pending state, distinguishes
pending from applied changes, and never claims email delivery or account eligibility.
If the provider updates the address immediately, later security forms use that new
current address. Failed verification/update and cancellation send no fake success.
Automated checks use the real SDK with mocked HTTP; actual inbox and callback
completion need hosted validation with test addresses later.


## Saved draft reference download

Account's download page reuses existing owner-only draft tables and adds no migration.
Users select types before any private table read. Every selected table must be
available; missing migrations fail the download without a partial file. Deselect
unconfigured types or apply their existing migrations during setup. Booking plans
require migration 008. No Auth/session data or application history is exported.

Listings use an exact owner-filtered count with a 1,000-row technical limit and
require all counted rows. Single-record drafts return zero or one record. The JSON
reference copy is limited to 10 MiB and is not an atomic account snapshot or import
format. Existing RLS/ownership checks still require hosted validation; automated
browser checks use synthetic data. No live user data was downloaded by the agent.


## Add Administrator pilot approval

Apply missing earlier role/intake/review/snapshot migrations first, then apply
[202611100001_provider_application_approval.sql](../../supabase/migrations/202611100001_provider_application_approval.sql)
once. This prepares the confirmed DEC-023 policy. The agent has not applied it to
Supabase, assigned real staff roles/capabilities or granted a real Provider role.

A trusted operator must separately provision the reviewer's assigned `admin` role,
`provider_application_review` and `provider_application_approval` capabilities.
Moderator membership cannot approve even with the approval scope. Approval uses
ordinary verified staff sessions and protected RPCs; no service key belongs in the
browser. Do not grant staff scopes from signup preferences or application metadata.
No default staff grant, capability-assignment UI or broad admin credential is added.

`approve_provider_application` compares expected/actual reviewer, denies self-approval,
locks current authority and the exact pending application/version, and requires
current basic User membership for the applicant. It records a version-bound approval,
adds Provider without removing User, and changes the application to approved in one
transaction. A failure rolls all three changes back. Replays, withdrawn/stale versions
and independently revoked applicant membership are denied. Role assignments retain
existing protected audit events. Approval records expose only owner/version/time
to the owner, without reviewer identity; API clients cannot rewrite them.

Approved intake is closed, while current role rows remain independently authoritative.
Role revocation/reapplication interfaces and live eligibility requirements remain
separate. Approval creates no identity-verification status, paid plan, subscription,
booking or public content. Owner history can display the historical decision even
if a Provider role is later revoked. Its absence/error is not a current-role decision.

Local PostgreSQL/mocked-browser checks validate this code, not hosted JWT/runtime
behavior. During the deferred walkthrough, use distinct test reviewer/applicant
accounts, verify User + Provider membership, denied Moderator/self/stale calls, and
rollback/error behavior. Staff identity provisioning and operational audit retention
need their own authorized process; do not paste privileged credentials into chat.


## Administrator own-decision history

After the approval migration, apply
[202611100002_provider_approval_history.sql](../../supabase/migrations/202611100002_provider_approval_history.sql)
once. It adds a reviewer/time index, a bounded `list_my_provider_approvals` RPC and
an audited history-read operation. It introduces no role/capability grants and
has not been applied remotely by the agent.

Use existing assigned Admin + review + approval scopes. History is filtered to the
actual authenticated reviewer, even if the caller supplies a different expected ID.
Only submitted snapshot name/city/version identifiers and timestamps are returned;
no introduction, other reviewer identity or current target-role status. Default 21,
maximum 50 results with paired timestamp/UUID cursor; the UI displays 20 per page.
No raw approval-table global SELECT policy is added. Protected access events record
`approval_history_list` without copying applicant text.

Missing history schema is an explicit unavailable state and does not disable other
permitted review operations. Hosted role/JWT/ownership checks remain pending. This
is retained own-decision metadata, not a complete global audit export or a new
retention policy. Existing applicant/account deletion and audit-retention rules apply.


## Pending application search

After the own-decision history migration, apply
[202611100003_provider_review_search.sql](../../supabase/migrations/202611100003_provider_review_search.sql)
once. It adds an actor-bound search RPC using existing assigned review authority;
no roles or capabilities are granted. The agent has not applied it remotely.

Search matches only submitted application names/cities, case-insensitively with
literal substring semantics. Query length is 1–100 characters; pages default to 21
and allow at most 50, with paired timestamp/owner cursors. Protected read events
record `queue_search` without the query text. The original list RPC is unchanged.
Missing search setup is explicitly unavailable; Clear returns to that original
queue. Hosted JWT and actual staff-account checks remain pending.


## Private profile submission copies

After the existing migrations, apply
[202611100004_private_profile_submissions.sql](../../supabase/migrations/202611100004_private_profile_submissions.sql)
once. The agent has not applied it remotely. It creates owner-only profile copies
and submit/withdraw RPCs, with no staff/public read policy or publishing approval.
No real roles or capabilities are provisioned.

Submission requires current User + Provider membership, a saved username/adult age
and the exact source timestamp from explicit saved-field review. The server copies
only public-field candidates from the saved draft; client content is not accepted.
One pending copy per owner is enforced by a partial unique index. Withdrawal
remains available to the owner after role revocation. Copies retain their public
fields and source version after draft edits; account deletion cascades them.

Provider setup exposes explicit check, submit and confirmed withdrawal actions.
Missing setup is unavailable, not empty. Failures require rechecking pending state;
changed source requires reviewing it again. Staff publication decisions are not
connected, and this records no eligibility, paid entitlement or public profile.
Local PostgreSQL and mocked-browser checks do not establish hosted JWT/concurrency
behavior. Verify hosted roles, owner isolation and version/duplicate rejection
during the deferred walkthrough before connecting any real review operations.


## Owner profile-copy history reads

The explicit history panel uses the existing owner-only SELECT policy from
`202611100004_private_profile_submissions.sql`; no additional migration or staff
permission is required. It queries 21 retained records, ordered by submitted time
and UUID descending, and renders 20 per page. Paired cursors preserve microseconds
and are validated before constructing a PostgREST filter. Actual owner identity
is checked before/after the read and every returned owner must match.

Withdrawal history does not imply current Provider membership or public approval.
Missing prior schema is unavailable rather than empty. Reads change no records,
and pending-copy actions invalidate displayed history. Hosted JWT checks and
production-scale query/index tuning remain separate; this introduces no retention
policy, archive completeness claim or public review workflow.


## Scoped profile-copy inspection

After private submission copies, apply
[202611100005_profile_publication_review.sql](../../supabase/migrations/202611100005_profile_publication_review.sql)
once. The agent has not applied it remotely or provisioned real staff. The migration
adds pending/history indexes, the new `profile_publication_review` capability name,
curated inspection RPCs and protected metadata-only read events. It creates no
public projection, decision endpoint or automatic scope assignment.

Access requires current Moderator/Administrator membership and that exact assigned
capability. Existing intake review/feedback/approval scopes remain independent.
The new queue returns pending metadata with a paired time/UUID cursor and a maximum
50-row limit; UI uses 21/20. Detail projects the seven recorded public-field
candidates only and excludes withdrawn copies. Direct table access stays owner-only.

`profile_publication_review_access_events` exposes SELECT only to trusted service
operations; clients cannot read or rewrite it. Capability changes retain the
existing protected event trail. No staff-content logs, operational retention
policy or raw global applicant SELECT is added. Current role/eligibility/plan
checks are still required before any future publication decision.

Missing new schema hides only the profile-inspection navigation and gives an
explicit unavailable state on direct visits. Authorized intake review remains
usable. Verify hosted JWTs, actual assigned/revoked scope, owner isolation and
withdrawn-copy behavior during the deferred walkthrough; local checks do not
establish hosted enforcement or concurrent revocation guarantees.


## Profile inspection name/city search

After scoped profile inspection, apply
[202611130001_profile_review_search.sql](../../supabase/migrations/202611130001_profile_review_search.sql)
once. The agent has not applied it remotely. It adds a separate search RPC with
unchanged actual Moderator/Admin + `profile_publication_review` requirements and
expected-reviewer binding. It grants no roles, capabilities or public access.

Queries match only pending recorded names/cities as literal case-insensitive
substrings. Length 1–100, page size 1–50 and paired time/UUID cursor are validated.
Protected read metadata adds `queue_search` without query text or candidate content.
The old list RPC remains intact; missing search schema is explicitly unavailable
and Clear uses that old listing path. Hosted JWT checks remain pending.


## Version-bound private profile feedback

After profile search, apply
[202611130002_profile_revision_feedback.sql](../../supabase/migrations/202611130002_profile_revision_feedback.sql)
once. The agent has not applied it remotely or assigned real scopes. The new
`profile_publication_feedback` capability is independent; staff need current
Moderator/Admin plus both inspection and feedback scopes. Existing intake
feedback/approval scopes do not substitute.

The migration creates one immutable owner-visible note per copy, with reviewer
ID retained privately. Authenticated owners receive column-level reads of only
submission ID, note and creation time through parent ownership RLS. Client direct
writes/reviewer-column reads are denied. Scoped staff RPCs return only note/time
metadata for pending copies; record rejects self, withdrawn/missing copies and
duplicates, locks current authority/copy rows, and atomically records protected
operation metadata. Audit failure rolls back the note. No note text enters that
access-event table. Copy/account deletion cascades feedback; retention policy
otherwise remains separate.

No publication or intake state is changed. Owners withdraw/edit/resubmit to
replace a copy; new IDs do not inherit earlier feedback. No email is sent. Missing
feedback setup preserves inspection and copy actions while showing feedback as
unavailable. Check recorded feedback after an ambiguous response before retrying.
Hosted JWT, real staff provisioning and concurrent revocation/withdrawal behavior
remain to verify during the deferred walkthrough; local tests do not establish them.

## Account completion acceptance still outstanding

The development UI includes signup-confirmation resend at
`/?page=confirm-account`; configure the existing `/?page=auth-callback` redirect
for each authorized environment. Resend uses Supabase signup confirmation and
provider-managed eligibility/rate limits. Failed links now offer fresh-request
navigation. No live email was sent during implementation.

Before treating accounts/private drafts as complete, apply the outstanding
migration sequence, confirm email and redirect configuration, exercise signup /
resend / PKCE confirmation / recovery / email change / password change / session
revocation, and verify each of the six private draft kinds with two independent
test accounts. Confirm download selection, failures, sign-out and expired sessions.
These hosted checks remain deferred under the temporary test pause. Full account
erasure/export and retention/operational privacy requirements need separate policy
and implementation before public account collection.

## Private profile editorial approval (source only)

After revision feedback, source migration
[202611140001_profile_editorial_approval.sql](../../supabase/migrations/202611140001_profile_editorial_approval.sql)
adds exact-copy editorial approvals. It is not applied remotely or verified by
an automated run under the current test pause. No capability was provisioned.

Approval requires current Administrator, profile review access and separate
`marketplace_publication_approval`. RPC checks identity and source copy, locks
reviewer authority and owner membership, rejects self/withdrawn/feedback/replay,
and writes approval + protected operation metadata atomically. Feedback on an
approved copy is rejected under the same source-copy lock. Approval snapshot
column reads are owner-only and exclude reviewer identity. New submissions and
withdrawals do not overwrite previously approved copies. No anonymous policy,
publishing-plan entitlement, public photo upload or publication is introduced.
Validate SQL policy/role isolation, concurrent feedback/withdrawal/revocation,
audit rollback, owner status and hosted JWT behavior before enabling this workflow.

## Private listing submissions (source only)

After profile editorial approval, source migration
[202611140002_private_listing_submissions.sql](../../supabase/migrations/202611140002_private_listing_submissions.sql)
adds owner-readable versioned listing copies. It has not been applied remotely or
verified under the test pause. Only RPCs may insert/withdraw; direct client writes
and anonymous reads are denied. Submit locks current User/Provider membership and
its owner-filtered source draft, checks exact saved timestamp, and copies the five
listing fields plus kind. Offering additionally requires current Provider. One
active copy per source is enforced by a partial unique index. Withdrawal is owner-
filtered and does not require retaining Provider membership.

Source IDs intentionally have no cascading draft foreign key so deletion cannot
erase a recorded copy; owner account deletion still cascades. Dedicated owner
history and staff listing review/approval remain to build. No anonymous projection,
publishing-plan/allowance grant, discovery mutation or publication is introduced.
Verify two-account isolation, stale versions, concurrent edits/submission/deletion,
withdrawal/retry and missing-schema failures before hosted use.

## Listing editorial review (source only)

After private listing submissions, source migration
[202611140003_listing_editorial_review.sql](../../supabase/migrations/202611140003_listing_editorial_review.sql)
adds private immutable listing approvals, owner-scoped approval column reads,
`listing_publication_review` and protected review events. It is not applied
remotely or verified under the test pause. No real staff scope was provisioned.

Inspection requires Moderator/Admin + listing scope; approval additionally requires
Admin + `marketplace_publication_approval`. Approval locks current reviewer authority,
source submission and owner membership, rejects self/withdrawal/replay and atomically
writes snapshot and event. Looking For needs current User; Offering also needs
Provider. Withdrawal serializes on the source row and does not erase approval.
No public reads or direct authenticated writes are granted. Source draft deletion
cannot erase submission/approval; Auth-owner deletion still cascades.

Validate role/capability combinations, owner isolation, private field projection,
keyset paging and equal timestamps, deleted sources, revocation/withdrawal races,
duplicate approval, audit rollback, detached responses and missing schema before use.
Live publication, plans/allowances/expiry, reporting/moderation and full Looking For
visibility remain separate work.

## Publishing eligibility/readiness (source only)

After listing editorial review, source migration
[202611140004_publishing_readiness.sql](../../supabase/migrations/202611140004_publishing_readiness.sql)
creates server-owned bounded eligibility windows and the caller-only readiness RPC.
It is unapplied and unverified under the test pause. No entitlement rows are seeded.
The trusted service role alone can manage eligibility; browser roles have no direct
read/write access. The RPC verifies the expected owner and returns current role
flags, eligibility/expiry and retained approval counts, without provenance/reviewer
identity. It explicitly reports public activation as disconnected.

DEC-025 authorizes an invited no-charge development pilot without changing published
prices. It does not select invitees/durations or grant eligibility automatically.
Scoped issuance/revocation and public activation remain to build. Source references
must identify the trusted eligibility basis; never use client metadata as authority.
Validate owner mismatch, role/eligibility combinations, future/expired/revoked windows,
read/write denial and missing-schema behavior before any hosted use. No payments,
public data projection or browser publishing action is introduced by this migration.
