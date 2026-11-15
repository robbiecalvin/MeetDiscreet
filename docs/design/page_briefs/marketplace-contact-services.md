# Connected Pilot Contact Services

Provisional continuation of the approved navy/burgundy account/staff style under
Robbie’s larger-batch delegation. DEC-026/027 govern temporary invited access.

Routes: `?page=messages`, `?page=messaging-pilot`, `?page=blocked-participants`,
`?page=my-reports`, `?page=report-review`, `?page=booking-requests`,
`?page=booking-request-pilot`. Distinct from fictional previews and private plans.
Account permissions reveal staff links only after independent capability checks.
Sign-out/identity changes clear private DOM and invalidate detached results.

## Text and contact blocks

Inbox pages 20+1; conversations contain 50 messages plus one older indicator with
explicit older-history paging. Generic participant/short conversation labels do
not expose private draft names or contact data. Participant history is available
after access expiry/block. Composer requires current explicit pair access and
current roles/service switch; all sends recheck server-side. No attachments/calls,
presence/read receipts, notifications or realtime claim. Refresh is explicit.
Unconfirmed identical retries retain a client UUID so backend cannot duplicate a
send. Changed text uses a new request ID; check history before editing uncertain text.

Block/free unblock controls are confirmed and bilateral for new contact. Own-block
removal cannot clear someone else’s block or restore expired access. Block list
uses server-recorded public/context labels, not raw target Auth IDs. Public discovery
visibility does not change. Blocks preserve history/records and never cancel money.
Dirty message/report text prompts before in-app discard; pending operations block
relevant navigation. Only in-memory text; no browser persistence of message content.

## Reports and scoped review

Pilot public cards and individual received messages include explicit Report forms.
Received-message reporting voluntarily shares that single message plus explanation;
no whole-conversation staff access. Sign-in required, no payment. Existing active
reports return the same reference on retry; no response time is promised. My reports
shows own references/category/state/times only, not staff notes/reviewer identity.

Staff review has state filters, 20+1 oldest-first queue, exact evidence inspection,
latest ten private staff notes and mandatory note/state confirmation. Publication
pause/resume additionally requires an independent Administrator moderation capability;
self-target/self-reporter decisions are rejected. Message reports cannot change
publication. Publication pause affects only the stable pilot profile/Offering resource,
not payments, roles or history. Optimistic revisions reject stale report/hold writes.
Ambiguous writes require refresh/reinspection; private notes remain copyable.

## Request-only bookings

Separate invited-pair capability/grant, expiry and switch; text/publishing grants do
not substitute. Inbox newest-first 20+1; exact immutable versions 20+1 through older
paging. Forms explicitly take UTC instants and an IANA display zone, activity, meeting
area and optional notes. Show terms in the stored display zone. No price, deposit,
reservation, paid acceptance or completed-booking control. Requester withdraws and
Provider declines; terminal requests cannot reopen through a revision. Existing
history/closure is available after access expiry/block; new requests/revisions are
blocked without current access. Uncertain initial submissions retry the same UUID;
revisions compare exact saved request revisions and require reinspection on failure.

## Staff pair grants and activation

User/Provider UUIDs are inspected before confirmed grants. Each service uses its own
Administrator capability, explicit invitation confirmation and future UTC expiry;
no durations or invitees are prefilled. No self grants. Grants/revocations are revision-
bound and audited without text bodies. Both new-contact switches default OFF; history
and reporting remain available on shutdown. No messages/invitations are auto-sent.

## Recorded verification and limits

Production build passed. Inspected synthetic mocked mobile messages/request detail
at 390px and report review at 1440px. Removed redundant disabled first-page pagination
and spaced mobile actions following inspection. No real message/report/request was
sent. Automated suites remain paused; SQL execution, authorization/concurrency,
Safari and hosted end-to-end behavior are unverified. All new migrations are unapplied.
Media, realtime, calls, financial booking lifecycle, retention and support remain open.

Contact account routes load on demand. A loading/retry state is separate from auth /
service checks; stale imports cannot mount after identity/route replacement. Public
entry blocking is a separate component so the owner block-management route can remain
lazy. Final production build passed without the prior chunk-size/dynamic-import warning.
