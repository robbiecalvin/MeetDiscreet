# Account Entry Layouts — AUTH-01 / AUTH-02 / AUTH-04

Provisional UI increment under Robbie’s delegation to keep building and revise
later. Routes: `/?page=sign-in`, `/?page=register`, `/?page=recover-account`.
Reuse the existing dark palette, readable form labels, restrained card, and
mobile layout. Replace the sign-in popup with these linked screens.

This is form/layout validation only. No selected authentication provider exists;
no sign-in, registration, account role, entitlement, session, email, or password
reset is created. Clearly request fictional demo details. Provide a fictional
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
