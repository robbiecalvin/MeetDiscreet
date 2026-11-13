# Help — PUB-10

Provisional design under Robbie’s delegation: short introduction, labelled FAQ
search, topic filter, native expandable answers, clear empty/reset state, and
links to discovery, How it works, listing drafts, and guidelines.

Route: `/?page=help`. Reachable from the age gate and footer without age
confirmation. Keep discovery hidden/inert for unconfirmed visitors. Reading help
does not record age or acceptance; links into ordinary browsing re-open the gate.
Return preserves the source route, and browser history must respect the boundary.

Explain actual demo behaviour: fictional profiles, reference-only plans, locked
preview labels, draft memory/refresh behaviour, and unavailable accounts/payments/
communication. No invented support inbox, email address, report form, ticket ID,
response time, refund policy, or moderation capability. Live support and reporting
are explicit pending integrations; an information page is not a report channel.

Check search/topic combinations, keyboard disclosure, empty reset, pre-gate access,
no age flag, direct visits/reload/history, linked-route gate protection, return,
and 320/390/700/1024/1440px layout. Inspect rendered desktop/mobile views.

## Verification

Desktop/mobile views inspected, build passed, and focused Help checks passed
after correcting the topic select’s label association. The final full suite passed all
70 checks, including ten Help checks for search/filter/reset, keyboard access,
nested public-page history, age boundaries, and five responsive widths.
Safari, licensed Agrandir, and live Netlify verification remain outstanding.

## 2026-11-13 — Public reader visual continuation

Continued Robbie’s refresh after “next”. Shared scoped `src/public-readers.css`
adds editorial headings, blush accents, rounded Help search/answer panels and
clearer guidelines jump navigation. Body content, policy meaning, public access
and return/Exit behaviour are unchanged. No acceptance, report or support
integration was added. Exact rendering awaits Robbie’s review.

Validation: production build and 31 Help/guidelines/discovery checks passed.
Inspected mobile Help and desktop guidelines renders; 320/390/1440px overflow
checks passed. Direct public visits create no age-confirmation flag. Existing
tests cover search, topics, keyboard disclosures, jumps and navigation boundaries.
Safari and licensed Agrandir remain unverified.

History focus now scrolls a valid fragment within the active public reader into
view and focuses it. Without a valid reader fragment, return to the reader’s top
and main landmark. Fragments cannot select hidden application content. Public
access and age-confirmation boundaries are unchanged.
