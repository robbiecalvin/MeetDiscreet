# Booking Inbox and Read-only Detail Preview

Status: independent frontend prototype using fictional fixtures, not live bookings.
Routine visual choices are provisional under Robbie's keep-building instruction.
Reuse shared dark surfaces, typography, buttons, forms and cards.

The age-gated `?page=booking-inbox-preview` route is linked from Account and User/
Provider setup. User example represents Taylor's fictional requests; Provider
example represents Maya's fictional inbox. Switches are labelled examples, not
account roles or authorization. Filter by example status and search title, people
or meeting-area text. Clear resets filters/detail and focuses search.

Desktop shows a request list next to read-only detail. At 800px and below, show
one panel at a time with Back to example requests. Selection focuses the detail
heading. Cards identify themselves as fictional and show explicit example dates/
wall times in America/Vancouver; these are not viewer-zone conversions or current
availability. No precise personal meeting address is collected or exposed.

Sample states preserve the lifecycle distinctions: requested, revision requested,
accepted awaiting deposit and a confirmed example. Accepted is not confirmed. No
quote, deposit amount, deadline or pricing rule is invented. The confirmed example
claims no actual verified payment/reservation. There are no accept/pay/cancel or
messaging controls until those real workflows exist.

Revision detail compares original and proposed date/time/duration in a semantic
table, preserving both without recording agreement. It is a read-only example,
not a state-transition engine or financial quote. Shared duration formatting
comes from the existing unsent-plan rules. Opening that editor supplies no example
terms or source replacement; existing unsaved plans stay separate.

All inbox state is view-local, reset on leaving/reload/identity changes. No backend
booking reads/writes, custom persistence, participant entitlement, reservation or
payment verification is added. Real status changes, accepted records, concurrency,
participant access and unresolved financial/lifecycle rules remain future work.

## Example request calendar

List/Calendar view controls preserve the current search/status filters and clear
selected detail. The calendar is Monday-first, uses explicit example request
dates in America/Vancouver, and provides previous/next month plus Example month
navigation. It does not use the viewer's current day or convert request dates
through the viewer's time zone. Blank days have no booking action and are not
availability. Requested dates are not promoted into confirmed reservations.

Only dates with matching example requests are selectable. Date selection filters
the cards below; Show all dates restores that month's full matching set. Opening
detail preserves the selected date, and Back restores focus to it. Month changes
clear day/detail and focus the month caption. Clear filters returns to the example
month; perspective switches reset date/search/status but retain the chosen view.

Status announces month totals/selected day; day-button names identify date/count.
The semantic table has weekday headings and noninteractive blank days. Layout
fits mobile without document overflow. State remains view-local and resets with
reload/identity changes. No calendar subscription, live availability check,
reservation or payment action is introduced.

## Local revision composer

Requested/revision-requested examples offer a Try a local revision disclosure.
This demonstrates early sample cases only; it does not decide which live states
may be revised. Start with original example date/time/duration/area/notes, and
keep new text in a per-request, per-example-perspective map inside the view.
Nothing is sent, accepted, priced, reserved or saved to an account.

Review validates calendar date, 24-hour time, positive safe whole-minute duration
and local text bounds (200-character area / 1,000-character notes, aligned with
the unsent-plan form). It renders a semantic original/local comparison with text
nodes and focuses its heading. These are prototype checks, not live eligibility,
DST/availability validation or production limits. No quote/deposit is calculated.

An edit invalidates the old comparison; users review again. Navigating between
example requests retains local drafts within that perspective. Reset confirmation
restores original example terms for that context only. Perspective isolation,
reload and identity cleanup prevent local drafts from appearing in another context.
Original fixture/calendar dates and the separate unsent booking plan never change.

## Fictional activity preview

View example activity expands an ordered list of synthetic events for the selected
request. Show fictional actor, explicit example timestamp in America/Vancouver,
and a concise explanation. Oldest/Newest first toggles reorder presentation only,
preserving that example/perspective preference while the view remains open.
These are fixtures, not a saved booking history, backend audit trail or evidence
of payment/delivery. Unknown example IDs produce no fixture events.

The accepted example stops at accepted-awaiting-deposit. The confirmed illustration
still explicitly states no payment was processed and no time reserved. No fee,
quote, deadline, receipt or verification ID is invented. Local revision reviews
never append events to this history. No event actions, API calls or persistence
are added. Identity cleanup/reload resets activity display state with the inbox.

## 2026-11-13 — Booking workspace visual continuation

Continued Robbie’s requested visual treatment after “next”. Scoped
`src/booking-inbox-preview.css` adds rounded navy request/detail panels, blush
headings and field labels, burgundy selected controls, and softer calendar/form
controls. Revision comparison and local revision/activity disclosures retain their
original content and semantics. No status, schedule, deposit, booking or permission
logic changed. Example dates remain explicitly America/Vancouver wall times.
Exact rendering awaits visual review.

Validation: production build, 20 inbox/calendar/revision/activity checks and two
mocked backend booking-preview cleanup checks passed. Mobile/desktop calendar
and comparison renders inspected; automated layouts cover narrow widths.
No hosted booking workflow or payment service was introduced or tested.
Safari and licensed Agrandir remain unverified.
