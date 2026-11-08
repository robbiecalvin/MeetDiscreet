# MeetDiscreet — Page Briefs

## 1. Purpose

This directory stores the working design and behaviour brief for
each page or closely related interface group.

Briefs develop during production.

Do not design every future page upfront.
Do not create empty briefs simply to populate this directory.

A page brief records the current direction and remains editable.

## 2. Related Documents

- ../../../AGENTS.md
- ../design_system.md
- ../design_memory.md
- ../page_inventory.md
- ../../product/product_spec.md
- ../../product/access_matrix.md
- ../../decisions.md
- ../../next_steps.md

Use the design system for shared visual rules.
Use page briefs for page-specific choices.

Product documents remain authoritative for business rules,
permissions, and financial policy.

## 3. When to Create a Brief

Create a brief when a page enters active planning or design.

Before writing it:

1. Read the page’s functional requirements.
2. Read current shared design decisions.
3. Inspect any supplied references.
4. Identify unanswered visual questions.
5. Ask Robbie the relevant questions.

If Robbie delegates a choice, record it as provisional.

Do not infer approval from an implemented mockup or lack of criticism.

## 4. Naming

Use descriptive kebab-case filenames.

Examples:

- homepage.md
- companion-profile.md
- looking-for-editor.md
- offering-editor.md
- booking-request.md
- booking-detail.md

These examples do not establish actual pages or source files.

Use inventory identifiers from page_inventory.md to connect each brief
with its planned surface.

A single brief may cover closely related pages when their differences
are explicit.

## 5. Question Process

Ask a focused batch of questions for the current page.

Normally ask approximately 5–8 questions when needed.
Ask fewer when existing choices already answer them.

Useful topics:

- What should the user notice first?
- What layout suits this page?
- How dense should the information be?
- How should imagery appear?
- Where should actions sit?
- How should filters or sidebars work?
- What changes on mobile?
- Which reference details matter?

Offer concrete options and a recommendation where useful.

Do not ask implementation questions disguised as visual questions.

Do not repeatedly ask settled global questions.

## 6. Decision Labels

Use these labels:

- Undecided: no choice made.
- Provisional: working direction awaiting review.
- Approved: explicitly accepted by Robbie.
- Superseded: replaced by a newer decision.

Implementation and approval are separate.

Approval establishes a current direction, not a permanent restriction.

## 7. Reusable Brief Format

Copy the following structure into a page-specific file when needed.

Remove irrelevant sections and replace instructional fields with
actual findings. Unresolved fields may remain explicitly undecided.

```markdown
# MeetDiscreet — [Page Name]

## 1. Identity and Status

- Inventory ID:
- Page or interface group:
- Intended URL: Undecided until assigned.
- Source files: Not yet assigned.
- Implementation status:
- Visual review status:
- Integration status:
- Deployment status:

## 2. Purpose

Describe the user need this page serves.

State the main action or outcome.

## 3. Audience and Access

- Intended users:
- Public information:
- Member-only information:
- Subscriber-only information:
- Owner-only actions:
- Operational access, if applicable:

Reference the access matrix.

Do not establish new permissions in this brief.

## 4. Dependencies

List relevant requirements, services, shared components, and decisions.

Identify anything that blocks implementation.

Separate dependencies for the visual prototype from dependencies
for real integration.

## 5. Current Design Direction

Record the page’s:

- Visual focus.
- Layout.
- Information density.
- Content width.
- Imagery treatment.
- Relevant shared tokens.
- Page-specific variations.

Label meaningful choices as provisional or approved.

Reference shared rules instead of copying the entire design system.

## 6. Content Hierarchy

Describe the intended reading and action order.

Identify:

- Primary content.
- Supporting content.
- Secondary information.
- Content revealed on interaction.
- Content restricted by access tier.

Do not invent extra sections solely to fill space.

## 7. Actions and Controls

| Action | Who can use it | Expected result | Relevant state |
|---|---|---|---|
| Record an actual action | Reference access rules | Describe outcome | Enabled, loading, restricted, or other |

List only controls required by the page.

Specify navigation versus in-page actions.

## 8. Desktop Behaviour

Describe:

- Columns.
- Navigation.
- Sidebars.
- Sticky regions.
- Gallery or listing arrangement.
- Form layout.
- Relevant overlays.

Do not select behaviour solely because another project used it.

## 9. Mobile Behaviour

Describe:

- Content order.
- Column stacking.
- Navigation changes.
- Filter drawers.
- Sidebar relocation.
- Sticky actions.
- Gallery behaviour.
- Form progression.

Preserve essential information and actions.

Check intermediate widths as well as narrow mobile.

## 10. Interaction States

Specify relevant:

- Initial state.
- Loading.
- Empty.
- Validation error.
- Network failure.
- Success.
- Restricted access.
- Expired entitlement.
- Disabled or unavailable action.

Do not claim unimplemented controls work.

## 11. Content and Copy

Record page-specific headings, labels, and useful supporting text.

Use approved product terminology.

Keep detailed boundaries on their designated page.

Include concise transactional information when relevant.

Do not fabricate reviews, statistics, verification, or activity.

## 12. Data and Integration

- Data required:
- Source:
- Synthetic or connected:
- API dependencies:
- Server-enforced checks:
- Unverified behaviour:

Do not place private data or credentials in this document.

## 13. Accessibility

Record relevant requirements for:

- Heading structure.
- Labels.
- Keyboard navigation.
- Focus management.
- Dialog behaviour.
- Contrast.
- Error associations.
- Reduced motion.
- Touch interaction.

Include specific issues discovered during review.

## 14. References

List actual supplied references and their intended use.

Distinguish:

- Close reproduction.
- Layout inspiration.
- Colour reference.
- Component reference.

Do not claim to have inspected an unavailable reference.

## 15. Open Questions

| Question | Why it matters | Blocks | Status |
|---|---|---|---|
| Record an actual unresolved choice | Explain consequence | Identify dependent work | Pending |

Remove or resolve questions when answered.

## 16. Acceptance Criteria

List observable requirements for this page.

Include relevant:

- Visual decisions.
- Actions.
- Responsive behaviour.
- Access boundaries.
- Error handling.
- Accessibility.

Do not use subjective quality scores as acceptance evidence.

## 17. Review Feedback

Record material feedback with:

- Date or review reference.
- Requested change.
- Local or shared scope.
- Implementation status.
- Remaining review.

Keep current instructions clear.
Do not preserve contradictory active directions.

## 18. Verification

Record:

- Checks performed.
- Environment or viewport.
- Results.
- Known failures.
- Checks not performed.

Visual inspection does not establish backend correctness.

Passing tests does not establish visual approval.

## 19. Current Next Action

State the next concrete step.

Keep detailed project scheduling in docs/next_steps.md.
```

## 8. Editing an Existing Brief

When Robbie requests a change:

1. Read the current brief.
2. Identify whether the request is local or shared.
3. Apply the authorized edit.
4. Update the current direction.
5. Mark replaced decisions as superseded where useful.
6. Record remaining review needs.

Do not repeat the full questionnaire for a clear edit.

Do not require Robbie to justify changing an earlier preference.

## 9. Shared Design Changes

If a page decision affects a shared component:

- Check other consumers.
- Confirm scope when unclear.
- Update the shared design system when appropriate.
- Check affected pages.
- Keep local variations explicit.

Do not silently propagate a local request across the website.

## 10. Maintenance

Keep briefs current and practical.

Do not duplicate:

- Full financial specifications.
- Backend security policies.
- Complete API documentation.
- The entire roadmap.
- Every minor CSS adjustment.

Use repository history for detailed historical versions.

## 11. Initial State

The first active page brief is [public discovery](./discovery.md), based on
Robbie’s initial visual answers. This directory guide remains a reusable template.

Do not mark pages approved merely because their requirements exist.

## 12. Final Rule

A brief should make the next implementation or edit easier.

Record what this page needs, what Robbie decided,
what remains open, and what has actually been checked.