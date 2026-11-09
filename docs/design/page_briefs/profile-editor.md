# Companion Profile Draft Editor — COM-02

Provisional UI under Robbie’s instruction to keep building and revise later.
Route: `/?page=edit-profile`; link from registration preview and the footer.
Use the existing labelled form/preview patterns and demo portraits.

Editable public-style fields: display name, username, adult age, tagline,
demo city/general area, and a fictional main photo. Member-only draft fields:
biography and interests. No precise address, contact details, real upload,
financial inputs, roles, verification, publishing status, or entitlements.

Provide a fictional example, clear, preview, and return-to-edit controls. Audience
buttons show visitor/member/subscriber layout previews of the current draft only;
they never grant account access. Visitor preview shows labels instead of member
bio/interests. Subscriber preview includes a labelled unconnected media/experience
section without real assets. The owner’s editor necessarily holds their own
entered synthetic draft; this is not server-side private-data authorization.

Validate required public identity fields and whole-number age of at least 18;
username uniqueness and real eligibility remain unimplemented. Field length bounds
are provisional demo controls, not approved production profile policy.
Draft stays in memory through in-app navigation and clears on full refresh.
No profile is saved/published, no discovery fixture is mutated, and no data is
submitted. Actual ownership, restricted responses, storage, and authentication
remain prerequisites for real editing.

Test direct/gated navigation, invalid fields, safe text rendering, preview tiers,
edit retention, clearing/refresh, unchanged discovery, no network/storage writes,
registration entry, and 320/390/700/1024/1440px layouts. Inspect screenshots.

## Recorded verification

Vite build and all 92 Chromium checks passed (82 regressions plus ten editor
checks). Tested required/age validation, safe text, preview audience boundaries,
draft/edit retention, clear/refresh, unchanged public fixtures, no network/storage
writes, registration entry, and five responsive widths. Desktop form and mobile
member-preview screenshots inspected. Actual ownership, authentication, private
storage, Safari/Agrandir, and live Netlify deployment remain unverified.


## Saved draft deletion

Connected development mode includes “Delete saved profile draft”. Confirm before
sending an owner-filtered delete. This removes only the stored profile draft, not
the authentication account, listings, or editor text. Disable save/load/delete
while an operation is pending. Distinguish deleted, no saved record, and failed
operations; a failure must allow retry without claiming success. Demo mode has
no delete action or database request.
