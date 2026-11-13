# User / Provider Entry and Provider Setup

Implemented under Robbie’s request to continue after identifying the missing
registration choice. Carry forward the approved dark palette and shared account
cards; this is onboarding guidance, not automatic role assignment.

Registration requires an explicit User or Provider radio choice, with neither
preselected for real signup. A fictional example chooses User but never checks
adult confirmation. Store only `onboarding_intent: user|provider` beside the existing
requested username in Supabase user metadata. This is user-editable preference
data and must never enforce roles, publishing, verification, or paid entitlements.

The account overview shows the saved starting point and lets the same login
revisit it. Existing accounts with no preference receive both choices. Saving
Provider opens `/?page=provider-setup`; User opens `/?page=user-setup` with
discovery and private Looking For draft guidance. A failed update retains the previous state
and supports retry. Existing draft tools remain development tools, not permissions.

Provider setup links to profile, experiences, availability, and private listing
management. Per-step saved-status reads are independent; missing migrations do
not imply an empty record or completed setup. No completion percentage, approval
badge, identity verification, publishing, or payment status is invented. Signed-out
visits require sign-in; backend-disabled visits show a labelled preview.

Provider eligibility, public publishing and commercial access remain separate
backend/product work. DEC-023 establishes scoped Administrator pilot approval and
retained User + Provider roles; an onboarding preference alone grants neither.

User setup opens the Looking For library context and Provider setup opens Offering.
New listing actions preselect that type; the shared owner library remains able to
show both. This navigation does not grant posting access or assign account roles.

## Application and saved-draft status

Signed-in Provider setup now includes the same owner-only application status/action
as the account overview: start, continue draft, view submitted, revise withdrawn,
review requested changes or view historical pilot approval. Refresh reads metadata
only and never includes introduction/feedback text. Missing setup is unavailable,
not an empty application; draft tools remain usable independently. The current role
panel remains authoritative for present membership, separately from past approval.

Each saved-draft card has an independent refresh and retry. Reads indicate saved
existence/counts only, not completeness or permission to publish. No percentage or
automatic ready state is added. Identity changes remove private status; late
responses cannot repopulate a detached view. Backend-disabled preview remains
labelled and makes no private reads. Mobile uses the existing account-card style.

## User starting-point saved status

User setup now reads saved User-profile existence and the exact count of private
Looking For drafts independently, alongside the existing booking-plan summary.
Each summary has its own refresh/retry. Looking For counts filter both actual
owner and listing kind; Offering drafts do not contribute. Only existence/count
metadata is requested, never profile or listing content.

Missing tables, denied reads or absent/invalid exact counts show unavailable status,
not an empty draft state. Other navigation and saved-plan resume stay usable.
Sign-out removes private summaries; detached views ignore late responses. No
completion percentage, posting permission or public publication is inferred.
Backend-disabled preview makes no saved-status reads. Existing card styling wraps
on mobile; no new business requirement or account role is introduced.

## Saved public-field review before publishing

Signed-in owners can explicitly load a saved-profile public-field preview from
Provider setup. It reads saved display name, username, adult age, tagline, general
location and demo photo selection only; unsaved editor changes, member biography
and interests are excluded. The existing profile editor remains the editing path.

Use the shared profile-card treatment, escaped text and a labelled fictional
portrait. No online indicator, subscriber data, public URL or publishing button
is supplied. Show missing core draft fields as “Fields to revisit” without a
quality score or readiness declaration. Missing draft, denied/unavailable reads
and loaded fields have distinct states; retry clears old content first. Explicit
refresh rereads saved values. Keyboard focus moves to result status.

This is private preparation for a future publishing workflow. It neither submits
a request nor verifies identity, current role, username availability or payment.
Publishing eligibility, approval and plan enforcement remain separate. Backend
disabled/signed-out views expose no preview data. Sign-out/identity changes remove
the workspace, and late reads cannot restore it. No new migration or public table.

## Private profile submission copy

After explicit saved-field review, owners can confirm submission of that exact
saved version. Current User + Provider membership is required on the server. The
UI explains that staff publication decisions are not connected and nothing is
public. It records a private candidate, not an operational review promise.

An explicit check loads the pending copy with its recorded public fields. Later
draft edits cannot change it. Show no member content or staff identity. Owners
can confirm withdrawal without losing their saved draft, even after Provider role
revocation; no second pending copy is permitted. Re-review source after a failed
submission or stale-version rejection. Missing setup differs from no pending copy;
retry clears previous content and focuses the result. Sign-out clears the workspace.
The existing single-draft prototype does not create additional presentations.

## Owner profile-copy history

An explicit history load shows the owner's retained private copies, including
withdrawals, newest first. Use 20 visible records and one extra to detect another
page, with Older/Newer controls and explicit refresh. Each card shows recorded and
withdrawal times in the viewer's time zone, plus an expandable list of the exact
recorded public fields. No member content, staff identity, current role or public
approval is inferred. Owners retain read access after Provider role revocation.

Timestamp/UUID keyset paging preserves database timestamp precision. Failures clear
old cards and differ from an empty history. Pending-copy checks, submissions and
withdrawals reset history so a fresh explicit load is required; late responses
cannot restore invalidated results. Sign-out clears the workspace. No browser
persistence, automatic polling, history deletion or restoration action is added.

## Feedback on a private profile copy

Pending copies and expandable history cards provide an explicit Check feedback
for this copy action. Read only that owner/version's note and timestamp metadata,
without exposing reviewer identity. Distinguish no feedback from unavailable
setup and clear old text before retry. Existing copy actions remain usable if
feedback setup is absent. History includes feedback retained after withdrawal.

A note does not automatically approve, withdraw or change the copy's state. To
replace a copy, the owner uses existing withdrawal, saved-profile editing/review
and new submission actions. New copies do not inherit old-version feedback.
Nothing is published, notified by email or granted by reading feedback.

## 2026-11-13 — Setup visual continuation

After Robbie’s “next”, extended the shared account-overview styling to User and
Provider setup through scoped `:is()` selectors in `src/account-overview.css`.
Both use editorial headings, blush accents, rounded status panels/cards and
rounded actions, with three wide-screen/two tablet/one mobile tool columns.
The header stacks below 450px so signed-in controls remain reachable. Provider
permissions, application state, private public-field preview and copy-history
labels remain separate; no completion percentage, access or publishing is implied.
No backend, draft logic or content-policy changes. Exact rendering awaits review.

Validation: production build, 21 focused account/User profile/provider application
checks and all 131 mocked backend browser checks passed. Inspected signed-in
User/Provider setup renders at 320/390/1440px with fictional test accounts; no
horizontal overflow. Hosted Supabase, Safari and licensed Agrandir remain unverified.
