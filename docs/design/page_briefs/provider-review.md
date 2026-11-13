# Scoped Staff Provider-Application Review Queue

Route `/?page=provider-review`, linked from Account/Provider setup only after
server-confirmed review access. Provisional dark-layout increment under Robbie’s
instruction to continue the non-payment pilot foundation.

Require both assigned Moderator/Administrator membership and the separate
`provider_application_review` capability. Neither role labels nor editable signup
metadata suffice. Backend checks repeat for every queue/detail request, bound to
the verified reviewer account that opened the workspace. UI hiding is not access
control. No role/capability assignment controls or privileged keys exist in this UI.

List submitted application metadata in oldest-submission-first order with bounded
keyset pagination (20 displayed, one extra row to detect another page). Display
name/city only until explicit inspection loads the submitted introduction. Escape
all applicant text. Do not return draft/withdrawn records, auth contact information,
other profile fields, private media, billing data or audit records.

A withdrawn detail refreshes the queue rather than leaving stale content open.
Access/read errors clear queue and detail data without cached fallback. Account
changes remove the workspace; detached/stale responses cannot populate a new
viewer. Server revocation is enforced on the next request, with no claim of
real-time revocation or erasure of already-seen data. No browser persistence.

Read access is recorded using reviewer ID, operation, target owner where relevant,
and server time; application text is not copied into logs. Capability assignments
have protected change events. Operational audit retention/export remains pending.

Inspection is extended by a separately scoped request-changes form after migration 007.
Pilot approval is now implemented after the later approval migration under DEC-023.
Rejection, identity verification, financial operations and publication remain separate.
Backend-disabled mode shows no private fixtures; missing schema/permissions give
explicit unavailable/denied states and retry. Hosted migration and actual staff
provisioning remain later setup tasks, not completed production operations.


### Version-bound feedback increment

Inspect an immutable submission before requesting changes. Show the feedback form
only with the separate feedback capability and never for the reviewer's own intake.
Require a nonblank note and explicit confirmation. On success refresh the queue;
on failure preserve the note without claiming success. The server rejects stale
versions and repeated requests. Applicants see the escaped note on their own intake,
can save revisions and resubmit; the previous note is hidden during a new submission.
No reviewer identity or feedback is exposed publicly.


## Pilot Provider approval

After inspecting a submitted version, show Approve Provider access only if the server
confirms Administrator membership plus explicit review and approval capabilities.
The feedback capability remains independent. No self-approval. Missing approval
setup keeps permitted inspection/feedback usable without an approval action.

Explain pilot scope, retained User features and separate identity/paid/publishing
checks. Require confirmation bound to the inspected name/version. Lock both feedback
and approval controls during a decision. A successful approval refreshes the queue;
if refresh fails, preserve that distinction instead of claiming the queue refreshed.
Errors say approval could not be confirmed and request a refresh/current-access check.
The server rejects revoked authority, stale/replayed versions, withdrawn/nonpending
records and applicants whose basic User membership was separately revoked.

No real staff assignment or hosted migration is performed. Privileged keys never
enter this UI. Actual Provider eligibility and publishing operations remain future.


## Your recorded approvals

Administrators with the existing review + approval scopes can explicitly load only
the decisions they recorded. Show immutable submitted name/city and submission/
approval timestamps with the viewer's time-zone abbreviation, not current roles or
private introduction text. Do not expose another reviewer's decisions or a global
audit log. The applicant's own approval history remains a different owner view.

Use newest-first keyset pages: 20 visible and one extra row for Older approvals,
with Newer approvals and explicit refresh. Native text rendering handles names;
no media, current profile or entitlement is loaded. Missing history setup leaves
inspection and authorized approval usable, with an unavailable history state rather
than fabricated/empty results. Failed refresh clears old cards; queue permission
refresh and identity/sign-out changes remove unavailable private history. No cache,
automatic polling or live-revocation claim.

The existing Admin approval authority is rechecked on every history RPC and the
server derives the actual reviewer. Read access records metadata only. Decisions
remain historical if a target's Provider role is later revoked; reading history
must never grant it again. No undo, reapproval or role-revocation action is added.


## Search pending applications

Assigned reviewers can explicitly submit a name/city search, case-insensitive and
matched as a literal substring (including percent and underscore). Only pending
submitted applications participate; introductions and unsent drafts are excluded.
The applied filter persists across pagination and refresh; a new search resets the
page and closes prior detail. Clear restores the original unfiltered queue.

Search is limited to 100 characters and remains in page memory, outside URLs and
browser persistence. Missing search setup shows an unavailable state, with Clear
providing access to the existing queue. Late responses cannot replace a newer
search. The mobile form wraps within the existing staff workspace.


## Submission timing

Queue cards and inspected detail show the server-supplied submission timestamp
in the viewer's browser time zone, including its abbreviation. A semantic time
element retains the exact instant. Missing or malformed timestamps show
“Submission date unavailable” rather than inventing a date. This is submission
time, not an approval deadline, elapsed-time promise or last-profile-edit time.
Existing oldest-first ordering and authorization remain unchanged.


## Unsent feedback protection

Nonblank feedback notes require a discard confirmation before queue refresh,
search/clear, pagination, inspection of another application, closing detail, or
the workspace's Back to account link. Cancel preserves the detail, note and applied
queue state without a request. Successful feedback submission refreshes directly;
failed submission preserves the note. Browser reload/close uses the existing native
unsaved-draft warning where supported. Notes remain in memory only.

Sign-out, identity changes and authorization failures clear private text without
a discard prompt. This does not add recovery or a global guard for unrelated
header links/history navigation; those can still leave the workspace.

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
full-document exits where the browser permits a prompt. Same-document browser
Back/Forward remains a follow-up; no complete history-navigation guarantee is
claimed. No note persistence, backend permissions or mutation semantics changed.

Route-guard validation: production build and the full 224 standard/135 mocked
backend suites passed. Final guard-lifecycle cleanup clears old guards whenever
the router renders, including identity-driven clearing, and was followed by
focused account/discovery/review navigation checks. New cases cover canceled
header/footer departure, a single confirmed Back prompt, in-flight blocking and
sign-out cleanup. Browser Back/Forward remains the limitation stated above.
