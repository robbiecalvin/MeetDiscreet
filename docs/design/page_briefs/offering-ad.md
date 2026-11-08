# Offering Ad Detail — PUB-05

## Direction and scope

Robbie approved the proposed recommendations and delegated routine provisional
visual decisions so work can continue without a questionnaire for each increment.
Use a compact provider header above the ad, followed by title, description,
general location, general rate, and availability. Primary action: “View companion
profile”, fixed at the bottom on mobile. Show up to three other Offering ads from
the same demo city beneath the main content as a provisional related-ad treatment.
Preserve the existing palette, typography fallback, and compact ad-card style.

Route: `/?ad=<offering-id>`. Offering titles and “View ad” open this page. A provider
link opens the matching public profile, with a way back to the ad. Direct visits,
refresh, age-gate preservation, invalid-ad recovery, browser back/forward, and
return to the filtered ad list must work. Query routes require no host rewrites.

Only fictional public Offering information is shown. No member biography,
restricted experiences, private-media assets, payment, booking, or chat is added.
General rate and availability remain explicit empty states when fixture data is
absent. No verification, live presence, availability, rates, boosts, or sponsored
placement is fabricated. Looking For details remain a limited preview because
full-post visibility is still unresolved in the access matrix.

## Validation

Build, discovery/profile regressions, Offering direct visits and refresh, related
ad navigation, provider/return links, invalid or wrong-category recovery, and
mobile fixed-action/overflow checks. Inspect desktop and mobile screenshots.
Visual details remain revisable; actual Agrandir and macOS Safari are unverified.

## Recorded verification

Vite build and all 31 Chromium tests passed: 20 existing discovery/profile
checks plus 11 Offering checks. Desktop and 390px mobile screenshots inspected;
automated overflow/action checks cover 320, 390, 700, 1024, and 1440px.
No live Netlify verification is claimed because the environment blocks its domain.
