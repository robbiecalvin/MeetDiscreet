# Public Companion Profile — PUB-06

## Selected direction

Robbie selected a full-width photo above the profile details; the section order
is introduction, interests, experiences, general rates, and availability.
Use the existing dark palette and Agrandir preference (system fallback until
licensed assets are supplied). Primary action: “Subscribe to connect”; fixed
at the bottom on mobile. Show labelled previews of locked sections.
Discovery needs no visual changes in this increment.

## Scope and access

This is a fictional public frontend profile at `/?profile=<provider-id>`.
Discovery cards link to it; browser back and an explicit discovery link restore
the current filters during in-app navigation. Direct visits and refresh retain
the selected profile through the existing 30-day entrance gate.

Public data includes the name, age, general location, main picture, tagline,
and general-rate/availability empty states. Interests and bio remain member-only;
show labels and explanations without their protected content. Detailed experiences,
additional media, messaging, calls, and booking requests remain subscriber-only.
No protected media URLs or fabricated private originals are supplied.

Show the established $11.99/month per-companion reference subscription price,
with currency and renewal policy explicitly unresolved. The booked experience
is separately priced. The action opens an honest subscription preview explanation;
no checkout, entitlement, login, payment, booking, or calendar integration exists.
No invented rates, available dates, reviews, or verification badges.

## Verification

Check direct visits, age gate destination preservation, invalid profile recovery,
back/forward navigation, filter preservation, locked-content labels, no fake
subscription success, and mobile fixed action without overflow. Inspect desktop
and mobile rendering and rerun discovery regressions. Rendered design awaits review.

## Recorded validation

Vite build and 20 Chromium tests passed (11 discovery regressions, nine profile
checks), including 320/390/700/1024/1440px profiles. Desktop and mobile screenshots
inspected. The photo region preserves the existing fictional portrait with a
softened full-width backdrop on desktop and a filled photo on mobile.
macOS Safari and licensed Agrandir rendering remain unverified.
