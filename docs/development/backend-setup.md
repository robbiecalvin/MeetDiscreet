# Development backend setup

Supabase Free was selected for the first real backend increment. Keep this in a
Free organization; do not enable paid upgrades. Supabase's current documentation
says Free organizations support two active free projects, subject to quotas.
Check the dashboard's plan and usage limits before changing settings.

## Scope

- Email/password development accounts, confirmation, recovery/reset, sign-out,
  and password changes after current-password reauthentication.
- Private owner-only profile, listing, catalogue, and availability drafts, subject
  to the separately applied migrations below.
- Server-controlled membership-role foundation with basic User initialization;
  Provider/operational role assignment and live eligibility workflows remain separate.
- Private provider application intake (save/submit/withdraw) with owner-bound
  transitions; version-bound feedback is available after migration 007. Approval and notifications remain unimplemented.
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
paid entitlement. Provider/moderator/admin roles are never automatically assigned.
Structural support for several roles does not settle the pending combined-role
product policy; this increment assigns no real Provider role.

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
requirements, not approved provider eligibility criteria. No Provider role is granted.

The browser binds mutations to the verified account that loaded the editor; the
server compares the expected owner with the actual JWT user and always writes
using `auth.uid()`. This protects against changing accounts during asynchronous
requests. Status events contain owner, state and server time rather than duplicated
application content. They follow auth-account deletion; operational retention and
approval records and operational retention still need definition before a live approval process.

A separately scoped staff inspection workspace is implemented below; migration 007 adds feedback.
No approval/denial or role-assignment RPC, notifications,
response deadline or public publishing is implemented. A future review operation
must verify assigned operational roles and current submitted state/version before
an authorized audited decision. This migration has not been applied remotely by
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
or applied this migration. Approval/rejection, eligibility decisions, conflict rules,
role granting and public publishing require separate implementation and authority.

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

This migration has not been applied to the hosted project by the agent. Approval,
Provider-role grants and public publishing remain unavailable. Reviewer approval
authority and whether an approved Provider retains User membership await answers.
