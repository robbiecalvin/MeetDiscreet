# Private Provider Application Intake

Route `/?page=provider-application`, linked from Provider setup and Account.
Continue the approved palette and labelled, mobile-first forms under Robbie’s
instruction to build the non-payment pilot foundation.

Collect a provider display name, general city and short introduction using the
existing draft field bounds. Partial private saves are allowed. All three must
be nonblank before submission; this is intake completeness, not a provider
eligibility/quality standard. Offer an explicit copy from the owner’s saved
provider draft. Do not collect identity documents, full birth dates, precise
addresses or contact details while verification policy remains unresolved.

Save the draft before enabling submission. Submit requires explicit confirmation,
then locks text editing. Withdrawal requires confirmation and unlocks editing;
a new save returns it to draft before another submission. Reload warns before
discarding unsaved local edits. In-app navigation preserves local text; account
changes clear it, and existing connected-mode unload protection applies.

Server state is authoritative: `draft`, `submitted`, `withdrawn`, `changes_requested`. Direct client
writes to rows/events are denied. Owner-bound authenticated RPCs perform atomic
state transitions. Submission additionally requires assigned basic User membership,
not a signup preference. Expected-owner checks bind requests to the account that
loaded the form and reject mid-session actor changes. Status events are server
recorded and owner-readable; they are not complete content-version history.

This is development intake. Submitted records are privately stored for future
trusted review. A separately scoped inspection workspace supports version-bound requests for changes after migration 007.
Reviewer notifications, approval/denial decisions, Provider role grants, verification,
publishing, paid plans and response deadlines remain unimplemented. An eventual approval process must define eligibility, confirm the
current submitted state/version, and perform authorized audited role changes.

Missing schema, failed saves and failed withdrawals preserve reliable prior state
and allow retry. Backend-disabled mode clearly checks a form preview without
sending or storing anything. Hosted migration/setup validation remains pending.


## Private submission history

An explicit Load submission history button retrieves at most the latest 20 snapshots,
newest first. Each expandable entry shows submitted name, city, introduction and
feedback belonging to that version. No-note copy must not imply approval. Render
all entered text as text, with keyboard-operable native details/summary controls.

Use existing owner-only snapshot RLS and feedback column grants; never request
reviewer identity. No extra schema migration is needed beyond 007. Loading is
on demand, not part of the editor's initial load. History errors clear displayed
entries, report unavailable rather than empty, and allow retry. Application reloads
and mutations invalidate history; detached/changed-account responses are ignored.
No history is persisted in browser storage. Backend-disabled mode has no history
control or synthetic private records. Earlier versions outside the latest 20 are
not exposed by this first history view; retention policy remains unresolved.


## Application activity

A separate explicit loader shows up to 20 owner status events in newest event-ID
order, using the server-recorded timestamp. Display Draft saved, Application
submitted, Application withdrawn, and Changes requested in a semantic ordered list
with time elements. This is status history, not approval, identity verification,
notification delivery or a complete retained audit export. It does not expose staff
identity or private introduction text. Empty activity and unavailable reads have
different messages. Refresh errors and application operations clear old entries;
sign-out/account changes discard the view. No browser history cache or new schema.
