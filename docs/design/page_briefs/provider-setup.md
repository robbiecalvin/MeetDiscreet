# User / Provider Entry and Provider Setup

Implemented under Robbie’s request to continue after identifying the missing
registration choice. Carry forward the approved dark palette and shared account
cards; this is onboarding guidance, not automatic role assignment.

Registration requires an explicit User or Provider radio choice, with neither
preselected for real signup. A fictional example chooses User but never checks
adult confirmation. Store only `onboarding_intent: user|provider` beside the existing
requested username in Supabase user metadata. This is user-editable preference
data and must never enforce roles, publishing, verification, or paid entitlements.

The account overview shows the saved starting point and lets the same login
revisit it. Existing accounts with no preference receive both choices. Saving
Provider opens `/?page=provider-setup`; User opens `/?page=user-setup` with
discovery and private Looking For draft guidance. A failed update retains the previous state
and supports retry. Existing draft tools remain development tools, not permissions.

Provider setup links to profile, experiences, availability, and private listing
management. Per-step saved-status reads are independent; missing migrations do
not imply an empty record or completed setup. No completion percentage, approval
badge, identity verification, publishing, or payment status is invented. Signed-out
visits require sign-in; backend-disabled visits show a labelled preview.

Full account role combinations, provider eligibility/approval, public publishing,
and commercial access remain separate backend/product work. This increment does
not claim those policies were resolved by choosing an onboarding preference.

User setup opens the Looking For library context and Provider setup opens Offering.
New listing actions preselect that type; the shared owner library remains able to
show both. This navigation does not grant posting access or assign account roles.
