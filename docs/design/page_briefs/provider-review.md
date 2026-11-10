# Scoped Staff Provider-Application Review Queue

Route `/?page=provider-review`, linked from Account/Provider setup only after
server-confirmed review access. Provisional dark-layout increment under Robbie’s
instruction to continue the non-payment pilot foundation.

Require both assigned Moderator/Administrator membership and the separate
`provider_application_review` capability. Neither role labels nor editable signup
metadata suffice. Backend checks repeat for every queue/detail request, bound to
the verified reviewer account that opened the workspace. UI hiding is not access
control. No role/capability assignment controls or privileged keys exist in this UI.

List submitted application metadata in oldest-submission-first order with bounded
keyset pagination (20 displayed, one extra row to detect another page). Display
name/city only until explicit inspection loads the submitted introduction. Escape
all applicant text. Do not return draft/withdrawn records, auth contact information,
other profile fields, private media, billing data or audit records.

A withdrawn detail refreshes the queue rather than leaving stale content open.
Access/read errors clear queue and detail data without cached fallback. Account
changes remove the workspace; detached/stale responses cannot populate a new
viewer. Server revocation is enforced on the next request, with no claim of
real-time revocation or erasure of already-seen data. No browser persistence.

Read access is recorded using reviewer ID, operation, target owner where relevant,
and server time; application text is not copied into logs. Capability assignments
have protected change events. Operational audit retention/export remains pending.

Inspection is extended by a separately scoped request-changes form after migration 007.
Pilot approval is now implemented after the later approval migration under DEC-023.
Rejection, identity verification, financial operations and publication remain separate.
Backend-disabled mode shows no private fixtures; missing schema/permissions give
explicit unavailable/denied states and retry. Hosted migration and actual staff
provisioning remain later setup tasks, not completed production operations.


### Version-bound feedback increment

Inspect an immutable submission before requesting changes. Show the feedback form
only with the separate feedback capability and never for the reviewer's own intake.
Require a nonblank note and explicit confirmation. On success refresh the queue;
on failure preserve the note without claiming success. The server rejects stale
versions and repeated requests. Applicants see the escaped note on their own intake,
can save revisions and resubmit; the previous note is hidden during a new submission.
No reviewer identity or feedback is exposed publicly.


## Pilot Provider approval

After inspecting a submitted version, show Approve Provider access only if the server
confirms Administrator membership plus explicit review and approval capabilities.
The feedback capability remains independent. No self-approval. Missing approval
setup keeps permitted inspection/feedback usable without an approval action.

Explain pilot scope, retained User features and separate identity/paid/publishing
checks. Require confirmation bound to the inspected name/version. Lock both feedback
and approval controls during a decision. A successful approval refreshes the queue;
if refresh fails, preserve that distinction instead of claiming the queue refreshed.
Errors say approval could not be confirmed and request a refresh/current-access check.
The server rejects revoked authority, stale/replayed versions, withdrawn/nonpending
records and applicants whose basic User membership was separately revoked.

No real staff assignment or hosted migration is performed. Privileged keys never
enter this UI. Actual Provider eligibility and publishing operations remain future.
