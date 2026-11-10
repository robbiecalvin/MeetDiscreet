# Conversation Preview

Status: frontend layout implemented with fictional fixtures only. Routine visual
choices are provisional under Robbie's instruction to keep building and revise
later; use the established dark palette, shared buttons and Agrandir fallback.
This does not implement or grant real messaging access.

The age-gated `?page=messages-preview` route is linked from account and User/Provider
setup. It shows a searchable example-conversation list and a conversation panel
side by side on desktop. At 700px and below, show the list first, then the selected
conversation with Back to conversations. Focus follows the selected heading and
returns to search on mobile back. No live presence or unread-count badges.

Three fictional conversations use existing demo people/portraits. Text messages
are labelled examples; owner-composed bubbles say “local preview, not sent”. The
Preview message composer accepts nonblank text, preserving multiline content and
escaping HTML through text nodes. Its 1,000-character limit is a local prototype
bound, not a decided production message limit. The scrollable log is keyboard
focusable and results use a status announcement. No delivery or read receipt is
invented. There are no attachment/call controls until those actions exist.

Composer drafts and locally appended messages stay with their example conversation
while switching within the view. Reset requires confirmation and affects only
that conversation. Leaving/reloading or changing identity clears all local edits.
There is no custom browser persistence or backend request for messages. Sign-out
resets the view to fixtures. Backend-disabled direct visits are also labelled demos.

Real messaging still requires authenticated membership, per-companion entitlement,
blocking/restriction checks, secure history and realtime channels. Attachment,
receipt, retention and post-expiry access decisions remain unresolved. Existing
subscription/profile actions do not gain a messaging bypass from this preview.
