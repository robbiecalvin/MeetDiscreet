# Availability Draft — Partial COM-06

Provisional frontend increment under Robbie’s instruction to continue building and
review later. Route `/?page=availability`, linked from Account and companion draft
tools. Reuse the dark palette, labelled fields, stacked mobile layout and restrained
weekly cards. This is a schedule sketch, not live booking availability.

Choose an explicit IANA time zone; never infer the launch region or silently
convert times. Changing zone retains local wall-clock times. Add, edit, cancel,
and remove weekday time windows. Start/end use 24-hour HH:mm input, require end
after start, and reject overlapping windows on the same weekday while allowing
adjacency. Overnight windows are an editor limitation, not a product prohibition.
Monday-first sorting is presentation only.

Preview added windows with their time zone; unfinished composer edits are excluded.
Unsaved state remains in memory during internal navigation and clears on full
refresh, explicit clear, or account identity change. Connected mode now supports
explicit private save/load/delete through the separate availability migration. Connected-mode unload protection treats
schedule edits as unsaved. A missing hosted migration produces retry feedback without claiming success.

No reservations, date-specific availability, conflict checking against bookings,
recurrence exceptions, DST date resolution, minimum notice, duration/buffer policy,
public publishing, or confirmed appointment is implemented. These remain dependent
on the scheduling model and booking lifecycle. No financial rule changes.

Validation covers entrance gating, explicit zone selection, overlap and adjacency,
editing/removal, navigation retention, clear/reload, preview and responsive layouts.


## Private storage increment

Save a snapshot of added windows and the explicit time zone; unadded composer
edits remain unsaved. Load restores local IDs and clears composer edits. Confirmed
deletion removes only the stored sketch and preserves the editor and auth account.
Account summary shows the saved window count and time zone, independently of
other draft status. Storage does not make the sketch bookable or public.

## 2026-11-13 — Provider draft-tool visual continuation

Continued Robbie’s refresh after “next”. Shared scoped
`src/provider-draft-tools.css` adds rounded navy forms, blush headings, matching
inputs, burgundy actions and softly tinted catalogue/window cards. Signed-in
headers stack below 450px on these routes. Existing currency-pending labels,
amount parsing, explicit schedule zones, overlap validation, preview boundaries
and owner-only save/load/delete behaviour are unchanged. No charge, reservation
or public availability is created. Exact rendering awaits Robbie’s review.

Validation: production build, 16 catalogue/availability checks and eight mocked
catalogue/schedule checks passed. Inspected mocked signed-in mobile/desktop
renders; no overflow at 320/390/1440px. Hosted storage, Safari and licensed
Agrandir remain unverified by this presentation increment.
