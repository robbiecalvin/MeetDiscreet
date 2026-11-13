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
