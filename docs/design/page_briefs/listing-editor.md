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
