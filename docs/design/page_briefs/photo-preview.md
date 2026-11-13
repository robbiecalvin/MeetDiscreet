# Local Photo Workspace Preview

Status: independent frontend preparation, not account media storage. Routine
visual choices are provisional under Robbie's build-now/revise-later instruction.
Actual media limits, processing, moderation, retention/deletion and quota rules
remain unresolved in the product spec and OPEN-025. This page settles none of them.

The age-gated `?page=photo-preview` route is linked from Provider setup. Use the
shared palette, heading treatment and controls. Choose local test files, compare
a tall 3:4 main-image layout and reorder/remove cards. Two columns fit ordinary
mobile widths, one at 320px and four on desktop. Main-image selection moves a
photo first; moving earlier can also change the main layout. There is no actual
profile assignment, upload, account save or public image URL.

Local technical bounds: four files at a time, 5 MiB per file (UI labelled 5 MB),
20 million decoded pixels, JPEG/PNG/WebP only. Check MIME/header agreement and
image decoding before adding a preview; these client checks are not an approved
server processing or malware-screening pipeline. Reject an over-capacity selection
without replacing existing photos. Within a permitted-size batch, valid files
are added and invalid files produce explicit errors. Use test images only.

Reordering/removal affects only this view; removing a main preview selects the
next image. Clear-all requires confirmation. Removing/clearing/leaving/changing
identity revokes object URLs, and pending decodes cannot restore retired images.
A full reload discards the document's preview state. Device originals are not
modified or deleted. No EXIF stripping, public moderation, secure upload service
or saved-photo selection is implied. Native file controls, descriptive alt text,
status/error messages and focus follow the existing accessible-form approach.

## 2026-11-13 — Photo workspace visual continuation

Continued Robbie’s visual refresh after “next”. Scoped `src/photo-preview.css`
adds a burgundy file chooser, a softly tinted main-preview panel, rounded selection
cards and a clear accent border for the current main preview. Preserve the existing
3:4 crop, one/two/four-column responsive grid, local technical bounds and native
file control. Signed-in headers stack below 450px on this route. No file handling,
object URL cleanup, upload, storage or profile assignment logic changed.
Exact rendering awaits Robbie’s review.

Validation: production build, seven local-photo checks and one mocked sign-out
cleanup check passed. Mocked signed-in renders inspected with screenshots of
existing fictional demo portraits as local test files; no overflow at 320/390/1440px.
No private user media was used. Actual uploads, Safari and licensed Agrandir remain
unverified or unimplemented as tracked elsewhere.
