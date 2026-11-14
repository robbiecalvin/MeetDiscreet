# Invited Development Publishing Pilot

Provisional continuation of the approved staff styling, under DEC-025 and Robbie’s
instruction to keep building. Route: `?page=pilot-eligibility`, age gated.

Require current Administrator plus independent `marketplace_pilot_management`;
publication approval does not imply this capability. The account link is visible
only after its own access lookup. Sign-out/identity changes clear the private view.

Explicit account UUID inspection, no user directory or email search. Show current
User+Provider membership, existing pilot expiry/revocation and non-pilot conflicts.
No invitation email is sent. Grant requires confirmation that the account was
selected/invited, an explicitly chosen future expiry labelled UTC, and a final
confirmation naming target and timestamp. No duration is prefilled. Revocation
has its own confirmed action and remains available after Provider-role loss.
Self changes and non-pilot eligibility modification are unavailable. Expired and
revoked pilot rows can receive an explicitly chosen new expiry after fresh inspection.

Changes bind the exact inspected revision. On failure or success, clear the old
record and require reinspection; never infer success from a stale view. Navigation
is blocked while an operation is pending. Errors leave retry available, not a fake
eligibility state. Exact dates are displayed with explicit local time-zone labels;
the expiry input and confirmation are UTC.

No prices change, paid plan starts, identity verification, editorial approval or
public visibility follows from eligibility. No account/capability has been provisioned.
Source migration 202611140005 is unapplied and unverified. Source review only;
tests/build paused, rendering and hosted behavior unverified.
