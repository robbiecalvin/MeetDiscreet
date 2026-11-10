# MeetDiscreet — Application Security

## 1. Purpose and Status

Define the security requirements for MeetDiscreet’s accounts,
private information, media, payments, bookings, and operations.

This is a security specification.
It does not establish that controls have been implemented or verified.

Read alongside:

- ../../AGENTS.md
- ../architecture/application_architecture.md
- ../architecture/environment.md
- ../architecture/data_model.md
- ../product/access_matrix.md
- ../product/pricing_and_payments.md
- ../product/booking_lifecycle.md
- ../product/content_and_boundaries.md
- ../development/launch_acceptance.md

Provider-specific configuration must be confirmed against the
selected services and actual deployment.

## 2. Security Objectives

Protect:

- Account ownership.
- Private profile information.
- Subscriber-only media.
- Private conversations and attachments.
- Booking locations and agreements.
- Financial records.
- Administrative capabilities.
- Verification information.
- System integrity and availability.

Do not promise absolute security, anonymity, or participant safety.

Describe only controls that actually exist.

## 3. Threat Model

Assess relevant threats including:

- Account takeover.
- Unauthorized record access.
- Cross-companion subscription bypass.
- Public leakage of restricted media.
- Stored or reflected script injection.
- Malicious uploads.
- Payment-event forgery or replay.
- Price manipulation.
- Double spending of allowances.
- Concurrent booking conflicts.
- Spam and harassment.
- Scraping of sensitive information.
- Administrative misuse.
- Secret exposure.
- Dependency compromise.
- Misconfigured preview environments.

Update the assessment when architecture or product scope changes.

## 4. Trust Boundaries

Treat these as distinct boundaries:

- Browser and user input.
- Authentication service.
- Application API.
- Database.
- Object storage.
- Payment provider.
- Realtime infrastructure.
- Calling service.
- Background processing.
- Administrative interface.

Validate identity, input, and authorization at the relevant trusted boundary.

Do not assume a request is legitimate because it originated from
the intended interface.

## 5. Authentication

Use an established authentication implementation.

Verify relevant:

- Registration.
- Sign-in.
- Confirmation.
- Recovery.
- Session refresh.
- Logout.
- Account restriction.
- Credential changes.

Prevent account enumeration where practical.

Apply appropriate protection against repeated authentication attempts.

Do not:

- Store plaintext passwords.
- Log credentials.
- expose recovery tokens.
- Build custom password cryptography.
- Treat a frontend account object as proof of identity.

Configure authentication redirects explicitly for each environment.

Do not accept arbitrary redirect destinations.

## 6. Sessions

Use the selected provider’s supported session mechanism.

Define:

- Token or cookie storage.
- Session lifetime.
- Refresh behaviour.
- Logout and revocation.
- Compromised-account handling.
- Multiple-device behaviour.

Where cookies are used, configure appropriate security attributes
and CSRF protection.

Where bearer tokens are used, minimize exposure and account for
the consequences of script injection.

Do not assume one session-storage approach is universally correct.

Sensitive actions may require recent authentication according
to the approved risk model.

## 7. Authorization

Enforce:

- Role.
- Ownership.
- Visibility.
- Companion-specific subscription.
- Publishing eligibility.
- Premium allowances.
- Conversation membership.
- Booking participation.
- Account restrictions.
- Applicable blocking rules.

Reject unauthorized requests even when the caller knows a valid record ID.

Do not rely on:

- Hidden buttons.
- Disabled inputs.
- Frontend route guards.
- Browser storage flags.
- Unpredictable URLs.
- Client-supplied role claims.

Use the access matrix as the detailed permission specification.

Deny unassigned privileged capabilities.

## 8. Database Permissions

Implement authorization through trusted backend logic,
database policies, or an explicitly designed combination.

Verify that direct service access cannot bypass intended restrictions.

Apply appropriate:

- Row ownership.
- Field exposure.
- Write permissions.
- Constraints.
- Transaction controls.
- Service-role restrictions.

Never expose privileged database credentials in browser code.

Do not allow account owners to modify their own:

- Roles.
- Verification.
- Payment state.
- Entitlements.
- Financial balances.
- Boost grants.

Administrative overrides require explicit authority and auditability.

## 9. Public and Restricted Responses

Construct API responses deliberately.

Public responses must not contain restricted fields merely because
the interface does not display them.

Check:

- Profile responses.
- Listing results.
- Search indexes.
- Page metadata.
- Structured data.
- Notifications.
- Error messages.
- Export files.
- Browser fixtures.

Do not expose full records through generic serialization.

Precise meeting locations and private account details require
appropriate participant or operational access.

## 10. Frontend Injection Protection

Render user-provided plain text using safe text APIs.

Do not insert untrusted content into:

- innerHTML.
- Script blocks.
- Event-handler attributes.
- Styles.
- Unvalidated URLs.

If rich text is required, use an approved sanitization strategy.

Validate link protocols and destinations appropriately.

Use framework or template escaping correctly if such tooling is selected.

Configure suitable browser security headers through the host.

A Content Security Policy can provide defence in depth.
It does not replace safe rendering and authorization.

## 11. Request Security

Validate request shape, types, lengths, and permitted values.

Use parameterized database queries.

Protect state-changing requests against CSRF where the architecture requires it.

Configure CORS for intended origins.

CORS is not authentication or authorization.

Avoid server-side requests to arbitrary user-supplied destinations.
If URL fetching is required, design explicit SSRF protections.

Do not expose internal diagnostics through public errors.

## 12. Upload Security

Before enabling uploads, define:

- Allowed file types.
- Maximum sizes.
- Video-duration limits.
- Processing workflow.
- Storage quotas.
- Content review.
- Malware-handling strategy.
- Failure cleanup.

Do not trust filename extensions or browser-provided MIME types alone.

Use safe generated storage names.

Prevent executable uploads from being served as active application content.

Handle unsupported or failed processing explicitly.

Do not expose an upload publicly before required validation is complete.

Avoid importing remote files from arbitrary URLs without a separate
security design.

## 13. Private Media

Keep protected originals in private storage.

Authorize:

- Upload.
- Attachment.
- Read.
- Replacement.
- Deletion.
- Moderation access.

Use scoped temporary access where appropriate.

Define access duration and revocation limitations.

Do not:

- Put private originals in GitHub.
- Include them in static build output.
- Use permanent public URLs for restricted assets.
- Conceal public originals with CSS blur.
- Log signed access URLs.

Use separate safe previews.

Authorization reduces unauthorized retrieval.
It cannot guarantee that an authorized viewer will not copy content.

Do not advertise technical controls as preventing all redistribution.

## 14. Payments

Use a suitable payment provider and its supported collection methods.

Do not store full payment credentials unnecessarily.

The backend determines:

- Product.
- Eligibility.
- Amount.
- Currency.
- Applicable quote.
- Entitlement consequence.

Reject client-edited financial values.

Use idempotency for consequential provider operations.

A successful checkout redirect does not prove payment.

Keep test and live payment environments separate.

## 15. Payment Events and Reconciliation

Verify provider event authenticity using the supported mechanism.

Check:

- Provider reference.
- Event identity.
- Expected account or purchase association.
- Amount and currency.
- Relevant state.
- Processing history.

Protect against duplicate and out-of-order events.

Record processing outcomes safely.

Provide reconciliation for:

- Missed events.
- Interrupted processing.
- Provider-side changes.
- Refund discrepancies.
- Payout failures.

Do not duplicate allocations or entitlements when events repeat.

Do not log unnecessary raw payment payloads.

## 16. Financial Integrity

Use explicit currency and integer minor units.

Protect:

- Price definitions.
- Accepted quotes.
- Revenue allocations.
- Refund limits.
- Payout records.
- Allowance consumption.

Financial adjustments must be attributable and explainable.

Do not maintain an editable number as the sole balance authority.

Prevent unauthorized staff or account owners from silently rewriting
historical transactions.

Financial-policy decisions belong in pricing_and_payments.md.

## 17. Booking Integrity

Enforce:

- Participant identity.
- Valid state transitions.
- Accepted quote version.
- Availability.
- Reservation validity.
- Payment conditions.
- Amendment acceptance.

Protect against concurrent conflicting confirmations.

Do not trust disabled buttons to prevent duplicate actions.

Preserve accepted terms and relevant policy versions.

Handle late payments and expired reservations through the approved process.

Protect private venue information.

## 18. Messaging and Realtime Access

Authorize:

- Conversation membership.
- Message submission.
- History access.
- Attachments.
- Read receipts.
- Realtime subscriptions.

Do not allow a valid session to subscribe to arbitrary private channels.

Apply subscription and blocking rules at the trusted boundary.

Use bounded request and attachment limits.

Prevent notifications from exposing restricted conversation content.

Define retention and deletion before release.

Do not claim end-to-end encryption unless the implemented protocol
actually provides it and its limitations are understood.

## 19. Calling Security

Use authorized, scoped call sessions.

Protect:

- Invitations.
- Acceptance.
- Signaling.
- Connection credentials.
- Session termination.

Use expiring credentials where supported.

Do not permit unrelated accounts or operational staff to join
private calls merely because they know a call identifier.

Request camera and microphone access only when relevant.

No recording is enabled by default.

Verify the selected service’s actual security properties before
making encryption or confidentiality claims.

## 20. Abuse Prevention

Apply proportionate controls to:

- Registration.
- Sign-in.
- Messaging.
- Calling.
- Posting.
- Boosting.
- Uploads.
- Reports.
- Checkout creation.
- Search and discovery requests.

Possible controls include:

- Rate limits.
- Quotas.
- Duplicate detection.
- Risk-based challenges.
- Account restrictions.

Select controls based on actual threats and usability.

Do not equate all unusual behaviour with abuse.

Provide appropriate reporting and blocking without requiring payment.

## 21. Administrative Access

Use explicit staff capabilities.

Separate where appropriate:

- Content moderation.
- Private-evidence review.
- Account restrictions.
- Financial reconciliation.
- Financial adjustments.
- Role management.
- Audit review.

Require strong authentication, including MFA for privileged accounts
before production operational access.

Apply least privilege.

Avoid silent impersonation.

Record consequential actions with actor, target, reason,
timestamp, and outcome.

Define how privileged access is granted and revoked.

## 22. Privacy and Verification Data

Collect only information needed for the approved product and operations.

Restrict access to:

- Identity verification.
- Precise locations.
- Private requests.
- Support evidence.
- Financial details.

Do not retain document images by default if a provider result
or reference meets the actual requirement.

Define retention and deletion explicitly.

Do not treat the entrance age gate as verified identity or age.

## 23. Logging and Audit

Log useful operational facts without exposing sensitive content.

Appropriate information may include:

- Safe record identifiers.
- Event type.
- State transition.
- Correlation identifier.
- Failure category.
- Authorized actor.

Exclude:

- Passwords.
- Tokens.
- Secret keys.
- Private message bodies.
- Payment credentials.
- Signed media URLs.
- Unnecessary personal details.

Restrict log access and define retention.

Do not claim audit records are immutable unless controls support that claim.

## 24. Environment Separation

Separate local, preview, and production configuration.

Use synthetic data and test accounts outside production.

Do not connect an unrestricted preview to production records.

Protect deployment credentials and CI permissions.

Ensure public build variables contain only browser-safe values.

Do not assume environment variables are private after bundling.

Verify callback URLs, webhook endpoints, and allowed origins
for each environment.

## 25. Dependencies and Source Control

Use maintained dependencies appropriate to the selected environment.

Commit lockfiles where applicable.

Review significant dependency additions.

Run relevant dependency checks once tooling exists.

Keep secrets, private media, and real customer datasets out of Git.

If a secret enters Git history:

- Treat it as exposed.
- Revoke or rotate it.
- Investigate access as appropriate.
- Remove it through an authorized cleanup process.

Deleting a secret from the latest file does not revoke it.

## 26. Backups and Recovery

Define and verify:

- What is backed up.
- Backup frequency.
- Retention.
- Access permissions.
- Restoration process.
- Recovery limitations.

Include database and media relationships where relevant.

A provider’s advertised backup feature is not evidence that
restoration has been tested for MeetDiscreet.

Keep recovery credentials protected.

Record material recovery tests.

## 27. Incident Handling

Before production, establish a practical response process.

It should cover:

- Detection.
- Triage.
- Containment.
- Credential revocation.
- Evidence preservation.
- Service recovery.
- Appropriate participant communication.
- Required external escalation.
- Post-incident corrections.

Do not publish sensitive incident details in public repository issues.

Record actual incidents in an appropriately restricted system.

## 28. Verification Requirements

Verify relevant controls before releasing dependent functionality.

Priority checks:

- Cross-account record access.
- Cross-companion entitlement isolation.
- Public-response field filtering.
- Private-media retrieval.
- Upload processing.
- Session expiry and revocation.
- Role escalation attempts.
- CSRF and CORS configuration where relevant.
- Stored-XSS handling.
- Price manipulation.
- Duplicate payment events.
- Concurrent booking conflicts.
- Realtime channel access.
- Call-session access.
- Blocking enforcement.
- Staff capability restrictions.
- Secret exclusion from builds.
- Recovery procedures.

Use unit, integration, browser, and configuration checks as appropriate.

A passing automated scan does not establish complete security.

Record findings, fixes, and unresolved limitations.

## 29. Launch Blockers

Do not release affected functionality when known issues allow:

- Account takeover.
- Unauthorized private-data access.
- Privilege escalation.
- Unverified financial entitlements.
- Secret exposure.
- Private media in public storage.
- Unauthorized administrative actions.
- Uncontrolled duplicate financial processing.

Assess other findings by concrete impact.

Do not conceal a blocker behind a disclaimer.

## 30. Future Scope Changes

A material change to content, identity handling, funds flow,
or communication may change the threat model.

Before enabling it:

1. Revise requirements.
2. Review provider suitability.
3. Reassess data collection and permissions.
4. Update moderation and operational controls.
5. Verify affected flows.
6. Update security claims.

Do not assume current controls cover an unassessed future product.

## 31. Final Rule

Protect the real trust boundaries.

Use backend authorization, private storage, verified financial events,
limited operational access, and evidence-based checks.

Describe security honestly and keep unresolved risks visible.

## Implemented development other-session revocation

The Account security action requires an explicit confirmation, freshly reauthenticates
the current email account, verifies its ID using the returned session JWT and calls
the provider logout SDK endpoint with that JWT and `others` scope. The SDK method
lives under `auth.admin.signOut` but uses an ordinary user's bearer token and the
public browser key; no elevated credential or admin authorization is introduced.
Avoid `auth.signOut` for this control because this installed SDK normalizes some
401/403/404 failures to success. Error responses must stay visible.

This revokes other refresh capability, preserves the new current session and does
not invalidate already-issued JWTs before expiry. RLS ownership and sensitive-data
policies remain separate; no immediate revocation guarantee, device list, audit trail,
or count is claimed. Password fields are cleared before async operations; concurrent
password/session operations are disabled, and identity/navigation guards reject
stale UI results. Hosted behavior remains to be verified with isolated test sessions.


## Current-session logout behavior

Ordinary header logout uses local scope; other-session revocation remains separate.
The installed SDK clears its local session before contacting the logout endpoint.
Application auth-state handling clears private editor data/DOM; `getSession()` then
checks local absence. Report local success separately from server revocation errors,
and make no early invalidation claim for already-issued bearer tokens. A successful
local removal remains useful when remote revocation cannot be confirmed. The scope
is a shared browser SDK session, not a guarantee that only one tab is affected.
No secret keys, session tokens or private draft content are logged by this flow.


## Development account email changes

The verified user can request an email change after explicit confirmation and fresh
password authentication. Check the same actor and current address before the request,
and use the provider's supported update method and same-origin PKCE Auth callback.
Display the provider's current/pending state without converting a pending address
into confirmed ownership, a role assignment or Provider eligibility. Authentication
user ID remains the ownership key; no private draft ownership is transferred.

Email, password and other-session forms share a busy lock and clear submitted secret
fields before requests. Detached/changed-account responses cannot update another
view. Server confirmation settings and email rate limits remain authoritative;
no custom mail sender, service credential, untrusted redirect or email-address
availability lookup is introduced. Hosted inbox confirmation and callback behavior
remain unverified, despite mocked SDK coverage.


## Saved draft reference downloads

An explicitly selected set of existing owner-only draft tables can be copied into
an on-device JSON reference file. Queries use allowlisted projections and owner
filters, reject foreign/malformed records and incomplete listing counts, and verify
the actor again after reads. A detached or changed-account view cannot start a late
Blob download. No Auth/session object, application/audit history, private media or
unselected table is serialized. No new grant, server export job or recipient.

This is not a complete account archive, legal-rights implementation or transactional
snapshot. Listing downloads support at most 1,000 rows and files at most 10 MiB;
truncation/read failures abort rather than download a misleading partial copy.
Free-form text is preserved without secret detection: keep the file private.
Only explicit downloads create a device file; no custom browser data cache is added,
and temporary Blob URLs are revoked. Existing RLS remains the authorization boundary.


## Administrator own-decision history

The curated history RPC requires current assigned Admin membership plus the existing
review and approval capabilities. It compares expected/actual reviewer identity and
filters on the actual JWT user, returning only that actor's retained decisions.
Moderator or revoked-scope requests are denied even when metadata claims Admin.
No global approval-table read, other reviewer's decision list, introduction text or
current target-role data is exposed. Timestamp/UUID cursor pages are bounded.

The UI requests history explicitly, renders text nodes, clears cards before failed
refreshes and drops stale/identity-changed responses. Queue access refresh resets
history authority; server checks repeat per request. Already-seen data cannot be
unseen, so no real-time erasure/revocation claim is made. Protected read events log
access metadata without applicant content. This read never restores a revoked
Provider role; historic decisions and current permissions remain distinct.


## Staff queue search

Search rechecks actual assigned review authority and expected/actual reviewer
identity on every RPC. It searches submitted names/cities only, never private
introductions or unsent drafts. Literal substring matching avoids wildcard expansion;
query length, page size and paired cursors are bounded. Protected access events
record the operation without query text; infrastructure logging remains separately
configured. Search text is neither placed in URLs nor persisted by the app.

Existing identity-change cleanup and response-version checks apply to searched
results. Permission denial removes displayed data; missing search setup is an
explicit error with an unfiltered-queue fallback, never a fabricated empty result.


## Saved public-field preparation preview

The Provider setup preview is an owner-only read of the existing private profile
draft. Its query and returned object project public-field candidates only, excluding
biography/interests and Auth metadata. Expected/actual identity is checked before
and after reading, and profile owner IDs must match. Existing RLS remains enforced;
calling fields public candidates does not make the endpoint publicly readable.

Rendering uses text nodes and a validated demo portrait index, with no arbitrary
URLs or HTML. Explicit refresh clears previous data first. Failures, empty results
and missing fields are distinct; detached/sign-out views ignore delayed results.
No browser persistence, publication writes, role/identity/plan grants or public
profile URL is introduced. Actual publishing needs its separate server policy.


## Private profile copies for publication preparation

Submission is a security-definer owner-bound RPC requiring current server-owned
User and Provider roles, with membership locks and a source draft version check.
The source is read and projected on the server; arbitrary browser content cannot
become the recorded copy. RLS permits only owner reads, with client direct writes
and anonymous reads revoked. One pending copy is enforced by a unique index.
Withdrawals bind actual owner and pending copy ID; they remain possible after role
revocation and cannot mutate captured public fields. No staff/public grants exist.

The UI renders text nodes, requires explicit confirmation, invalidates a reviewed
source after attempted submission and on preview reload/failure, and removes old
record content before failed refresh. Detached/identity-changed views cannot render
late responses. Errors do not claim success; current state must be checked before
retrying an ambiguous request. No public link, publishing entitlement, notification
or approval/eligibility verification is implied. Hosted JWT/concurrency checks are
still pending; local lock/index tests do not prove hosted concurrent execution.


## Owner history of private profile copies

History uses the existing owner RLS policy without new grants. Reads filter actual
owner, verify identity before/after and reject other-owner rows. Validated paired
timestamp/UUID cursors preserve microseconds while excluding PostgREST filter
syntax; requests are bounded to 21 records. Cards render allowlisted recorded
fields with text nodes, never arbitrary snapshot keys or HTML.

Results are loaded explicitly and stored only in the current view. Failures clear
old cards; pending-copy actions invalidate history before and after their request.
Generation checks drop old responses, and sign-out removes the private workspace.
Historical reads require no current Provider role and grant none. No public/staff
read, new write, retention policy or guarantee about already-seen data is added.


## Fictional conversation preview

The messages-preview route contains synthetic fixtures and locally composed text
only. It makes no messaging requests and grants no real membership, entitlement
or private-history access. Rendering uses text nodes, with a technical local
length bound. No HTML/media URL is interpreted from entered text. No message
content is stored in custom local/session storage or logs. Identity-change cleanup
removes the view and local edits before a fresh fixture render.

Actual messaging remains unimplemented: its backend must enforce participants,
per-companion entitlement, blocks/restrictions and authorized history/realtime
reads. This public demo is not evidence of those controls, delivery, read receipts
or real conversation privacy. Existing subscription actions remain separate.
