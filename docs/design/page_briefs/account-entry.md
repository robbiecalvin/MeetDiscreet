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
show an explicit preview; signed-out visits show a sign-in link. No email changes,
account deletion, MFA configuration, or session-revocation guarantees are implied.


Account overview tool cards show saved-state summaries from owner-filtered backend
reads, with independent loading/error and refresh controls. Empty catalogue records
show zero saved items; absent records show no saved catalogue. A failed read must
not be presented as zero or prevent other cards from loading. No public publishing
or commercial status is inferred from private saved records.
