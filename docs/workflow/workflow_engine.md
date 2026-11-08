# MeetDiscreet — Workflow Guide

Follow [root instructions](../../AGENTS.md) proportionally:

Route → Resolve → Execute → Validate → Measure → Improve → Recover

1. Identify the objective, scope, dependencies, and consequences.
2. Load [relevant context](../development/context_and_rate_limits.md) and resolve only blocking unknowns.
3. Perform the authorized work, preserving unrelated changes.
4. Run checks that demonstrate the requested behaviour or documentation consistency.
5. Compare results with concrete acceptance criteria, using [evidence](../strategy/metrics.md).
6. Correct observed issues and rerun affected checks.
7. Diagnose failures, preserve a useful handoff, and report external blockers.

These are responsibilities, not mandatory separate agents or an automated
runtime. One agent can perform them. Do not spawn agents merely because
stages have names or claim orchestration occurred without evidence.

Use brief planning and targeted verification for small changes. Expand planning,
recovery, and validation for consequential changes. Do not require ceremonial
reports, numerical gates, or a complete rerun of unrelated checks.

Continue independent work when a decision blocks only part of the task.
Retry failures only after new evidence or a meaningful correction. Finish
with actual changes, results, limitations, and the next dependency.
A completed task does not automatically make the application production-ready.
