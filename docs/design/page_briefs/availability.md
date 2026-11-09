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
Keep state only in memory during internal navigation, clear it on full refresh,
explicit clear, or account identity change. Connected-mode unload protection treats
schedule edits as unsaved. Do not display a Save action before storage exists.

No reservations, date-specific availability, conflict checking against bookings,
recurrence exceptions, DST date resolution, minimum notice, duration/buffer policy,
public publishing, or confirmed appointment is implemented. These remain dependent
on the scheduling model and booking lifecycle. No financial rule changes.

Validation covers entrance gating, explicit zone selection, overlap and adjacency,
editing/removal, navigation retention, clear/reload, preview and responsive layouts.
