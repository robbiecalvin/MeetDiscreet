# Private Profile Submission Inspection

Status: staff inspection implemented, not publication approval. Use the existing
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

Read operations record protected metadata only. No approval/rejection/feedback,
role grant, public profile, payment/eligibility claim or staff provisioning is
introduced. Inspection cannot promise immediate revocation of already-seen data.

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
