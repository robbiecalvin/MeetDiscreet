# Listing Draft Editor — USR-05 / COM-08

Provisional frontend design under Robbie’s delegation to continue building.
Route: `/?page=create-listing`, reachable from Post a listing and the footer.
Use the existing palette, labelled form sections, responsive stacked fields,
and a clear edit → preview → edit loop.

Offering and Looking For are selectable draft types. Collect only a public-style
title, description, demo city, general area, and activity. No exact addresses,
private contacts, uploads, financial fields, entitlement balances, or published
status. Show the author as a demo companion or demo member without assigning
an account role. Sample text is fictional and replaceable.

Validate required fields, title/description bounds, and whitespace-only input.
Render preview text safely. Keep draft data only in memory during this page
session; refreshing loses it. No network submission, local persistence, real
accounts, allowances, boosts, purchases, saves, or publishing. State this before
the form and preview. Looking For preview is author-only draft demonstration,
not a decision about public full-post visibility.

Allow sample fill, preview, edit, clear, and return to discovery. Preserve current
values when moving between in-app pages; clear on full reload. A native preview
within the page must be keyboard reachable and announce validation errors.

Check navigation/direct visits/age gate, validation, XSS-safe text, both draft
types, edit persistence, clearing, refresh behaviour, no network submission, and
320/390/700/1024/1440px layouts. Safari and Agrandir remain unverified.

## Recorded verification

Vite build and 50 Chromium tests passed: 40 regressions and 10 editor checks.
Tested age-gated navigation, required/whitespace input, safe markup rendering,
no network submission, both categories, edit/focus behaviour, memory retention,
clear/refresh, and five responsive widths. Desktop/mobile form and preview
screenshots inspected. No real posting or live deployment validation claimed.


## Saved private draft management

When the development backend is enabled, show whether saving creates a new draft
or updates the selected saved draft. “Start a new draft” clears editor selection
without deleting server data. Loaded draft choices show listing type and city.
Each saved draft has a labelled delete action with confirmation and retry feedback.
Deleting the selected saved record preserves editor text as a new unsaved draft.
This does not publish, change posting allowances, or alter public discovery.


## Saved listing library

`/?page=my-listings` is an age-gated, owner-only development workspace linked from
Account. Show saved titles, draft types, city/area, and activities. Search these
fields locally and combine with Offering/Looking For filtering; provide clear
filters, refresh, empty, no-match, loading, retry/sign-in states. Cards link to
`/?page=create-listing&draft=<id>`; direct loading must query by authenticated
owner and record ID. Missing records leave blank fields with unavailable feedback,
never an unrelated previous draft. Start-new clears editor selection without
deleting saved data. Use stacked cards/labelled controls on mobile. No public
listing detail, publishing, eligibility, or entitlement rule is added.


Library management adds recently-updated/oldest/title sorting, unsaved duplication,
and confirmed deletion. A duplicate loads only the authenticated owner’s source,
clears its saved association and source URL, and inserts a separate record only
when Save is pressed. The source title/content remain unchanged. Library deletion
keeps failed cards with retry feedback; successful deletion detaches any retained
editor snapshot from the deleted record without erasing local text.
