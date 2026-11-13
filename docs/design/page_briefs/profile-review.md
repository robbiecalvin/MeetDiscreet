# Private Profile Submission Inspection

Status: staff inspection and separately scoped revision feedback implemented, not publication approval. Use the existing
staff queue layout and provisional routine styling under Robbie's build-now
instruction. Public approval authority/edited-version visibility remain OPEN-052/053.

The age-gated `?page=profile-review` workspace requires current Moderator or
Administrator membership plus the separate `profile_publication_review` capability.
This follows the scoped operational-read model; intake review/feedback/approval
scopes never substitute for it. Default assignments remain empty. The permissions
panel exposes its link only after a successful independent scope check. Missing
profile review setup must not hide an independently permitted intake-review link.

List pending private profile copies oldest first, 20 visible plus one for Next.
Cards show recorded name/city/time only; keyset cursors bind submitted time and
copy UUID. Previous/Next and explicit refresh recheck access and clear old detail.
Inspection opens the exact recorded public fields and source-save timestamp, not
a current private draft, member biography, arbitrary snapshot keys or photo URL.
Dates use the viewer's time zone. Escape text and focus the inspected heading.
Close returns focus to refresh. Use existing definition-list styling on mobile.

Withdrawn/missing copies are not inspectable; refresh the pending queue if the
record disappears before opening. Errors and denied access differ from an empty
queue, clear private cards and allow retry. Sign-out/identity changes remove the
workspace; version guards discard late responses. No cached/private demo fallback.

Read operations record protected metadata only. No public approval/rejection, role grant, public profile, payment/eligibility
claim or staff provisioning is introduced. Revision feedback is described below. Inspection cannot promise immediate revocation of already-seen data.

## Pending-copy search

Assigned inspectors can explicitly search recorded display names/cities. Matching
is a case-insensitive literal substring; percent/underscore are not wildcards.
Only pending copies participate, never withdrawn copies or username/tagline/member
fields. Apply on Search profile copies; each new search resets to page one and
closes detail. Retain the applied filter across paging and refresh. Clear restores
the original queue and focuses the input. Search text stays in view memory.

The 100-character query and existing page/cursor bounds are technical limits.
Missing search setup gives an unavailable state, with Clear available to use the
unchanged default listing RPC. No-match results remain distinct. Lost access
hides the form and clears records; late results cannot replace a newer query.
The shared review-search form wraps on mobile. No approval action is added.


## Version-bound owner-visible revision feedback

Current Moderator/Admin plus both `profile_publication_review` and the independent
`profile_publication_feedback` scope can record one immutable note for an inspected
pending copy. Hide the form without feedback scope/migration, retaining authorized
inspection. Do not offer self-feedback. Check existing feedback before showing a
form, and render a recorded note without an overwrite control.

Require nonblank text (1,000-character technical bound) and explicit confirmation.
Tell staff that the owner can read it, no email is sent and no publication/withdrawal
decision is made. Lock workspace actions during the write. Cancelled discard
keeps a note and sends no request; failed writes preserve it and require checking
recorded feedback before retry. Workspace refresh/search/page/close/back actions
ask before discarding draft text. Native unload warning follows the shared tracker;
unrelated header/history navigation has no new global SPA guard.

Scope loss or withdrawal is rechecked on the server. Sign-out/identity changes
clear private UI without waiting for a draft prompt; this does not promise an
already-issued server request was cancelled. Staff reads/writes record protected
operation metadata without note content. No actual scope assignment is performed.

## 2026-11-13 — Staff workspace visual continuation

Continued Robbie’s refresh after “next”. Shared scoped `src/staff-review.css`
adds rounded search/queue/detail panels, blush headings and matching feedback
form controls. Inspection, feedback and pilot Provider approval remain separate
actions under their existing capabilities. No permissions, default assignments,
recorded content, public publication or state-transition logic changed.
Exact rendering awaits Robbie’s review.

Validation: production build, two backend-disabled review-route checks and 36
focused mocked backend review/feedback/approval/preview checks passed. Inspected
fictional scoped-staff mobile/desktop queues and details; no overflow at
320/390/1440px. No real staff account/capability was assigned. Hosted setup, Safari
and licensed Agrandir remain unverified by this presentation increment.

## Shared in-app navigation protection

Review workspaces register their existing discard/busy check with the shared
route-leaving guard. Header, footer and other router-driven links check it before
pushing a URL or rerendering. Cancel retains the exact form and location; confirmed
Back to account asks only once. Queue refresh/search/page/close actions retain
their existing local checks. Feedback/pilot approval operations block these route
changes while in flight; sign-out and identity-driven clearing are never blocked.

This covers managed in-app links. Existing native beforeunload handling protects
full-document exits where the browser permits a prompt. Managed browser Back/Forward protection is described below; it supersedes the
initial link-only limitation. No note persistence, backend permissions or mutation semantics changed.

Route-guard validation: production build and the full 224 standard/135 mocked
backend suites passed. Final guard-lifecycle cleanup clears old guards whenever
the router renders, including identity-driven clearing, and was followed by
focused account/discovery/review navigation checks. New cases cover canceled
header/footer departure, a single confirmed Back prompt, in-flight blocking and
sign-out cleanup. The history protection below extends this initial link-only scope.

## Browser Back/Forward protection

Native session-history entries now carry a navigation-only branch/index marker.
For managed entries, canceling Back, Forward or multi-entry traversal returns to
the original entry without rerendering or appending history. Unsent notes and
selection stay in the existing DOM; a confirmed departure discards them once.
Busy staff actions use the same check, while sign-out/account changes can still
clear private content during restoration. Fragment-only movement preserves the
view. The skip link focuses main and replaces its fragment without adding a step.

For an older/unindexed entry, cancel restores the review URL in that slot and
starts a new managed branch; it does not reconstruct the opaque entry. This
conservative fallback preserves the draft without inventing a traversal distance.
Full-document departures retain the browser’s native beforeunload handling.
No draft text, credentials or role/access decisions enter navigation metadata.

History validation: production build, full 224 standard checks and full 140
mocked backend checks passed, followed by six focused history checks including
an additional sign-out-during-restoration race case. Repeated Back/Forward,
multi-entry moves, unknown entries, skip/fragment focus, in-flight blocking and
confirmed discard were exercised in Chromium. Safari/native cross-document
unload behaviour remains unverified; no immediate erasure guarantee is implied.

Canceled history traversals also preserve viewport position, focused note field
and caret selection. Confirmed departures to other account pages use the normal
page-top/main-focus behaviour. No extra scroll or draft data is persisted.
