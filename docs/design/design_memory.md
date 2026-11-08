# MeetDiscreet — Design Memory

## 1. Purpose

This document records useful lessons from designing, reviewing,
and editing MeetDiscreet.

It helps Codex:

- Remember Robbie’s feedback.
- Avoid repeating resolved mistakes.
- Reuse effective solutions where appropriate.
- Understand why a design changed.
- Preserve continuity between development sessions.

Design memory supports future decisions.
It does not freeze the design or override a new request.

## 2. Relationship to Other Documents

Keep responsibilities separate:

- design_system.md
  Current shared visual rules and approved design tokens.

- page_briefs/
  Current page-specific layouts and requirements.

- design_memory.md
  Feedback, observations, and lessons explaining what worked,
  what did not, and where that lesson applies.

- ../decisions.md
  Significant project decisions and unresolved questions.

- ../next_steps.md
  Implementation progress and upcoming work.

Do not duplicate complete page specifications or token lists here.

Link to their authoritative location when useful.

## 3. Starting State

MeetDiscreet’s design develops during page-by-page production.

Do not inherit the original framework’s example layouts as validated
MeetDiscreet outcomes.

The following are not automatically approved:

- Asymmetrical heroes.
- Editorial split layouts.
- Brutalist styling.
- Dark backgrounds.
- Particular fonts.
- Hover elevation.
- Scroll reveals.
- Any specific card or navigation treatment.

Add project-specific lessons only when supported by actual feedback
or observation.

Do not invent a design history.

## 4. Core Principles

1. Record specific, actionable lessons.
2. Identify the source of the observation.
3. Distinguish preference from measured usability.
4. Limit each lesson to its supported scope.
5. Keep current guidance separate from historical context.
6. Remove or supersede stale conclusions.
7. Treat revisions as normal design development.

A familiar pattern is not a failure merely because it is common.

A distinctive pattern is not successful merely because it is unusual.

## 5. Evidence Types

Identify the evidence supporting an entry.

### Explicit User Feedback

Robbie directly requested, approved, or rejected something.

This establishes a preference or decision within the stated scope.
It does not establish measured performance.

### Visual Inspection

A rendered page or screenshot shows a concrete issue or outcome.

Examples:

- Text overlaps a button at a tested width.
- A sidebar leaves insufficient space for form fields.
- A sticky action covers page content.

Record the relevant viewport or conditions.

### Functional or Accessibility Check

A verified interaction reveals a usability issue or confirms behaviour.

Examples:

- A dialog traps focus correctly.
- A control is unreachable by keyboard.
- A filter resets unexpectedly.

### User Testing or Analytics

Actual testing or usage data supports an observation.

Record the method, conditions, and limitations.

Do not claim improved conversion, engagement, or usability without
supporting evidence.

### Hypothesis

A recommendation that has not been tested or reviewed.

Label it clearly.

Do not treat hypotheses as approved decisions or proven patterns.

## 6. Entry Categories

### Preference

A visual or interaction preference expressed by Robbie.

Examples of subjects:

- Information density.
- Image prominence.
- Spacing.
- Colour treatment.
- Mobile behaviour.

Apply only to the page, component, or global scope actually specified.

### Effective Pattern

A solution that worked under documented conditions.

Explain what worked and why that conclusion is supported.

Do not automatically apply it to every page.

### Issue and Resolution

A concrete problem and the change that addressed it.

Record enough detail to avoid repeating the problem.

### Revision Lesson

Something learned when an earlier design was changed.

Explain the reason for the revision without treating the earlier
choice as inherently wrong.

### Open Hypothesis

A design idea awaiting implementation, review, or testing.

Keep hypotheses distinct from active shared rules.

## 7. Entry Format

Use this structure for meaningful entries:

### DM-XXX — Short Descriptive Title

- Date: actual date recorded.
- Category: Preference / Effective Pattern / Issue and Resolution /
  Revision Lesson / Open Hypothesis.
- Scope: named page, shared component, or site-wide.
- Evidence: explicit feedback, visual inspection, functional check,
  user testing, analytics, or hypothesis.
- Status: Current / Pending / Superseded / Resolved.

Context:
Describe the relevant page, component, device, or interaction.

Observation:
State what Robbie said or what was actually observed.

Reasoning:
Explain the practical consequence without inventing evidence.

Action:
Describe the implemented change or proposed next step.

Reuse:
State when this lesson applies.

Limits:
State where it should not be generalized.

References:
Link to the relevant page brief, component, decision, or commit
when available.

Keep entries concise.
Omit fields that add no useful information.

Use stable identifiers so later decisions can reference an entry.

## 8. Recording Feedback

Record material feedback after page reviews and meaningful edits.

Preserve the distinction between:

- What Robbie requested.
- What Codex inferred.
- What was implemented.
- What was verified.
- What remains pending.

Do not translate a narrow request into an unsupported global preference.

For example:

“Make the homepage cards shorter on mobile”

does not establish:

“All cards must be short on every page and device.”

If global scope is unclear and affects other pages, ask before
propagating the change.

## 9. Approval and Revision

Approval provides a current direction.
It does not prevent later edits.

When Robbie changes an earlier choice:

1. Follow the new instruction.
2. Update the authoritative design system or page brief.
3. Update relevant memory entries.
4. Mark conflicting historical guidance as superseded.
5. Preserve a short explanation only when useful.

Do not keep old and new preferences simultaneously active.

Do not require Robbie to justify a change in taste.

Do not treat implementation, silence, or the absence of criticism
as explicit approval.

## 10. Local and Shared Lessons

### Local Lesson

Applies to a specific page or context.

Examples of scope:

- Companion profile on narrow mobile screens.
- Looking For editor on desktop.
- Booking summary during checkout.

Keep the lesson local unless broader evidence supports reuse.

### Shared Lesson

Applies to a reusable component or site-wide behaviour.

Before promoting a lesson to shared guidance:

- Check its effect on existing pages.
- Confirm its intended scope.
- Update the shared design system when appropriate.
- Verify affected implementations.

Do not use design memory to silently trigger a site-wide redesign.

## 11. What Counts as a Design Problem

Useful entries describe concrete problems such as:

- Unclear primary action.
- Excessive scrolling for a frequent task.
- Poor text contrast.
- Overlapping controls.
- Inconsistent component behaviour.
- A mobile sidebar that obscures content.
- Important prices or actions that are difficult to find.
- Repeated copy that crowds the page.
- Styling that contradicts Robbie’s reference.
- An interaction that fails keyboard use.

Do not label something a failure solely because it uses:

- Centred headings.
- Three-column layouts.
- Cards.
- Gradients.
- A common font.
- Familiar marketplace navigation.
- Repeated shared components.

Evaluate patterns in context.

## 12. Project Constraints Versus Observed Lessons

Some MeetDiscreet requirements are already explicit:

- Design decisions develop page by page.
- Robbie can request edits at any stage.
- Approved choices should carry forward until revised.
- Detailed boundaries belong on their designated standalone page.
- Ordinary pages should not be crowded with repeated disclaimers.
- Mobile behaviour requires deliberate design.

These are project constraints, not measured design discoveries.

Keep their authoritative wording in AGENTS.md, the design system,
and relevant product documents.

Add memory entries only when implementation or feedback produces
a useful additional lesson.

## 13. Responsive and Accessibility Observations

When recording device-specific findings, include relevant conditions:

- Viewport size.
- Browser or device, if known.
- Input method.
- Text scaling.
- Reduced-motion setting.
- Relevant interaction state.

Do not generalize a screenshot check into full browser compatibility.

Do not describe an interface as accessible based only on appearance.

Record both the identified issue and the verification performed
after a correction.

## 14. Update Triggers

Update this document when:

- Robbie expresses a reusable preference.
- Review feedback reveals a recurring issue.
- A shared component change has useful consequences.
- A responsive correction produces a reusable lesson.
- A verified interaction exposes a usability problem.
- A previous conclusion becomes obsolete.
- Testing supports or disproves a design hypothesis.

Do not add an entry for every minor CSS adjustment.

Routine implementation progress belongs in the roadmap.

## 15. Using Design Memory

Before designing or editing a page:

1. Read entries relevant to that page or shared component.
2. Check whether they are current.
3. Inspect their evidence and scope.
4. Compare them with Robbie’s latest instructions.
5. Apply only relevant lessons.

Do not force unrelated lessons onto a new page.

Do not treat a hypothesis as an instruction.

If memory conflicts with an explicit new request, follow the request
and update the stale entry.

## 16. Maintenance

Keep this file useful rather than exhaustive.

Periodically:

- Merge duplicate lessons.
- Remove vague observations.
- Correct unsupported claims.
- Mark obsolete guidance as superseded.
- Remove resolved implementation notes with no future value.
- Preserve concise context for important revisions.

Do not store private user information, credentials, or unrelated
conversation history.

Avoid logging sensitive screenshots or personal profile content.

## 17. Initial Entries

No project-specific visual outcomes are recorded yet.

Add entries as actual page production, review, and testing occur.

Do not populate this section with fabricated examples presented
as completed work.

## 18. Final Rule

Remember what helps the next design decision.

Keep preferences revisable, observations evidence-based,
and lessons limited to their actual scope.