# Owner Pilot Visibility Selection

Provisional continuation of the existing owner-copy/account styling. DEC-024
retains approved versions during replacement review; DEC-025 defines the invited
no-charge development pilot. Public read endpoints now exist in source, with activation defaulting OFF.

After checking a profile or Offering copy’s editorial approval, owners can explicitly
check the selected version for that resource. Show no selection, hidden selection,
this exact version selected, another version selected, or unavailable. These labels
never claim actual public visibility. No automatic per-copy visibility fetches.

Confirmed Select uses this approved submission ID; drafts and subsequent approvals
do not change it. Require current User+Provider and current backend eligibility.
Replacing a different selection is explicit. Hide names the currently selected
resource and may hide a different approved version; it preserves the selected ID,
drafts and approvals. Hiding works after role/eligibility loss. Both mutations use
the inspected revision; failures clear action state and require a fresh read.

Looking For selections are unavailable until the separate visibility policy is
resolved. Offering selection is not an allowance grant; live activation must enforce
posting capacity before public exposure. No automatic switch to latest approval.
An earlier approved version can remain selected while a replacement is reviewed.
Submission withdrawal does not remove editorial approval or its separate selection.

Source migration 202611140006 is unapplied. Source reviewed only; tests/build
paused, rendering, SQL/concurrency and hosted behavior unverified. No real owner
selection or public data exposure was performed by this code increment.

Public selection wording now accounts for later activation: selecting an approved
copy may expose it when the directory is enabled and all current eligibility checks
pass. The selection action never enables the global directory switch. Readiness
shows endpoint connection and activation as separate facts.
