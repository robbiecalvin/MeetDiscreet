# MeetDiscreet — Validation Responsibilities

Validation is a responsibility that may be performed by the implementing
agent. This document does not start an independent agent or enforce a runtime.
Follow [root instructions](../../AGENTS.md) and the agreed task scope.

Check relevant outcomes:

- Required structure, links, or schemas.
- Correct behaviour and meaningful edge cases.
- Completeness against the actual request.
- Applicable permissions, privacy, and financial rules.
- Compatibility with affected consumers.
- Rendered desktop/mobile behaviour and keyboard interaction for visual work.

Compare design with the [design system](../design/design_system.md), approved
page brief, and relevant [design feedback](../design/design_memory.md).
Do not reject a layout for being familiar, require uniqueness, or trigger
an unsolicited redesign.

Report executed checks with outcomes and limitations. Distinguish passing,
failing, blocked, skipped, and unrun checks. Correct failures within scope;
report unrelated failures honestly. Expand investigation when evidence warrants
it, without inventing an auditor or other agent.

A passing check validates only the behaviour and conditions tested. Keep visual
approval, implementation, testing, integration, deployment, and release status
separate. Never automatically mark output production-ready. Use the applicable
[launch criteria](../development/launch_acceptance.md) for release review.
