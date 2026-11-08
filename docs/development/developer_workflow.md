# MeetDiscreet — Developer Workflow

## 1. Purpose

This document defines how Robbie and Codex collaborate to build,
review, edit, and publish MeetDiscreet.

Development happens progressively:

Discuss → Plan → Build → Preview → Review → Edit → Validate → Save

Robbie directs the product and visual design.
Codex performs authorized engineering work and maintains project context.

The workflow should support progress without unnecessary approval steps.

## 2. Working Environment

The intended development workflow is:

VS Code → Local preview → Git commit → GitHub push → Deployment

Use the actual tooling and services recorded in:

- [Environment](../architecture/environment.md)
- [Repository Map](../architecture/repo_map.md)
- Application architecture documentation, when created.
- Deployment documentation, when created.

Do not invent commands or assume integrations already exist.

GitHub stores the source code.
The commercial application requires an appropriate production host
and backend services.

## 3. Starting or Resuming Work

Before implementation, Codex must:

1. Read the root AGENTS.md.
2. Read the relevant project requirements.
3. Check the current roadmap and decisions.
4. Inspect the repository and uncommitted changes.
5. Locate the affected implementation and tests.
6. Identify the next useful action.

Do not ask Robbie to repeat information already available in current
project documentation.

Do not treat previous chat context as more authoritative than updated
project files and explicit current instructions.

If documents are missing, identify the gap and create them when
required and authorized.

## 4. Defining a Task

Robbie may describe a task naturally.

Examples:

- Build the homepage.
- Make these cards shorter on mobile.
- Add the subscription prompt to this profile.
- Move the filters into a sidebar.
- Fix the booking estimate.
- Review this page before we continue.

Robbie does not need to complete a formal task template.

Codex translates the request into:

- Objective.
- Scope.
- Relevant constraints.
- Dependencies.
- Acceptance criteria.

Use the task template internally when helpful.
Do not make routine work depend on Robbie filling out documentation.

A request for analysis or planning must remain within that scope.
Do not begin unrelated implementation.

## 5. Planning the Work

For nontrivial changes, briefly identify:

- Files or components affected.
- Intended behaviour.
- Implementation approach.
- Relevant dependencies.
- Verification method.
- Material risks or unresolved decisions.

Scale planning to the task.

A small spacing edit does not require a full architecture review.
A payment or authorization change requires deeper analysis.

Proceed with routine work already authorized by the request.

Ask before proceeding only when a decision genuinely requires
Robbie’s input, such as:

- Unresolved visual direction.
- A material business-rule choice.
- A pricing or payment-policy change.
- A significant new cost.
- An irreversible operation.
- A substantial architecture change outside the agreed scope.

Do not introduce a second approval step after Robbie has already
answered the relevant questions.

## 6. Designing a New Page

Before building a page that has not been designed:

1. Read the shared design system.
2. Read the page requirements.
3. Check existing references and decisions.
4. Identify unresolved visual choices.
5. Ask a focused questionnaire.

Ask approximately 5–8 questions when necessary.
Ask fewer when existing decisions already provide the answers.

Topics may include:

- Main visual focus.
- Layout and information density.
- Content order.
- Cards, rows, panels, or galleries.
- Primary and secondary actions.
- Sidebars and filters.
- Upgrade placement.
- Mobile behaviour.
- Reference images.

Offer concrete options and a recommendation where useful.

Do not ask questions about every future page at once.
Do not repeatedly ask settled questions about branding or typography.

If Robbie delegates a choice, make a reasonable provisional decision
and proceed.

## 7. Recording the Page Direction

Record meaningful page decisions in the relevant page brief.

Include:

- Page purpose.
- Audience and access tier.
- Layout and content hierarchy.
- Primary actions.
- Shared components.
- Desktop behaviour.
- Mobile behaviour.
- Required states.
- Provisional choices.
- Approved choices.
- Outstanding feedback.

Use the shared design system for decisions that apply across pages.

Do not record a page-specific request as a global preference
without supporting direction.

Unreviewed implementation is not automatically approved.

## 8. Implementation

Build the agreed page or feature using the existing structure.

Prefer:

- Semantic HTML.
- Shared CSS tokens.
- Reusable components.
- JavaScript modules.
- Clear responsibility boundaries.
- Minimal justified dependencies.

Preserve:

- Approved visual choices.
- Existing functionality.
- Access rules.
- Pricing rules.
- Unrelated user changes.

Do not:

- Add unrelated features.
- Rewrite approved layouts for novelty.
- Duplicate business rules.
- Create fake success states.
- Present inactive controls as working integrations.
- Expose secrets or restricted information in frontend code.

Requested prototypes are allowed when clearly identified in developer
documentation and separated from real transactions.

## 9. Local Preview

Use the documented local development server.

Provide:

- The actual preview address when available.
- The page or route to inspect.
- Relevant test accounts or synthetic scenarios.
- Any limitations affecting the review.

Do not rely on file:// previews for application behaviour that requires
HTTP, modules, routing, or service requests.

When browser tools are available, inspect the rendered result.

Check representative desktop and mobile layouts.

Do not claim visual verification based only on reading source code.

## 10. Review and Revision

Present a reviewable result after a meaningful implementation step.

Robbie may:

- Approve it.
- Request small edits.
- Change the layout.
- Revise the shared style.
- Return to a previously completed page.

Treat clear edit requests as authorization to make the edits.

Do not repeat the full questionnaire when the change is specific.

Approval establishes the current direction.
It does not make the design permanent.

Apply feedback without defending an older choice merely because
it was previously approved.

## 11. Local Versus Shared Edits

Determine whether a requested edit affects:

- One page.
- One reusable component.
- The whole website.

Apply explicit site-wide requests consistently.

For a local request, preserve unrelated pages.

If scope is unclear and changing a shared component would affect
multiple pages, ask a focused question before propagating the change.

Update the authoritative design document when shared rules change.

Check other consumers of modified shared components.

## 12. Copy and Guidelines

Keep ordinary pages focused on the product and the current task.

Do not add repeated adult-eligibility or platonic-service disclaimers
to profiles, dashboards, listing editors, or promotional sections.

Keep detailed boundaries on the designated standalone
Community Guidelines & Boundaries page.

Retain concise information where users make decisions:

- Charges.
- Subscription scope.
- Renewal terms.
- Deposit treatment.
- Cancellation terms.
- Relevant acceptance links.

Implement the shared entrance age gate without treating its browser
confirmation as backend authorization.

## 13. Backend Integration

Connect production features through the approved backend.

Integrations must enforce:

- Authentication.
- Ownership.
- Roles.
- Per-companion subscriptions.
- Publishing status.
- Posting and boost allowances.
- Private media access.
- Booking rules.
- Payment verification.

Do not describe a frontend-only demonstration as a working production
integration.

Clearly distinguish:

- Synthetic demo behaviour.
- Connected test-mode integration.
- Verified live integration.

Do not bypass backend controls to make a preview appear functional.

## 14. Validation

Run checks appropriate to the change.

For visual work:

- Inspect the rendered page.
- Check responsive layouts.
- Check content overflow.
- Verify keyboard access and visible focus.
- Exercise relevant controls.
- Check loading, empty, error, and success states.

For domain or backend work:

- Test expected behaviour and relevant edge cases.
- Verify authorization and ownership.
- Check related consumers.
- Confirm financial calculations where applicable.
- Verify failure handling.

For critical flows, check end-to-end behaviour in an appropriate
test environment.

Do not use real customer transactions for routine verification.

A completed page is not evidence that the platform is launch-ready.

## 15. Debugging

When a problem occurs:

1. Gather relevant evidence.
2. Reproduce it where practical.
3. Trace the affected behaviour.
4. Identify the root cause.
5. Apply the smallest justified correction.
6. Run relevant checks.
7. Inspect nearby regression risks.

Follow the [Debugging Playbook](../security/debugging_playbook.md)
where applicable.

Do not repeatedly retry the same approach without new evidence.

If something cannot be reproduced or verified, explain the limitation
and continue useful independent investigation.

## 16. Completion Report

After a meaningful step, report concisely:

- What changed.
- Files affected.
- What was checked.
- Results.
- Material limitations.
- What comes next.

Distinguish these statuses:

- Planned.
- Designed.
- Implemented.
- Tested.
- Integrated.
- Deployed.
- Ready for production.

Never claim tests, deployment, or integrations succeeded without evidence.

When manual copying is required, provide complete files and exact paths.

When direct editing is available, perform authorized edits directly.

## 17. Documentation Updates

After meaningful progress:

- Update the roadmap.
- Record material decisions.
- Update the current page brief.
- Update shared design rules when changed.
- Add useful design-memory lessons when supported by feedback.
- Update the repository map when structure changes.
- Update setup and deployment documentation when commands change.

Do not log every minor CSS adjustment as a formal decision.

Keep one authoritative location for each subject.

## 18. Git Workflow

Before preparing a commit:

1. Inspect the working tree.
2. Review the diff.
3. Confirm the change matches the intended scope.
4. Exclude secrets, private media, and real user data.
5. Run relevant checks.
6. Preserve unrelated changes.

Use focused, descriptive commits.

Examples:

- feat: add MeetDiscreet entrance age gate
- feat: build companion profile layout
- fix: preserve filters after returning from a listing
- style: reduce mobile listing card height
- docs: record approved homepage design

Follow the [PR Rules](../strategy/pr_rules.md) where applicable.

Do not commit, push, merge, or deploy merely because a local task
was completed. Follow the authorization already established for
the current workflow.

Do not repeatedly request permission when Robbie has already
authorized those actions.

Never use destructive Git operations without explicit authorization.

## 19. Deployment

Use the approved deployment process.

Before deployment, verify relevant:

- Build output.
- Environment configuration.
- Frontend routes.
- Asset paths.
- Backend endpoints.
- Authentication redirects.
- Database changes.
- Payment mode.
- Webhook configuration.

After deployment, inspect the deployed result.

A successful Git push does not prove deployment succeeded.

A successful frontend deployment does not prove backend services work.

Record unresolved deployment issues accurately.

## 20. Handling Blockers

When blocked:

- State the specific missing decision, access, or dependency.
- Explain what it prevents.
- Continue independent work where possible.
- Ask the smallest useful question.

Do not stop the whole project because an unrelated detail is undecided.

Do not invent critical requirements to avoid asking.

## 21. Responsibilities

### Robbie

- Directs product goals and visual preferences.
- Answers material business and design questions.
- Reviews pages when desired.
- Requests revisions.
- Authorizes significant costs and irreversible changes.
- Controls final launch decisions.

### Codex

- Reads current project context.
- Recommends practical options.
- Implements authorized work.
- Tests and verifies relevant behaviour.
- Identifies concrete risks and dependencies.
- Preserves approved decisions and unrelated changes.
- Maintains useful documentation.
- Reports limitations honestly.

Robbie should not have to manually manage every routine engineering step.

## 22. Final Rule

Build MeetDiscreet progressively and collaboratively.

Ask for the decisions that matter.
Implement the work already authorized.
Make each step reviewable.
Apply requested edits.
Verify what can be verified.
Keep the project ready for the next session.