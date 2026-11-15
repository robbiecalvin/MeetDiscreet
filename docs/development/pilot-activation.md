# Invited development pilot: hosted setup and shutdown

Status: preparation only. Not executed against Supabase. Automated tests/build are
temporarily paused at Robbie’s request; pilot activation remains OFF.
This runbook does not declare the marketplace production-ready.

## Scope

DEC-024–027: invited, no-charge development pilot with text-only approved profiles
and one included Offering per Provider, plus separately invited text and request-only
booking pairs. Published prices remain unchanged. No Looking For, uploads, paid
subscriptions, payments, calls, reservations or paid/confirmed bookings. New text and
booking requests have independent server-only switches defaulting OFF; participant
history, record closure, blocking and reporting remain available when switches are OFF.
The separate `?page=pilot-directory` reads real eligible rows only, never demo data.

## Hosted schema inventory

Use the intended Supabase development project’s SQL Editor. Confirm the project
before running anything; do not copy database passwords, secret/service_role keys,
sessions, email addresses or private copy contents into chat.

Run [pilot_preflight.sql](../../supabase/operations/pilot_preflight.sql) when ready
for hosted setup. It is a read-only transaction ending in rollback. It reports
expected relations/RLS flags, function signatures, browser write privileges,
selected execute boundaries and directory-switch status. It does not list accounts,
copy text, credentials or eligibility provenance. It is an inventory, not policy,
concurrency or end-to-end verification; do not treat PRESENT as a passed test.
Share only its status rows/notices if help is needed.

Apply missing migrations individually in filename order from
[supabase/migrations](../../supabase/migrations), preserving the existing sequence
through `202611140015_contact_service_switches.sql`. Do not blindly rerun an
existing migration. Most files create objects once and are not idempotent.
An existing table/function alone does not prove the whole migration committed;
compare the full migration, dashboard history and inventory before proceeding.
If objects differ unexpectedly, stop and prepare a targeted repair; do not drop
private tables, clear data or guess which migration ran. Keep the directory OFF.

The current repository has no authenticated database-administration connector;
the browser publishable key cannot apply migrations or provision staff. Use SQL
Editor/trusted database tooling, never add privileged credentials to frontend env.
Backend frontend configuration remains public URL/publishable key plus
`VITE_ENABLE_BACKEND`; missing schema must remain an unavailable UI state.

## Staff and invited accounts

Choose existing test accounts deliberately; no script seeds Administrators,
capabilities, pilot invitees or expiry dates. Verify account UUIDs privately in
the dashboard and follow the trusted role-assignment workflow. Signup intent is
never an assigned role. Separate these operational permissions:

| Task | Required current role/capability |
|---|---|
| Provider access approval | Administrator + existing intake review and Provider approval scopes |
| Inspect profile copy | Moderator/Admin + `profile_publication_review` |
| Inspect listing copy | Moderator/Admin + `listing_publication_review` |
| Editorial approval | Administrator + resource review scope + `marketplace_publication_approval` |
| Grant/revoke invited publishing eligibility | Administrator + `marketplace_pilot_management` |
| Grant/revoke invited text pairs | Administrator + `marketplace_messaging_pilot_management` |
| Grant/revoke request-only booking pairs | Administrator + `marketplace_booking_pilot_management` |
| Review volunteered report evidence/private staff notes | Moderator/Admin + `marketplace_report_review` |
| Pause/resume reported pilot publication | Independent Administrator + report-review + `marketplace_publication_moderation` |

No self approval or self pilot assignment. A selected invited Provider keeps User
and Provider roles. Inspect its exact UUID in pilot management, explicitly confirm
it was invited, choose a future UTC expiry and confirm the action. No duration is
prefilled. Do not modify non-pilot eligibility here. Reinspect after success or an
ambiguous request; backend revisions reject stale changes. Eligibility alone does
not approve or publish content.

Owner saves/submits a profile and Offering, staff inspect/approve exact versions,
and owner selects those versions. Later drafts/approvals must not replace them
automatically. Exactly one requested-visible Offering is supported; hide excess
selections deliberately. Multiple selections suppress ads instead of selecting an
arbitrary one. Owner diagnostics explain current public-read prerequisites.

## Before activation

Activation is deferred while verification is paused. Resume the required focused
functional/security checks and hosted walkthrough before changing the switch:
owner/participant isolation, staff capability combinations and no self actions,
stale/replayed requests and concurrent withdrawal/revocation, anonymous field
allowlists/internal-function denial, switch OFF, owner hide/swap, expired/revoked
eligibility/roles, one-Offering capacity and public paging. Verify signup/recovery
and clear private DOM on identity changes. Review the exact public text with its
owner; there are no photos or contact/communication actions in this directory.

Source report/block/triage tools are prepared, but hosted configuration, staffing,
operational support, incident handling, retention and participant expectations must
be established before actual exposure. Source tools alone do not establish an
operational moderation or support service. Broader launch, real media and Looking For require
their remaining policies and implementations.

After verification and a deliberate release decision, a trusted operator may
change `public.marketplace_pilot_directory_settings.enabled` for the
`id='directory'` row and independently enable only intended services in
`public.marketplace_pilot_service_settings` (`text_messaging` / `booking_requests`). Browser roles and staff panels cannot activate it. Record
project, commit, migration state, operator and verification evidence in the normal
deployment record; do not record private content or credentials.

Enabling the switch can immediately expose all currently eligible owner-selected
approved pilot versions. Inspect the participant/selection set first. A frontend
build does not apply migrations or enable this database switch.

## Shutdown and recovery

Use [pilot_shutdown.sql](../../supabase/operations/pilot_shutdown.sql) through a
trusted SQL Editor session to set directory and new-contact switches OFF. This is a mutation; it is not
part of the read-only inventory and has not been executed by the agent. It keeps
all drafts, submissions, approvals, selections, eligibility and audit records.
Confirm the SQL notices and inspect the settings to verify they are OFF. Verify
public queries/UI no longer return entries and new sends/requests are denied when
verification is available. The shutdown handles absent tables during partial setup.
It preserves participant history/report access and request decline/withdraw actions. Existing fetched copies cannot be recalled.

For one invited account, use scoped pilot revocation and reinspect the result.
Owners may hide selections even after roles/eligibility are lost. Keep activation
OFF during schema repair. Do not undo source migrations by deleting tables or
rewrite applied migrations to hide history. A frontend rollback alone does not
revoke backend public access or repair schema compatibility.

## Contact-service walkthrough before enabling switches

Use deliberately selected independent test participants and separately scoped staff.
Publishing, text and request-only eligibility must not substitute for one another.
Verify blocked and expired pairs cannot create new contact; retained history and
closure work; direct table/unrelated-account/staff reads fail; duplicate send/request
IDs do not create duplicates; concurrent revisions/withdrawals/revocations reject
stale writes; evidence reporting shares only its selected copy/message; staff scopes
are independent; self decisions and unauthorized pause/resume fail; public pause
removes actual projection rows; private notes/IDs do not leak to reporters/public.

Request versions show explicit UTC instants with an IANA display zone. Do not turn
requests into confirmed/reserved bookings or test real money. Text uses explicit
refresh; do not promise realtime delivery, notifications or calls. Uploaded/private
media and full financial lifecycle remain separate unimplemented services. Inventory
is read-only and cannot substitute for these currently deferred behavioral checks.
