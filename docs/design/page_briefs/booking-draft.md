# Booking Request Layout Preview — Partial USR-09

Route `/?page=booking-draft`, linked from User setup and Account. Provisional
frontend increment under Robbie’s instruction to continue building and review
later. Reuse the existing palette and forms, with a fictional public-provider
snapshot beside the desktop form and above the mobile form.

Collect fictional provider, public activity idea, proposed calendar date, local
start time, explicit IANA time zone, positive whole-minute duration, and optional
venue/general area, unpriced expense proposals and notes. Do not infer a launch
region, appointment time zone, duration policy or real experience catalogue.

Validate UI format: real Gregorian calendar dates, HH:mm times, supported zones,
known fictional provider/activity IDs and safe integer minutes. These checks do
not validate future eligibility, date-specific availability, DST ambiguity/gaps,
subscriptions or authoritative scheduling. Commercial duration limits and booking
horizons remain pending. Do not convert local drafts into confirmed UTC instants.

Review safely escaped values as an unsent draft. Show no calculated estimate or
deposit; never display zero as a substitute for an unimplemented quote. Expenses
are proposed text, not agreed charges. No Send, Pay, reservation, approval or fake
success action is implemented. Real presentation/experience/add-on selection,
server quotes, eligibility checks, agreement versions and submission remain future
work under the booking lifecycle and pricing documents.

The fictional sample date is one calendar week after the current Vancouver date,
paired with an explicit Vancouver zone, not a real provider’s availability.
Drafts survive internal navigation only; refresh, explicit clear, and account
identity changes clear them. Connected-mode unload warnings apply. No backend
writes, browser draft persistence, media permission or new migration is needed.


## Public profile-to-plan preview continuity

Public fictional profiles offer a secondary Preview a booking plan link alongside
the existing subscription explanation. The link opens the age-gated unsent preview
with a validated fictional provider ID. This grants no subscriber booking access.
An empty plan adopts the selected person; revisiting the same person preserves edits.
Opening another profile preserves the current draft and offers Start a new draft
with that person, requiring confirmation before clearing all old plan fields.
Cancellation keeps the original plan. Unknown IDs show a generic unavailable-context
message without rendering query text. View fictional profile supports internal
navigation back to the selected person's public preview while retaining draft text.
Native modified clicks retain ordinary links; reload/new tabs still have no saved draft.


## Source Offering continuity

An Offering's secondary Preview a plan from this ad link carries only validated
public fixture IDs. Confirm the source is an Offering and belongs to the selected
provider. Looking For, unknown or mismatched sources are rejected with generic copy.
An Offering-only deep link can derive its fixture provider. A new empty plan records
the source title; an existing plan requires confirmed replacement to change source,
even for the same person. Profile previews reached through an Offering retain that
source when continuing to the plan. The public source title and return link appear
beside the form; review includes the title without treating it as an agreed
experience, catalogue selection, price or available date. Manually switching provider
clears the prior source; the fictional sample and Clear controls also discard it.
All source state stays in memory. Actual subscriber-only requests remain separate.
