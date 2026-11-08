# MeetDiscreet — Engineering Task Template

## 1. Purpose

Use this template to turn a request into a clear, reviewable implementation.

Adapt its depth to the task.

Robbie can describe work naturally.
Codex is responsible for organizing the relevant requirements.

Do not require Robbie to fill out this template manually.

Do not print every section in routine progress reports.
Use only the sections relevant to the current task.

## 2. Governing Context

Follow:

- [Root Instructions](../../AGENTS.md)
- [Developer Workflow](../development/developer_workflow.md)
- [Living Design System](../design/design_system.md)
- [Repository Map](../architecture/repo_map.md)
- [Environment](../architecture/environment.md)

Read relevant product requirements, decisions, and page briefs.

Framework guidance must not override current explicit instructions
or approved MeetDiscreet decisions.

Do not claim a referenced document exists or was read without checking.

## 3. Classify the Task

Identify the task type:

- Planning or review.
- New page.
- Existing-page edit.
- Shared component.
- Frontend functionality.
- Backend functionality.
- Integration.
- Bug fix.
- Refactoring.
- Documentation.
- Deployment.

Identify the depth needed:

### Small

A focused change with limited dependencies.

Use a brief plan and targeted verification.

### Medium

A multi-file feature or change affecting shared behaviour.

Identify consumers, dependencies, and relevant regression checks.

### High Impact

A change involving payments, permissions, sensitive information,
database migrations, or production operations.

Use explicit acceptance criteria, deeper verification, and a recovery
approach appropriate to the consequences.

Do not default every task to a full framework ceremony.

## 4. Task Summary

Record:

- Requested change.
- Expected result.
- Relevant page or feature.
- Intended audience.
- Current project phase.

Preserve the actual request.

A request to review or plan does not authorize unrelated implementation.

Do not add features simply because they might be useful later.

## 5. Current State

Inspect the actual repository.

Identify:

- What already exists.
- What works.
- What is missing or incorrect.
- Relevant uncommitted changes.
- Whether current behaviour uses synthetic data or real integrations.
- Existing tests and known failures.

For a new feature, state that no implementation exists when appropriate.

Do not invent current behaviour from the roadmap.

## 6. Requirements and Acceptance Criteria

Define observable outcomes.

Examples:

- A member sees the permitted profile fields.
- A nonsubscriber cannot retrieve restricted media.
- A mobile filter drawer can be opened, applied, and dismissed.
- A booking estimate includes the selected duration and add-ons.
- A shared button update appears consistently on affected pages.

Acceptance criteria should describe behaviour or presentation that
can actually be checked.

Avoid criteria such as:

- Looks premium.
- Scores at least 9/10.
- Is completely secure.
- Is production-ready.

Use specific requirements and evidence instead.

Separate required outcomes from optional improvements.

## 7. Questions and Dependencies

Identify only unresolved decisions relevant to this task.

For each blocker, record:

- What is unknown.
- Why it matters.
- What depends on it.
- What can proceed independently.

Ask Robbie about material:

- Visual choices.
- Business rules.
- Financial policies.
- Costs.
- Irreversible changes.

Resolve routine technical details within the approved architecture.

Do not repeat questions already answered in current documents.

Do not stop independent work because one unrelated decision is pending.

## 8. Design Handling

### New or Undesigned Page

Before visual implementation:

1. Read shared decisions and relevant references.
2. Identify unanswered page-specific choices.
3. Ask a focused questionnaire.
4. Record the agreed direction in the page brief.
5. Build a reviewable version.

Ask approximately 5–8 useful questions when necessary.

Cover relevant topics:

- Layout.
- Information density.
- Visual focus.
- Content hierarchy.
- Imagery.
- Primary actions.
- Filters and sidebars.
- Mobile behaviour.

If Robbie delegates a choice, proceed with a clearly provisional
recommendation.

### Existing-Page Edit

Use the current page brief and latest request.

Do not repeat the full questionnaire for a clear change.

Determine whether the edit is:

- Page-specific.
- Shared-component-specific.
- Site-wide.

Ask about scope only when ambiguity would materially affect other pages.

### Nonvisual Task

Do not require typography, layout, or motion decisions for work that
does not affect the interface.

### General Rule

Approved designs remain editable.

Do not force unique combinations, unusual layouts, or automatic
redesigns for novelty.

## 9. Affected Components

Identify relevant:

- Page entry points.
- Shared interface components.
- Styles and design tokens.
- JavaScript modules.
- Backend handlers.
- Domain rules.
- Database schema and permissions.
- Service integrations.
- Configuration.
- Tests.
- Documentation.

Use actual paths once located.

Inspect callers and consumers before changing a shared contract.

Search for existing utilities before creating duplicate implementations.

## 10. Root Cause for Bug Fixes

When fixing a bug, record:

- Observed failure.
- Reproduction conditions.
- Supporting evidence.
- Identified cause.
- Proposed correction.

Distinguish confirmed causes from hypotheses.

Reproduce the issue where practical.

If reproduction is unavailable, continue useful investigation and
explain the verification limits.

Do not apply unrelated speculative fixes.

## 11. Implementation Plan

Describe the smallest coherent implementation that satisfies the task.

Include:

- Files to change.
- New files genuinely required.
- Responsibilities of each component.
- Relevant dependencies.
- Data or API changes.
- Verification approach.

For higher-impact work, include:

- Migration considerations.
- Compatibility implications.
- Failure handling.
- Recovery or rollback approach.

Do not require an additional approval checkpoint for routine work
already authorized.

## 12. MeetDiscreet-Specific Checks

Apply the relevant checks.

### Access and Ownership

- Correct account role.
- Correct record owner.
- Correct visibility tier.
- Correct companion-specific subscription.
- Publishing and premium entitlements kept distinct.

### Pricing and Allowances

- Approved prices preserved.
- Currency explicit where required.
- Financial calculations performed authoritatively.
- Integer minor units and defined rounding.
- Post and boost allowances enforced.
- No invented deposit or refund rule.

### Media and Communication

- Restricted originals remain private.
- Conversation membership enforced.
- Blocking respected.
- Notifications do not leak restricted content.
- Call controls reflect actual integration capability.

### Bookings

- Valid state transitions.
- Agreed price snapshot.
- Availability and conflict handling.
- Acceptance of material revisions.
- Deposit and cancellation behaviour matches confirmed policy.

### Interface Copy

- No repeated disclaimer sections added to ordinary pages.
- Detailed boundaries remain on their designated page.
- Necessary transaction information remains visible.
- Entrance age confirmation does not grant backend privileges.

Do not add irrelevant checklist items to a simple task.

## 13. Implementation Standards

Follow the existing approved architecture and code conventions.

Prefer:

- Semantic HTML.
- Shared CSS tokens.
- Reusable components.
- JavaScript modules.
- Explicit domain rules.
- Minimal justified dependencies.
- Targeted changes.

Preserve unrelated work.

Do not:

- Expose secrets.
- Send restricted data to unauthorized browsers.
- Rely on hidden controls for security.
- Duplicate authoritative pricing rules.
- Present fake success states.
- Describe unfinished integrations as working.
- Refactor unrelated areas.

Requested prototypes may use synthetic data when clearly identified
and separated from live transactions.

## 14. Verification Plan

Choose checks based on the change.

### Visual Changes

- Render the page.
- Inspect relevant desktop and mobile widths.
- Check overflow and content hierarchy.
- Exercise affected controls.
- Check keyboard access and focus.
- Check relevant loading, empty, and error states.

### Domain Logic

- Test expected results.
- Test meaningful edge cases.
- Verify incorrect behaviour is detected.
- Keep routine tests deterministic.

### Backend and Integration Changes

- Test ownership and authorization.
- Test failure responses.
- Verify service contracts.
- Use isolated test environments.
- Check duplicate and out-of-order events where relevant.

### Shared Changes

- Check affected consumers.
- Run relevant regression checks.

### Deployment Changes

- Verify build and configuration.
- Inspect deployed routes and assets.
- Check affected integrations.
- Confirm the deployment outcome directly.

Do not claim checks were performed unless they were.

## 15. Handling Failures

If a check fails:

1. Determine whether the task caused it.
2. Identify the cause.
3. Apply a correction within scope.
4. Repeat the affected checks.
5. Broaden verification only when justified.

Report unrelated existing failures accurately.

Do not hide failures, disable checks to manufacture success,
or repeatedly retry without new evidence.

If verification is blocked, record what remains unverified and why.

## 16. Documentation Updates

Update only relevant authoritative documents.

Examples:

- Page brief for layout decisions.
- Design system for shared visual changes.
- Design memory for supported reusable lessons.
- Product specification for approved feature changes.
- Decision log for material choices.
- Repository map for structural changes.
- Environment guide for tooling changes.
- Roadmap for progress and next actions.

Do not create competing roadmaps or duplicate full requirements.

## 17. Review and Revision

Present a reviewable result after a meaningful step.

Track separately:

- Implementation.
- Verification.
- Visual review.
- Integration.
- Deployment.

A page can be implemented while awaiting visual review.

Robbie may request revisions at any stage.

Apply clear edit requests directly.
Update superseded design decisions where necessary.

Do not treat silence as approval.

## 18. Completion Report

Provide a concise report containing:

- What changed.
- Important files affected.
- Checks performed and results.
- Material limitations.
- Next action or dependency.

Include a suggested commit message when useful.

Do not print the entire internal task template unless requested.

Do not describe the whole application as launch-ready because
this task passed its checks.

## 19. Git and Deployment

Inspect the diff before preparing delivery.

Exclude secrets, private data, and unrelated changes.

Keep changes focused and reviewable.

Follow the authorization established for commits, pushes, pull requests,
merges, and deployment.

A successful push is not proof of deployment.
A frontend deployment is not proof of backend readiness.

Report actual delivery status.

## 20. Compact Working Template

Use this abbreviated structure for ordinary tasks:

```markdown
### Task
- Request:
- Expected result:
- Scope:

### Current State
- Existing implementation:
- Relevant files:
- Dependencies:

### Decisions
- Confirmed:
- Provisional:
- Questions, if required:

### Acceptance Criteria
- Observable outcome:
- Observable outcome:

### Plan
- Implementation steps:
- Verification:

### Result
- Changes:
- Checks and evidence:
- Remaining limitations:
- Review status:
- Delivery status:
- Next action:
```

Omit irrelevant fields.
Expand only where complexity or consequences justify it.

## 21. Final Rule

Use the template to make the work clearer, not heavier.

Ask necessary questions.
Implement the authorized scope.
Verify concrete outcomes.
Preserve design flexibility.
Record the next useful step.