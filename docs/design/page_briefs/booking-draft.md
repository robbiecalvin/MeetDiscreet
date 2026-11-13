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
Unsaved drafts survive internal navigation; refresh, explicit clear and account
identity changes clear local text. Connected-mode unload warnings apply. Explicit
private saving is available after migration 008 as described below; there is no
extra browser draft persistence or media permission.


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
Unsaved source state stays in memory; explicit private saves include the fixture reference.
Actual subscriber-only requests remain separate.


## Private unfinished-plan storage

Connected mode adds explicit Save private draft, Load my booking plan and Delete
saved booking plan controls. Keep one current private plan per verified owner,
including unfinished fields and validated public-fixture context. No request is sent,
subscriber entitlement granted, quote calculated or time reserved. Storing a reference
is not evidence that a provider, ad, experience or time is live/eligible.

Bind operations to the verified actor and clear local state on identity change.
Save a copied snapshot; edits made during saving remain unsaved. Confirm before
loading over unsaved edits, and preserve text typed while the load is in flight.
An absent record leaves editor text intact; missing schema or errors cannot imply
success or an empty saved record. Deleting requires confirmation, preserves local
editor text as unsaved, and cancels no booking. Clear affects local text only.

Use server RLS and bounded text/date/time formats. These are technical storage
checks, not final duration, booking horizon, availability or DST rules. Unknown
fixture references on load fail visibly rather than silently changing the plan.
No credentials, browser-persisted plan copy or service key is introduced. Account
summaries read only the presence of an owner record, not private plan content.


### Explicit resume navigation

User setup can link directly to `?page=booking-draft&resume=1`. Treat this only as
an explicit owner draft-load action after entrance confirmation and verified account
identity. Use the existing confirmation/error/late-edit protections. Remove the
one-time query action after account verification or cancellation so later route
renders do not repeat a completed or cancelled load. A cached session's startup
identity event must not consume the action before its active view can load. No
payment, reservation, recipient notification or additional persistence is implied.

## 2026-11-13 — Plan editor visual continuation

Continued the requested visual refresh after “next”. Scoped `src/booking-draft.css`
adds a rounded navy form, burgundy-tinted provider snapshot, blush headings and
review labels, softer inputs and rounded actions. Mobile keeps the companion
snapshot above the form and stacks actions; the unsent review retains its semantic
summary and all proposed terms. Private save controls share the panel treatment.
No validation, draft ownership, quote, scheduling or submission logic changed.
Exact rendering awaits Robbie’s review.

Validation: production build, 30 focused booking-draft/profile/Offering checks and
eight mocked private-plan/restore/cleanup checks passed. Form renders inspected at
320/390/1440px with no horizontal overflow; narrow review summary also inspected.
Hosted private-plan operations, Safari and licensed Agrandir remain unverified.
