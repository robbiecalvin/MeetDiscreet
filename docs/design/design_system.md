# MeetDiscreet — Living Design System

## 1. Purpose

MeetDiscreet’s visual design develops progressively during production.

This document records current shared design decisions.
It does not require the entire website to be designed before building begins.

Robbie may request changes before, during, or after implementation.

Approved choices provide consistency.
They are not permanent restrictions.

## 2. Design Authority

Robbie directs the visual design.

Use this order when making visual decisions:

1. Robbie’s current explicit instructions.
2. Current approved page-specific decisions.
3. Current approved shared design decisions.
4. Existing implementation patterns.
5. Clearly identified provisional recommendations.

Apply this order within the repository’s actual instruction hierarchy.

A new request may revise an earlier decision.
Do not refuse an edit because an older version was approved.

Do not silently replace approved choices with personal preferences
or automatic design-variation rules.

## 3. Progressive Design

Decide only what is needed for the current page or feature.

Before building the first page, establish enough shared direction for
a useful first version, such as:

- Initial colour direction.
- Typography direction.
- Navigation approach.
- Basic spacing and content width.
- Overall visual character.

These choices may begin provisionally.

Do not block production because unrelated details remain undecided.

Allow later pages to reveal new component requirements.
Extend the shared system when those requirements become concrete.

Do not generate a complete speculative component library in advance.

## 4. Decision Status

Use these statuses for meaningful design decisions:

### Undecided

No choice has been made.

Ask when the decision becomes relevant.
Do not present an invented choice as approved.

### Provisional

A working choice used to produce a reviewable version.

Record its provisional status.
It may be revised without being treated as a reversal or problem.

### Approved

Robbie has explicitly accepted the choice.

Reuse it where applicable until Robbie requests a change.

### Superseded

A later decision replaces the earlier choice.

Keep a concise history only when it helps explain the current design.
Remove obsolete rules from active guidance.

Implementation alone does not mean approval.
Silence does not mean approval.

## 5. Page-by-Page Questions

Before designing a new page:

1. Read existing shared decisions.
2. Read the page requirements and any existing page brief.
3. Identify visual choices that remain unresolved.
4. Ask a small, focused set of questions.
5. Build the agreed version.
6. Present it for review.

Ask approximately 5–8 questions when needed.
Ask fewer when the requirements or existing decisions already answer them.

Useful topics include:

- What should dominate the page?
- Should the layout be dense, balanced, or spacious?
- Which information should appear first?
- Should content use cards, rows, panels, or another treatment?
- Where should primary actions appear?
- How should filters, sidebars, and upgrades behave?
- What should change on mobile?
- Are there reference images or specific details to follow?

Offer concrete options and a recommendation when helpful.

Do not ask questions about every future page at once.
Do not repeatedly ask settled global questions.

If Robbie delegates a visual decision, make a reasonable recommendation
and proceed. Mark it provisional until explicitly approved.

## 6. Build and Review Cycle

Use this cycle:

Discuss → Build → Preview → Review → Edit → Record

### Discuss

Resolve the visual decisions needed for the current work.

### Build

Implement a coherent, functional version using the current design direction.

### Preview

Provide a working preview or available visual evidence.

Clearly identify anything that has not been inspected.

### Review

Invite feedback on the implemented page.

Do not require formal approval after every minor adjustment.

### Edit

Apply requested changes directly within the authorized scope.

### Record

Update the page brief or shared decisions when the change is meaningful.

Do not turn every spacing adjustment into a separate decision-log entry.

## 7. Editing Existing Pages

Robbie may return to any page and request edits.

Treat clear edit requests as authorization to make those edits.

Examples:

- Make the cards shorter.
- Change the background.
- Move the filters into a sidebar.
- Make the profile photo larger.
- Reduce spacing on mobile.
- Replace the font.
- Change the navigation.
- Redesign the homepage.

Do not repeat the initial questionnaire when the requested change is clear.

Ask only when an unresolved choice materially affects the result.

Preserve unrelated approved work.

If the request changes the broader visual direction, update the relevant
shared guidance and identify affected pages.

## 8. Local and Shared Changes

Distinguish page-specific edits from shared-system edits.

### Page-Specific

Apply to the named page unless Robbie says otherwise.

Examples:

- Homepage hero height.
- Profile gallery arrangement.
- Booking-form column layout.
- Listing-editor sidebar placement.

### Shared

Apply to a reusable component or global design rule.

Examples:

- Primary button colour.
- Site typography.
- Shared listing-card appearance.
- Navigation style.
- Global spacing tokens.

If Robbie explicitly requests a site-wide change, apply it consistently.

If scope is ambiguous and a shared change would affect several pages,
ask whether the change should be local or global.

Do not silently modify every page to satisfy a local request.

When maintaining a deliberate local variation, make the implementation
explicit rather than adding fragile overrides.

## 9. Shared Design Foundations

Record choices as they are established.

The shared system may include:

- Brand colours.
- Background and surface colours.
- Text colours.
- Typography.
- Content widths.
- Spacing scale.
- Borders and radii.
- Shadows.
- Buttons and links.
- Form controls.
- Cards and listing rows.
- Navigation.
- Dialogs and drawers.
- Icons.
- Motion.
- Responsive behaviour.

Use CSS custom properties and reusable components where appropriate.

Do not hardcode competing versions of the same shared value
throughout the website.

Do not choose values merely to fill this document.

## 10. Current Decision Register

Initial shared direction selected by Robbie on 2026-11-08. The rendered
prototype remains subject to visual review. Unselected details stay provisional.

| Area | Current decision | Status |
|---|---|---|
| Brand name | MeetDiscreet | Approved |
| Colour palette | Dark and elegant: #121521 background, #38476b surfaces/accents, #b6192e primary actions | Approved direction |
| Typography | Agrandir: bold headings/subheadings, thin regular text; licensed files pending, system fallback used | Approved direction; fallback provisional |
| Navigation | Public desktop navigation with search/location, sign-in, posting entry point | Approved direction |
| Content width and spacing | Not yet selected | Undecided |
| Cards and listing treatment | People grid by default; mobile three portrait cards per row; bottom switch to single-column compact ads | Approved direction |
| Buttons and form styling | Burgundy primary actions, muted blue filters, restrained corners | Provisional implementation |
| Motion | Restrained feedback; respect reduced-motion preferences | Provisional |
| Mobile navigation | Compact header, filter drawer, fixed people/ads switch | Approved direction |

Discovery’s 2026-11-13 refresh adds provisional blush typography, rounded portrait
cards and controls, a burgundy/navy glow and a pill-shaped view switch in response
to Robbie’s request for a sexier look. These scoped treatments do not restyle
account tools.

Page-specific behaviour is recorded in [the discovery brief](./page_briefs/discovery.md).
Update this register as actual decisions are made.

Do not infer approval from an earlier example, an unreviewed mockup,
or a general preference from another project.

## 11. Page Briefs

Store page-specific decisions in:

docs/design/page_briefs/

Create a brief when work on that page begins.

A brief should capture:

- Page purpose.
- Intended audience.
- Access tier.
- Layout.
- Content hierarchy.
- Primary and secondary actions.
- Imagery.
- Shared components.
- Desktop behaviour.
- Mobile behaviour.
- Required interaction states.
- Provisional choices.
- Approved choices.
- Outstanding feedback.

Update the current brief after meaningful edits.

Do not maintain contradictory active versions of the same page design.

## 12. Visual References

When Robbie provides a screenshot, image, PDF, or existing page:

- Inspect it before describing its visual details.
- Identify what should be followed.
- Ask about unclear details only when necessary.
- Distinguish close reproduction from loose inspiration.
- Preserve the reference’s relevant visual relationships.

Do not claim exact colour, typography, or layout matching without evidence.

A reference for one page does not automatically redefine the whole site.

## 13. Layout and Visual Character

Choose layouts that suit the page’s purpose and Robbie’s preferences.

Allowed approaches include:

- Familiar marketplace grids.
- Listing rows.
- Sidebars.
- Editorial layouts.
- Split layouts.
- Centred sections.
- Dense dashboards.
- Spacious promotional sections.
- Other approved arrangements.

No layout, font, or colour is prohibited solely because it is common.

Do not force asymmetry, unusual spacing, animation, or visual novelty.

Brand identity should develop through deliberate, consistent choices.

Do not require each page to look different from the others.

## 14. Content and Interface Restraint

Include content and controls that serve the page.

Do not automatically add:

- Unrequested feature grids.
- Fake testimonials.
- Fake statistics.
- Decorative badges.
- Unnecessary hero sections.
- Repeated explanatory cards.
- Repetitive promotional sections.
- Excessive animation.

Use genuine product content and clearly identified synthetic fixtures
during development.

Keep detailed eligibility and content boundaries on the designated
Community Guidelines & Boundaries page.

Retain concise transaction-specific information where users need it.

## 15. Responsive Design

Design desktop and mobile behaviour as related parts of the same page.

Decide relevant differences while building that page:

- Column stacking.
- Navigation changes.
- Filter drawers.
- Sidebar placement.
- Card density.
- Gallery behaviour.
- Sticky actions.
- Form layout.
- Content priority.

Do not simply shrink the desktop layout.

Do not remove essential information or actions to make a mobile
screenshot look cleaner.

Check intermediate widths as well as desktop and narrow mobile layouts.

## 16. Accessibility and Usability

Maintain:

- Readable text.
- Suitable contrast.
- Visible keyboard focus.
- Semantic structure.
- Labelled controls.
- Usable touch targets.
- Clear validation feedback.
- Keyboard-operable interactions.
- Reduced-motion support.
- Accessible dialogs and navigation.

If a requested visual treatment creates a usability problem,
explain the specific issue and propose the closest workable treatment.

Do not use accessibility as a vague reason to reject personal taste.

## 17. Interaction States

Design relevant states alongside the normal page appearance:

- Loading.
- Empty.
- Validation error.
- Network error.
- Success.
- Disabled.
- Selected.
- Hover and focus.
- Restricted access.
- Expired entitlement.

Do not present inactive or unimplemented controls as working features.

Use consistent state treatments across shared components.

## 18. Validation

Evaluate the current implementation against:

- Robbie’s latest instructions.
- The current page brief.
- Approved shared decisions.
- Functional requirements.
- Responsive behaviour.
- Accessibility.
- Relevant interaction states.

Report concrete issues.

Do not reject a design merely because:

- It uses a common layout.
- It resembles a familiar marketplace.
- It lacks an unconventional interaction.
- It shares components with another page.

Do not automatically regenerate approved work based on a subjective
generic-design score.

A page can satisfy implementation checks while still awaiting
Robbie’s visual review.

## 19. Documentation Ownership

Use:

- This document for shared visual rules.
- Page briefs for page-specific decisions.
- design_memory.md for useful observations and lessons.
- decisions.md for significant cross-project decisions.
- next_steps.md for implementation progress.

Avoid repeating the same decision in every document.

When a visual rule changes, update the authoritative location
and remove contradictory active guidance.

## 20. Final Rule

Design MeetDiscreet collaboratively as it is built.

Ask what is needed for the current page.
Build a reviewable version.
Apply requested edits.
Record meaningful choices.
Reuse current decisions until Robbie changes them.

Consistency is the starting point for the next iteration,
not a prohibition against revision.