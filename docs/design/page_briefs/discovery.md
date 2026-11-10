# MeetDiscreet — Public Discovery

## Identity and status

- Inventory: PUB-01, with SH-01 entrance gate and PUB-02/PUB-03 ad previews.
- URL: `/`; source: index.html, src/main.js, src/styles.css, src/data.js.
- Implementation: frontend prototype using synthetic fixtures.
- Visual direction: selected by Robbie on 2026-11-08; rendered version awaits review.
- Integration: no backend, live geolocation, accounts, presence, messages, bookings, or payments.
- Delivery: prepared for authorized GitHub source delivery; no production deployment.

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
points explain that integration is unavailable rather than showing fake success.

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
- Production build passed and 11 Chromium tests passed; desktop/mobile screenshots inspected.
- macOS Safari and actual Agrandir rendering remain unverified in this Linux environment.

See [the roadmap](../../next_steps.md) for current verification outcomes and next work.
