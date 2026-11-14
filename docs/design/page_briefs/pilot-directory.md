# Text-Only Pilot Directory

Provisional continuation of existing public/account styling under DEC-024/025.
Separate age-gated route `?page=pilot-directory`; main discovery stays fictional
and keeps its approved three-column mobile portrait grid. Footer/account link.

Explicit Profiles/Offering buttons, refresh, and 20+1 keyset paging. Render only
approved owner-selected backend text; no synthetic fallback, photos, online badges,
verified claims, messaging or booking buttons. Profile cards show public name,
username/adult age, area/city and tagline. Offering cards show approved title,
area/city/activity and description. No Looking For data. Responsive two columns
on desktop and one readable text card per row on mobile, separate from photo-grid
requirements. Render all data as text, with line wrapping for descriptions.

Distinguish disabled pilot, backend-disabled preview, enabled empty directory and
network/schema failure. Clear entries before each query; generation/connection guards
discard stale responses. Public backend reads recheck activation, roles, owner
selection and pilot eligibility; a visible selected profile is needed for an ad.
One selected Offering per Provider is supported; multiple visible selections return
no ads. No paid additional-ad capacity is implied.

Activation is seeded OFF in source migration 202611140007, with server-only update
permission. No source migration applied remotely, account granted or public switch
enabled. Source review only; automated tests/build paused, rendering and hosted
behavior unverified. Text-only is an incremental pilot view, not completed live
marketplace/media coverage. Real media, reporting/enforcement, full Looking For
visibility and release validation remain separate requirements.
