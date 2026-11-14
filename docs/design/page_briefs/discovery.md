# MeetDiscreet — Public Discovery

## Identity and status

- Inventory: PUB-01, with SH-01 entrance gate and PUB-02/PUB-03 ad previews.
- URL: `/`; source: index.html, src/main.js, src/styles.css, src/discovery.css, src/data.js.
- Implementation: frontend prototype using synthetic fixtures.
- Visual direction: selected by Robbie on 2026-11-08; rendered version awaits review.
- Integration: discovery fixtures have no live geolocation, presence, messaging, bookings, or payments. Account entry points connect to the separately configured development authentication flow.
- Delivery: frontend hosted on Netlify; marketplace services remain development work.

## Approved direction

Dark and elegant, using #121521, #38476b, and #b6192e.
Agrandir with bold headings/subheadings and thin regular text is the preferred
typography. Licensed webfont files are not present; Helvetica Neue/Helvetica/Arial
is the temporary fallback. Do not claim the fallback matches Agrandir exactly.

After age confirmation, default to a chat-grid-style directory of nearby service
providers. This describes the card arrangement; it is not a working chat service.
Show the main profile picture, username, age, general location, and online status.
Mobile must show three cards per row, rectangular and taller than wide.

A fixed bottom control switches to ads. Ads are compact cards, one per row,
with Offering and Looking For categories. The return control restores the people
view. Existing search, location, online, and interest filters persist between views.
Ads use newest-first fixture ordering. No paid boosts or placements are simulated.

Desktop uses public navigation, location/search, sign-in, and posting entry points.
Mobile uses compact header actions and a filter drawer. Account and posting entry
points lead to the existing account and private draft flows.

## Entrance behaviour

- Concise confirmation, “I am 18 or older” action, and Exit.
- Remember confirmation for 30 days on the current browser, selected by Robbie.
- Timestamp checked on load; expired, malformed, and future timestamps require confirmation.
- If browser storage is unavailable, confirmation applies only to the current visit.
- Underlying discovery remains hidden and inert until confirmed; Escape cannot dismiss the gate.
- Guidelines, Privacy, and Terms prototype notices remain reachable before confirmation.
- Confirmation keeps the requested path, query, and fragment.
- Exit returns to an external HTTP(S) referrer when available. Direct visits or
  unavailable referrers fall back to https://www.google.com/, selected by Robbie.
- Browser referrer policy can omit or reduce the source URL; exact prior-page
  recovery cannot be guaranteed. No navigation history is collected or persisted.
- Self-attestation does not grant account roles or backend access.

## Data and disclosure

All names, ages, interests, ads, photos, and online statuses are fictional.
The portrait sheet is AI generated and stored locally. The preview uses Vancouver
as an explicitly synthetic default city, with Toronto and Montréal as filter examples.
No device-location permission is requested. Only public-style fixture fields reach
the page. Profiles and Offering ads have dedicated preview pages; Looking For ads
now open [public-summary pages](./looking-for-summary.md), with full-post access still
unresolved. No private User profile or full-post data is added to discovery.
Legal notices are clearly labelled prototype summaries, not final policies.

## Accessibility and responsive behaviour

Use native modal dialogs, labelled controls, visible keyboard focus, status text
in addition to dots, reduced-motion support, and focus return on modal dismissal.
Three columns through 700px; four at tablet widths; five at normal desktop widths;
six on wide desktop. Cards remain portrait rectangles. Ad cards stay one per row.
Fixed bottom controls reserve page space and account for mobile safe areas.

## Acceptance and verification

- Gate blocks normal browsing and persists only for the chosen period.
- Search, online, city, interest, and empty-state reset controls affect results.
- Switching views and ad category works; profile/ad previews open and close.
- Three aligned portrait cards per row on mobile; ads in one column.
- No horizontal overflow at 320, 390, 700, 1024, and 1440px.
- Latest visual refresh: production build and all 223 standard checks passed; desktop/mobile renders and compact ads inspected.
- macOS Safari and actual Agrandir rendering remain unverified in this Linux environment.

See [the roadmap](../../next_steps.md) for current verification outcomes and next work.

## 2026-11-13 visual refresh

Robbie requested a sexier look and feel. Discovery now uses an editorial two-line
headline, a restrained burgundy/navy glow, blush secondary typography, rounded
portrait cards with deeper gradients, subtle hover motion, and a pill-shaped
burgundy view switch. This is a reviewable interpretation, not additional approved
product scope. Existing photos and all fictional-data disclosures remain.
Three portrait cards per mobile row and single-column compact ads are preserved.
Reduced-motion settings disable photo zoom; hovering never lifts a card out of its row. Agrandir still needs licensed files.

## 2026-11-13 — Entrance visual continuation

Continued Robbie’s refresh after “next”. Scoped `src/age-gate.css` adds a
burgundy/navy backdrop, rounded panel/actions, blush secondary headline and
clear keyboard focus. The headline text and all gate actions are unchanged.
The native modal still blocks underlying interaction; overflow scrolls inside
the dialog on short screens. Thirty-day retention, direct-route preservation,
external-referrer Exit and Google fallback remain unchanged.
Exact rendering awaits Robbie’s review.

Validation: production build and 31 discovery/guidelines/help checks passed,
including gate blocking, retention, storage fallback, policies and Exit behaviour.
Inspected 320×568, 390×844 and 1440×1000 renders; no horizontal dialog/document
overflow and Exit remains reachable on the short screen. Safari/Agrandir remain
unverified.

## 2026-11-13 — Shared consistency pass

Signed-in discovery now shares the narrow header layout with profile, account
and draft routes through `src/navigation.css`; removed duplicate per-page header
rules. Disabled buttons have subdued feedback and keyboard focus is consistent.
Unsigned-in layouts, mobile three-column portraits and age-gate semantics remain.

Validation: production build, all 223 standard checks and all 131 mocked backend
browser checks passed. Mocked signed-in 320px overflow checks passed across 14
routes; inspected discovery, profile and conversation renders. This is a local
regression result, not hosted authentication or production-readiness verification.

## Shared surface finishing — 2026-11-14

Filters and information dialogs now share rounded navy/burgundy panels, blush
focus outlines and pill actions. Empty results and the shared footer use matching
spacing and borders, with 44px footer link targets. Inspected filter dialogs at
390 and 1440px and the mobile footer. Three-column mobile portraits preserved.
Automated tests/build temporarily paused at Robbie’s request; visual review pending.
