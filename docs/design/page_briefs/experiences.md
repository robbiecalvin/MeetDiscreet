# Experience Catalogue Draft — COM-05 (partial)

Provisional frontend catalogue at `/?page=experiences`, linked from the profile
editor through a small shared draft-tool navigation. Use existing form, card,
and audience-preview styling. This increment is detailed experience authoring,
not public general-rate setup or a booking quote.

Each item has a title, description/restrictions, offered toggle, included-in-hourly-
rate toggle, and a one-time/hourly extra amount when not included. Disable and clear
extra inputs when included. Add/edit/remove draft items and use fictional examples.
Keep catalogue and composer in memory only; full reload clears them.

Store draft extras in integer minor units, using exact two-decimal parsing without
floating-point multiplication or rounding. The two-decimal input is a provisional
demo format; no currency, tax, minimum booking, surcharge policy, or live charge is
selected. Display amounts as currency-pending, never a payable total. Preserve
all established platform prices unchanged.

A visitor preview shows labels only; a subscriber-layout preview shows offered
synthetic draft items. Not-offered items remain in the owner list but are excluded
from that preview. Neither mode grants account access. No save/publish, checkout,
backend storage, role assignment, or change to public discovery/profile fixtures.

Validate required titles, exact decimal input, included/extra behaviour, edit/remove,
preview tiers, in-memory retention, reload clearing, no network/storage writes,
linked tools, and five responsive widths. Inspect desktop and mobile rendering.

## Recorded validation

Build and all 103 tests passed: 92 regressions plus 11 catalogue checks, including
exact amount parsing at precision/overflow boundaries, included/extra clearing,
edit/remove, safe text, previews, repeatable sample fill, in-memory navigation,
reload clearing, no network writes, and five widths. Desktop/mobile screenshots
inspected. Real billing, storage, permissions, Safari/Agrandir, and live Netlify
deployment remain unverified/unimplemented as applicable.
