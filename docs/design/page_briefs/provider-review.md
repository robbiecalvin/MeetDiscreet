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

This queue is read-only for applications/roles: no approval, rejection, financial
operation, provider permission grant or publication is implemented. Decisions need
a separate capability, approved eligibility/conflict rules and version checks.
Backend-disabled mode shows no private fixtures; missing schema/permissions give
explicit unavailable/denied states and retry. Hosted migration and actual staff
provisioning remain later setup tasks, not completed production operations.
