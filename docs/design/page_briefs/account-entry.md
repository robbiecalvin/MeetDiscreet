# Account Entry Layouts — AUTH-01 / AUTH-02 / AUTH-04

Provisional UI increment under Robbie’s delegation to keep building and revise
later. Routes: `/?page=sign-in`, `/?page=register`, `/?page=recover-account`.
Reuse the existing dark palette, readable form labels, restrained card, and
mobile layout. Replace the sign-in popup with these linked screens.

The original backend-disabled mode is form/layout validation only;
in that mode no sign-in, registration, account role, entitlement, session, email, or
password reset is created. Optional Supabase development authentication is now
implemented; see [backend setup](../../development/backend-setup.md). Clearly request fictional demo details. Provide a fictional
example fill button and explicit no-action feedback after valid submission.
No fake login success or “email sent” screen.

Sign-in uses email/password; registration uses username/email/password/confirm
and an unchecked adult self-attestation. Recovery uses email only. Validate
required values, native email shape, and matching passwords; do not invent a
production password policy or account-verification procedure. Show/hide password
controls are explicit. Acceptance and credentials are never persisted or logged.
Clear credential fields after preview submission and clear the form DOM when
leaving account screens. Navigation between modes discards field values.

Keep the existing entrance age gate on direct account-screen visits. Public
Help and Guidelines remain independently accessible before confirmation.
No account or browser flag can grant protected access. Real integration and
provider/security policy selection remain separate prerequisites.

Check routes/gate/reload/history, validation/focus, fictional sample fill,
password visibility/mismatch, recovery with no false email, field clearing,
no network writes/storage additions, and five mobile/desktop widths.

## Recorded verification

Build and all 82 Chromium checks passed (70 existing plus 12 account checks).
Verified three direct/gated routes, refresh, email/required validation, password
visibility and mismatch, unchecked adult confirmation, no network writes/session
storage, field clearing, history/filter preservation, and five responsive widths.
Desktop sign-in and mobile registration screenshots inspected. Actual provider
authentication, Safari, Agrandir, and live Netlify validation remain unverified.


## Account overview

`/?page=account` provides an age-gated development workspace using the existing
dark palette. Verify the user with Supabase before displaying their email and
links to private profile/listing drafts and in-memory experience tools. Clear
identity-dependent content on sign-out/account change and discard detached
asynchronous results after navigation. Signed-out visitors receive sign-in and
registration links. Backend-disabled builds show a labelled overview preview.
Three restrained tool cards stack into one column on mobile. No subscription,
billing, role, publication, or verification status is invented.


## Account security

`/?page=account-security` is an age-gated page linked from the account overview.
Verify the signed-in email identity before rendering a current/new/confirm password
form. Require matching new values, reauthenticate with the current password, then
use the provider’s password-update API. Provider password requirements remain
server authoritative. Offer recovery for forgotten current passwords.
Clear password fields and reset visibility before the asynchronous operation;
clear the form on navigation/sign-out/account changes. Busy controls and generic
errors support retry without logging or storing passwords. Backend-disabled builds
show an explicit preview; signed-out visits show a sign-in link. No account deletion or MFA configuration is implemented. Email changes and scoped
session revocation are described below; immediate access-token invalidation is not
promised.


Account overview tool cards show saved-state summaries from owner-filtered backend
reads, with independent loading/error and refresh controls. Empty catalogue records
show zero saved items; absent records show no saved catalogue. A failed read must
not be presented as zero or prevent other cards from loading. No public publishing
or commercial status is inferred from private saved records.


## User / Provider registration choice

Registration now requires an explicit User or Provider starting choice. The choice
is persisted as untrusted onboarding preference metadata only, with no role or
entitlement assignment. Existing accounts can revisit it from Account. Provider
setup has its own guided workspace; see [provider setup brief](./provider-setup.md).
No database migration is required for this preference.


## Provider application progress card

Show the verified owner's application state in Account with an independent refresh
button. Read only owner ID/state, not introduction or feedback. Draft links continue
editing; submitted links show the submitted application without implying approval;
withdrawn links invite revisions; changes-requested links lead to the private note
and editor. Absent applications invite starting a draft. Unknown states, read errors
or missing schema must show unavailable, preserve the general editor link and not
block other account tools. Results from detached account views cannot update a new
view. Backend-disabled mode retains its existing account preview. No new migration,
notification delivery, approval, role grant or entitlement is introduced.


## Resume a private booking plan from User setup

For a verified account, the booking-plan card independently checks saved presence
using only the owner ID projection. A saved record shows Resume saved booking plan;
absence shows no saved plan, while failed reads show unavailable and allow refresh.
Other User setup links stay usable. No private notes or introduction text appear
on the card. Backend-disabled previews and signed-out setup show no saved-plan data.

Resume navigates to the existing composer and runs its normal owner-bound load,
including confirmation over dirty local text and protection for edits made during
loading. A direct `resume=1` link waits behind the age gate. Consume the URL action
only after verifying the account, or after a user cancels replacement; do not lose
it during initial account events. The normal load button remains available after
errors. No browser resume flag, draft cache, new migration or booking request.


## Sign out other sessions

Account security includes a separate current-password form and explicit confirmation.
Freshly verify the same account, then revoke other sessions' refresh capability while
keeping the freshly authenticated current session. State the delay plainly: existing
sign-in tokens can remain active elsewhere until expiry. Show success only after a
successful provider response, and keep 401/403/404, server and network errors visible
rather than normalizing them into success. Cancel clears the field and sends no
reauthentication or logout request. No devices or session count are invented.

Prevent simultaneous password changes and session operations. Clear submitted
passwords before asynchronous work, reset password visibility and clear the other
security form's entered secrets when starting an operation. Account changes or
navigation prevent stale responses updating another view. Keep recovery available.
No new permission grants, service credentials, database schema or paid service.


## Current-session sign-out

The ordinary header Sign out action explicitly uses local scope. It clears this
browser's session (including tabs sharing that SDK session), rather than revoking
independent sessions. Other-session management stays a separate password-confirmed
action. Use the supported SDK's local removal before awaiting the logout endpoint,
then verify local session absence before claiming a local sign-out.

Keep a separate wrapping status notice below the header. If the server cannot
confirm revocation but local credentials were cleared, say signed out here and
explain that existing tokens can remain valid until expiry. If local removal cannot
be confirmed, show an error and allow retry. A nominal success claims only local
sign-out, because the SDK normalizes some authentication response statuses. Never
show success just because a request was started. Sign-in clears the old notice;
responses from an earlier account must not overwrite another account's status.


## Password-confirmed email changes

Account security shows the verified current sign-in address and any provider-reported
pending address. A separate form collects the new address twice and the current
password. Validate native email format, matching values and a different address;
require explicit confirmation before reauthentication and the provider update.
Clear passwords before async work. Use the existing same-origin Auth callback.

Show pending only when the provider returns the requested pending address while
keeping the old current address. Do not call that address updated or email delivered.
Show updated only when the provider returns it as the current account email. Unknown
outcomes and rejected requests remain explicit; do not infer confirmation from a
successful HTTP response alone. Existing pending state appears again on reopening.
Keep sibling security forms using the returned current address for later password
verification. The shared busy lock prevents concurrent email/password/session actions
and clears entered password fields across forms. No roles or eligibility are granted.

Email confirmation settings and delivery remain server authoritative and require
hosted verification. No SMTP provider, service secret, paid plan, database migration,
custom email sending or new final verification policy is introduced.

## 2026-11-13 — Entry visual refresh

Continued Robbie’s requested visual style onto sign-in, registration and recovery
forms after “next”. `account-entry-layout` scopes `src/account-entry.css` to these
forms, leaving account/private workspaces unchanged. Larger editorial headings,
blush accents, a rounded burgundy-tinted panel and rounded actions follow the public
pages. User/Provider intent choices remain explicit; selected options use an accent
border in addition to the native radio. Labelled inputs retain visible error borders
and keyboard focus. No authentication logic, policy, role grants or storage changed.
The rendering is provisional for Robbie’s review; licensed Agrandir remains absent.

Validation: production build, 13 account-screen checks and 131 mocked backend
browser checks passed. Inspected 390px registration and 1440px sign-in renders;
320px registration overflow check passed. Existing account checks cover recovery
and responsive widths. Hosted Supabase/email, Safari and licensed Agrandir were
not verified by this presentation change.

## 2026-11-13 — Account overview visual continuation

Continued the requested editorial styling onto the account overview after “next”.
`src/account-overview.css` scopes the starting-point panel, permission summary
and tool cards to this workspace, with blush headings, rounded actions and a
restrained burgundy glow. Tools use three columns on wide screens, two on tablets
and one on mobile. Saved-status labels and all owner-bound reads remain unchanged.
Signed-in renders use fictional mocked backend data for visual inspection; this
does not verify a hosted user account. Exact rendering awaits Robbie’s review.

On the account overview below 450px, the header wraps into two rows to keep
account, posting, session and sign-out controls inside the viewport. Other routes
keep their existing header layout. Signed-in 320/390px renders were inspected
after this correction; initial 1024/1440px dashboard renders were also inspected.

Validation: 13 account-screen and 131 mocked backend checks passed for the
overview styling. After the narrow-header correction, production build and 11
targeted account/role/starting-point checks passed. Hosted authentication, Safari
and licensed Agrandir remain unverified.

## 2026-11-13 — Account security visual continuation

Continued Robbie’s refresh after “next”. The new `account-security-layout` class
reuses `src/account-entry.css` for rounded inputs, blush headings and a matching
form panel. Password, email and other-session sections retain clear separators
and existing action labels. The signed-in header stacks below 450px on this route.
Authentication, confirmations, reauthentication, field clearing and revocation
semantics are unchanged. Exact rendering awaits Robbie’s review.

Validation: production build, 13 account-screen checks and 17 mocked password/
email/session/overview checks passed. Signed-in mobile/desktop renders inspected
with fictional accounts; no overflow at 320/390/1440px. Hosted email/authentication,
Safari and licensed Agrandir remain unverified.

## History scroll and focus

Confirmed Back/Forward navigation to account pages now opens at the page top and
focuses the main landmark. The router checks the rendered discovery view rather
than a stale list of route names, so new account screens cannot inherit discovery’s
scroll offset. Discovery still restores its existing in-memory scroll and selected
card focus. App history uses explicit scroll restoration instead of relying on
browser automatic restoration to counteract route-level scroll changes.

Scroll/focus validation: production build, all 224 standard checks and all 142
mocked backend browser checks passed. New coverage reproduces account Forward
using discovery’s offset with automatic restoration disabled, verifies account
top/main focus and discovery return, and checks canceled staff viewport/caret
retention. Safari/native cross-document restoration remain unverified.
