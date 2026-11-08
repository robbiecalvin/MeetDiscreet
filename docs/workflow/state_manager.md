# MeetDiscreet — State and Context Persistence

## 1. Purpose

This document defines how Codex tracks MeetDiscreet’s progress,
decisions, review feedback, and unfinished work across sessions.

Project continuity must rely on current repository files and verified
implementation, not assumed chat memory.

Keep state concise, explicit, and useful for the next task.

## 2. Core Principles

1. Record actual progress rather than intended progress.
2. Separate decisions, implementation, verification, and approval.
3. Preserve current user instructions and unresolved dependencies.
4. Keep one authoritative location for each subject.
5. Reconstruct uncertain state from available evidence.
6. Treat approved designs as revisable.
7. Update records after meaningful changes, not every message.

Do not claim that writing instructions creates automatic memory,
background processing, or persistent agent execution.

## 3. Where Information Belongs

Use the following locations when present or created.

| Information | Authoritative location |
|---|---|
| Project-wide working instructions | Root AGENTS.md |
| Product overview and selected services | docs/project_context.md |
| Current phase, progress, and next actions | docs/next_steps.md |
| Confirmed decisions and open questions | docs/decisions.md |
| Functional requirements | docs/product/product_spec.md |
| Roles and entitlements | docs/product/access_matrix.md |
| Financial rules | docs/product/pricing_and_payments.md |
| Booking states and transitions | docs/product/booking_lifecycle.md |
| Shared visual rules | docs/design/design_system.md |
| Page-specific design decisions | docs/design/page_briefs/ |
| Page implementation and review status | docs/design/page_inventory.md |
| Reusable design observations | docs/design/design_memory.md |
| Application architecture | docs/architecture/application_architecture.md |
| Actual environment and commands | docs/architecture/environment.md |
| Actual source-file locations | docs/architecture/repo_map.md |

Do not introduce system_memory.md as another competing source of truth.

If a listed document is absent, do not claim to have read it.
Create it only when relevant and sufficient information is available.

## 4. State Categories

### Project State

Track:

- Current phase.
- Active objective.
- Current page or feature.
- Relevant files.
- Dependencies.
- Blockers.
- Next useful action.

### Design State

Track:

- Questions already answered.
- Provisional choices.
- Explicit approvals.
- Requested revisions.
- Review still pending.
- Whether a change is local or shared.

### Implementation State

Track:

- What exists.
- What is partially implemented.
- What uses synthetic data.
- What is connected to test services.
- What is connected to production.
- Known defects and deferred work.

### Verification State

Track:

- Checks performed.
- Results.
- Relevant environment or commit.
- Checks not performed.
- Behaviour still unverified.

### Delivery State

Track when relevant:

- Local changes.
- Commit status.
- Push status.
- Deployment status.
- Post-deployment verification.

These are separate facts.
Do not infer one from another.

## 5. Starting or Resuming a Task

At the beginning of work:

1. Read the root AGENTS.md.
2. Read current project context and next steps.
3. Read relevant decisions and page briefs.
4. Inspect Git status and affected implementation.
5. Identify relevant tests or verification evidence.
6. Compare recorded progress with the actual repository.
7. Continue from the next valid step.

Do not ask Robbie to reconfirm information already supported by
current files and explicit instructions.

Ask only when a material conflict or missing decision cannot be
resolved from available evidence.

Preserve unrelated uncommitted changes.

## 6. Evidence and Conflicts

Use the actual instruction hierarchy of the environment.

Within project records:

- Current explicit instructions can revise earlier decisions.
- Approved requirements describe intended behaviour.
- Source code describes implemented behaviour.
- Tests and runtime checks provide verification evidence.
- Roadmaps summarize progress but can become stale.

If these disagree, identify the mismatch.

For example:

- A documented feature may not yet exist.
- Implemented behaviour may violate the specification.
- Passing tests may cover only part of a requirement.
- A deployed page may differ from local changes.

Do not rewrite requirements merely to match a bug.
Do not mark a feature complete merely because it appears in a roadmap.

Correct stale records when the evidence is clear.

## 7. Progress Statuses

Track status by dimension rather than using one ambiguous “Complete” label.

### Implementation

- Not started.
- In progress.
- Implemented.

### Verification

- Not checked.
- Partially checked.
- Passed relevant checks.
- Failed.
- Blocked.

### Visual Review

- Not requested.
- Awaiting review.
- Changes requested.
- Approved.

### Integration

- Synthetic demo.
- Not connected.
- Test-mode integration.
- Live integration.

### Deployment

- Local only.
- Committed.
- Pushed.
- Deployed to preview.
- Deployed to production.
- Deployment failed.

Use only dimensions relevant to the task.

“Implemented” does not mean visually approved.
“Approved” does not mean integrated.
“Deployed” does not mean launch-ready.

## 8. Design Continuity

Before starting a new page:

- Reuse current approved shared choices.
- Read its page brief if present.
- Ask only unresolved questions relevant to that page.
- Preserve references and specific preferences already supplied.

When Robbie requests an edit:

1. Identify the affected page or shared component.
2. Apply the current instruction.
3. Update the authoritative design record.
4. Mark conflicting older guidance as superseded.
5. Record any necessary follow-up.

Do not require a new full questionnaire for a clear edit.

Do not treat earlier approval as a prohibition against revision.

Do not treat silence as approval.

## 9. Pending Questions

Record unresolved questions only when they affect the project.

Each question should identify:

- The decision required.
- Why it matters.
- Work that depends on it.
- Work that can continue independently.
- Any proposed interpretation.

Separate:

- Required decisions.
- Optional preferences.
- Technical details Codex can resolve independently.

Do not keep resolved questions active.

For MeetDiscreet, do not assume unresolved financial interpretations
have been confirmed merely because they were discussed.

## 10. Updating State

Update the relevant records after:

- Completing a meaningful implementation step.
- Receiving material design feedback.
- Making an approved project decision.
- Discovering a blocker.
- Changing architecture or environment.
- Running consequential verification.
- Committing, pushing, or deploying.
- Pausing with unfinished work.

Do not update every document after every interaction.

Write each fact to its authoritative location.
Use links or short references elsewhere.

Do not mark work complete before implementation and relevant checks
support that status.

## 11. Current Work Snapshot

Keep a concise current-work section in docs/next_steps.md.

Suggested format:

```markdown
## Current Work

- Phase:
- Objective:
- Active page or feature:
- Relevant files:
- Implementation status:
- Review status:
- Integration status:

### Last Verified Result

- Check performed:
- Result:
- Environment or commit:
- Remaining verification:

### Pending Decisions

- Decision:
- Dependency:
- Independent work available:

### Next Action

- Specific next step:

### Working Tree and Delivery

- Relevant uncommitted changes:
- Commit or push status:
- Deployment status:
```

Use actual information.
Omit irrelevant fields.

Do not create a second live snapshot in another document.

## 12. Verification Records

Record enough evidence to understand the limits of a result.

Examples:

- Named tests passed.
- A page was inspected at specific viewport sizes.
- A payment flow passed in provider test mode.
- A backend permission check rejected unauthorized access.
- A deployment completed but authentication remains unverified.

Do not store large logs when a concise result and reference suffice.

When relevant code or configuration changes, reassess affected
verification results.

A historical pass does not automatically validate a new revision.

## 13. Context Compression

When records become lengthy:

1. Preserve the current objective.
2. Preserve active constraints and decisions.
3. Preserve pending feedback.
4. Preserve blockers and dependencies.
5. Preserve important verification limits.
6. Remove repeated or obsolete discussion.
7. Link to detailed authoritative records.

Do not compress away:

- Financial rules.
- Access boundaries.
- Explicit user corrections.
- Unresolved requirements.
- Distinctions between demo and live functionality.

Use Git history for detailed change history instead of duplicating
every historical version in active documents.

## 14. Recovering Unclear State

If state is incomplete or contradictory:

1. Inspect current files.
2. Inspect relevant Git history and diffs.
3. Read the latest applicable decisions.
4. Run focused checks where practical.
5. Reconstruct what is known.
6. Identify remaining uncertainty.

Continue independent work when safe.

Ask Robbie only for information that cannot be recovered and is
required for the next dependent action.

Do not halt the entire project because one optional detail is missing.

## 15. Session Handoff

Before pausing meaningful unfinished work, leave a concise handoff
in the current roadmap.

Include:

- What was completed.
- What remains in progress.
- Relevant files.
- Pending feedback or decisions.
- Checks performed.
- Known failures.
- Whether changes are committed, pushed, or deployed.
- The next concrete action.

Do not imply unfinished work will continue automatically after
the session ends.

## 16. Persistence and Git

Repository files persist only when saved in the actual working copy.

Local saves, commits, pushes, and deployments are distinct operations.

Follow the authorization established for the current workflow.

Do not claim information is available in GitHub until the relevant
changes have been pushed successfully.

Do not overwrite unrelated changes to simplify state management.

If the current task is only to draft replacement text, do not claim
the repository file has been updated.

## 17. Privacy

Store engineering context, not sensitive customer content.

Do not include:

- Passwords.
- Secret keys.
- Session tokens.
- Private messages.
- Private media URLs.
- Payment credentials.
- Unnecessary personal information.

Use synthetic identifiers in examples.

Keep operational customer records in their authorized application
systems, not project memory documents.

## 18. Final Rule

Make the next session able to answer:

- What are we building now?
- What has actually been implemented?
- What did Robbie decide?
- What still needs review?
- What has been verified?
- What is blocked?
- What should happen next?

Keep those answers accurate, concise, and revisable.