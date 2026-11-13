# Saved Draft Reference Download

Route `/?page=draft-backup`, linked from Account. Continue the established palette,
form controls and mobile-first Account tools under Robbie's instruction to keep
building. This is a reference copy of selected saved drafts, not an import tool,
complete account archive or completed privacy-rights workflow.

Require the entrance gate and a verified account. Backend-disabled mode exposes
no download control or private records; signed-out mode offers sign-in. Leave all
draft types unchecked initially. Only an explicit nonempty selection starts reads.
Offer Provider/User profiles, listings, catalogue, availability and the unsent plan.
Do not query or serialize Auth user/session objects, applications, staff/audit data,
private media or unrelated records. Unsaved editor input is excluded. Free-form
saved text remains private and may contain personal material: tell users to keep
the downloaded file private, without claiming credential/secret detection.

Use owner-filtered RLS queries and explicit field projections; verify returned owner
IDs and fields and recheck the verified actor before preparing a file. Clear/detach
on identity changes. Navigation/sign-out during preparation must prevent a late
file. No custom cache or browser draft storage. Use a short-lived Blob URL for the
explicit download and revoke it afterward. No server upload or recipient exists.

All selected reads must succeed before creating any file. Empty saved sets become
empty arrays; missing tables and read errors are unavailable, not empty successes.
Listings request an exact count and up to 1,000 rows. If returned count/rows differ,
fail visibly rather than silently truncating. These are technical download limits,
not posting allowances. Cap the serialized file at 10 MiB and allow fewer selected
types on retry. The download is not a transactionally consistent account snapshot.

Format: JSON `meetdiscreet-saved-drafts`, version 1, retrieval time in ISO UTC and
selected arrays keyed by draft type. Preserve saved text, date/time/zone and minor
amount fields without interpreting prices or availability. Exclude owner IDs and
unselected top-level fields. File name is fixed and contains no account identity.
Say download prepared/check browser downloads, not that the device saved the file.
Move focus to the prepared-download result for a clear keyboard/screen-reader outcome.
No permission grants, SQL migration, import, payment or publishing action.

## 2026-11-13 — Download workspace visual continuation

Continued Robbie’s refresh after “next”. Scoped `src/draft-backup.css` adds
rounded selection cards, a distinct status panel and matching typography/actions.
Selected checkboxes retain their native checked state plus an accent border;
keyboard focus also outlines the option card. All options still start unchecked.
No data projections, owner checks, file scope, download timing or storage rules
changed. This remains a selected saved-draft reference copy, not an account archive.
Exact rendering awaits Robbie’s review.

Validation: production build, one backend-disabled route check and four mocked
download/ownership/completeness/cleanup checks passed. Mocked signed-in mobile/
desktop renders inspected; no overflow at 320/390/1440px and no initial selections.
Hosted access, Safari and licensed Agrandir remain unverified.
