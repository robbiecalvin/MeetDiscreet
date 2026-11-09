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
