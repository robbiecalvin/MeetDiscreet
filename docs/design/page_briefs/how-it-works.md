# How It Works and Reference Plans — PUB-08

Provisional design under Robbie’s delegation to keep building and revise later.
Use the existing dark palette, typography fallback, restrained cards, and clear
mobile layout. Route: `/?page=how-it-works`, linked from the header and footer.

Explain users’ discovery/member/subscription/booking journey and companions’
profile/publishing/advertising journey with a working audience toggle. Show
separate reference cards for companion subscriptions, premium user membership,
and monthly/annual companion publishing. Preserve the exact established prices,
keep currency/renewal/cancellation terms pending, and do not imply checkout works.
Subscriptions are per companion, premium provides posting benefits only, and
publishing grants neither subscription access nor administrative privileges.
Do not turn the proposed deposit or posting interpretations into confirmed rules.

Use native FAQ disclosures, useful return-to-discovery links, and accurate preview
limits. Development authentication/private drafts are available when configured. Public
publishing, payments, messaging and live bookings remain unconnected. Page content is product explanation, not final legal documents.

Validate direct visits through the age gate, refresh/history, audience switching,
price and entitlement distinctions, FAQ keyboard behaviour, navigation/focus,
and overflow at mobile and desktop widths. Inspect rendered screenshots.

## Verification results

Vite build and 40 Chromium checks passed: 31 existing checks plus nine How it
works checks covering age-gated direct visits, journeys, plan distinctions,
keyboard FAQ interaction, browser history, footer navigation, and five widths.
Desktop and mobile screenshots inspected. macOS Safari and licensed Agrandir
rendering remain unverified; no live Netlify verification claimed.

## 2026-11-13 — Public explainer visual continuation

Continued Robbie’s refresh after “next”. Scoped `src/how-it-works.css` adds a
larger editorial headline, burgundy journey selection, rounded navy journey cards,
softly tinted reference-plan panels and rounded FAQ disclosures. All prices,
entitlement distinctions and pending policies are unchanged; no checkout or
publishing action was introduced. Exact rendering awaits Robbie’s review.

Validation: production build and 20 focused How it works/discovery checks passed.
Inspected mobile intro/journey and desktop reference-plan renders; no overflow at
320/390/1440px. FAQ keyboard behaviour and journey switching remain covered by
existing tests. Safari and licensed Agrandir remain unverified.
