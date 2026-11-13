# Private User Profile Draft — Partial USR-02

Route `/?page=edit-user-profile`, linked from User setup and Account. This is
separate from the provider profile editor/table. Continue the approved palette,
labelled forms and mobile stack under Robbie’s instruction to keep building.

Collect draft username, adult age declaration and a gender self-description with
an explicit Prefer not to say option (default checked, description cleared/disabled).
Optional fields: display name, general location, interests, languages, What I’m
Looking For and What I Enjoy. Avoid birth dates, exact addresses and contact data.
Photo uploads, orientation and accessibility preferences remain future optional
fields; this partial increment does not remove them from the product requirements.

Partial private saves may omit username/age; a populated age must be an integer of
at least 18. Preview requires a username and adult declaration, but does not check
username availability or establish account eligibility. When not declining gender
disclosure, require a description. Server constraints mirror draft bounds and
preserve non-disclosure. Do not invent a fixed gender taxonomy.

Preview is owner-only with escaped text; no audience tier or public field visibility
is selected by the editor. No provider presentation, publication or role is created.
Sample values are fictional. Clear resets local fields only. Connected mode offers
explicit owner-only save/load/confirmed delete using the separate migration.
Deletion preserves editor text, the auth account and provider drafts. Missing
migration and failed operations must offer retry without claiming success.

State survives internal navigation, resets on identity changes, and uses existing
connected-mode unload warnings. Successful saves mark only the sent snapshot as
saved. Hosted migration application and end-to-end validation remain later setup.

## 2026-11-13 — User editor visual continuation

Continued Robbie’s visual refresh after “next”. Shared scoped
`src/profile-editors.css` adds rounded navy forms, blush headings, matching input
typography, softer controls and a burgundy-tinted draft preview. Existing fields,
privacy choices, audience labels, validation and private save/load/delete behaviour
are unchanged. User and Provider draft data remain separate; no public profile
is published by the preview. Exact rendering awaits Robbie’s review.

Validation: production build, 14 User/Provider editor checks and six mocked
private-profile/save/delete/cleanup checks passed. Inspected form and preview
renders on mobile and desktop; 320/390/1440px overflow checks passed.
Hosted Supabase, Safari and licensed Agrandir remain unverified.
