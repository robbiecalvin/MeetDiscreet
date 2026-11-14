# Invited development pilot: hosted setup and shutdown

Status: preparation only. Not executed against Supabase. Automated tests/build are
temporarily paused at Robbie’s request; pilot activation remains OFF.
This runbook does not declare the marketplace production-ready.

## Scope

DEC-024/025: invited, no-charge development pilot with text-only approved profiles
and one included Offering per Provider. Published prices remain unchanged. No
Looking For, uploads, subscriptions, payments, messaging, calls or live bookings.
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
through `202611140008_owner_visibility_diagnostics.sql`. Do not blindly rerun an
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
| Grant/revoke invited pilot eligibility | Administrator + `marketplace_pilot_management` |

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

Ensure operational support/reporting, incident handling and pilot participant
expectations are adequate before any actual public exposure; these are not
implemented by this runbook. Broader launch, real media and Looking For require
their remaining policies and implementations.

After verification and a deliberate release decision, a trusted operator may
change only `public.marketplace_pilot_directory_settings.enabled` for the
`id='directory'` row. Browser roles and staff panels cannot activate it. Record
project, commit, migration state, operator and verification evidence in the normal
deployment record; do not record private content or credentials.

Enabling the switch can immediately expose all currently eligible owner-selected
approved pilot versions. Inspect the participant/selection set first. A frontend
build does not apply migrations or enable this database switch.

## Shutdown and recovery

Use [pilot_shutdown.sql](../../supabase/operations/pilot_shutdown.sql) through a
trusted SQL Editor session to set the switch OFF. This is a mutation; it is not
part of the read-only inventory and has not been executed by the agent. It keeps
all drafts, submissions, approvals, selections, eligibility and audit records.
Confirm the returned row is OFF and verify public queries/UI no longer return
entries when verification is available. Existing fetched copies cannot be recalled.

For one invited account, use scoped pilot revocation and reinspect the result.
Owners may hide selections even after roles/eligibility are lost. Keep activation
OFF during schema repair. Do not undo source migrations by deleting tables or
rewrite applied migrations to hide history. A frontend rollback alone does not
revoke backend public access or repair schema compatibility.
