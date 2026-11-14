# Listing Copy History and Editorial Review

Provisional continuation of the approved staff/account styling under Robbie’s
build-now instruction. DEC-024 governs approval authority and retained versions.

Owner history is part of `?page=my-listings`, independent of library filters and
source draft existence. Explicit Load, 20 newest records plus one for paging,
recorded-field disclosures, safe local timestamps, active/withdrawn labels and
per-copy approval checks. Owners can withdraw an active copy after deleting its
editable source. No reviewer identity is shown. Missing schema/auth/access differs
from an empty history or no approval. Saved draft edits do not change copies.

`?page=listing-review` requires Moderator/Administrator and
`listing_publication_review`. Its account link appears only after an independent
access lookup. List 20+1 active unapproved copies oldest first; inspect exact
recorded fields before exposing approval. Approval additionally requires current
Administrator and `marketplace_publication_approval`, rejects self approval, checks
current owner membership (Provider for Offering), and requires explicit confirmation.
Record a private immutable snapshot and approval time, without public activation.

Busy operations block same-document staff route changes; no editable staff note
is introduced. Close/refresh/page changes clear detail. Identity/sign-out clears
private DOM; generation/identity guards reject late results. Ambiguous approval
requires reinspection before retry. Missing migration/access leaves tools unavailable.
Previous approvals survive replacement review and submission withdrawal.

Source migration 202611140003 is unapplied. Source reviewed only; automated tests
and build paused at Robbie’s request. Rendering, SQL/concurrency, hosted authorization
and end-to-end behavior remain unverified. Listing feedback/rejection, public
activation, plan/allowance/expiry enforcement and full Looking For visibility remain
separate work. No fake private-data fallback or public-listing mutation.

## Owner Offering version selection — 2026-11-14

After an explicit approval lookup, approved Offering history copies expose the
[owner pilot visibility controls](./pilot-visibility.md). Looking For remains
unsupported pending its separate public-access policy. No posting slots or public
activation follow from a selection. Source reviewed only; tests/build paused.
