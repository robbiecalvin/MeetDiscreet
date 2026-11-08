# MeetDiscreet — Validation Evidence

Evaluate the agreed scope using observable acceptance criteria, following
[root instructions](../../AGENTS.md). Do not assign numerical quality scores,
use score thresholds, or infer production readiness from a passing task.

Consider only dimensions relevant to the work:

- Correctness: expected behaviour and meaningful edge cases.
- Completeness: requested outcomes delivered; deferred work explicit.
- Clarity: understandable implementation and accurate documentation.
- Maintainability: justified dependencies and useful shared patterns.
- Reliability: relevant regression, error, and recovery checks.
- Constraints: privacy, permissions, pricing integrity, and approved design.

Report checks actually executed and their results. Distinguish passed, failed,
skipped, blocked, and unrun checks. Include conditions and limitations for
browser observations. Use measured performance data only when collected.

For visual work, compare the rendered page with the approved brief and
relevant [design rules](../design/design_system.md). Familiar layouts are
not failures, and novelty is not a metric.

Correct observed defects and rerun affected checks. Report remaining blockers
without manufacturing success. Keep implementation, visual approval, testing,
integration, deployment, and release readiness separate. Production requires
the applicable [launch checks](../development/launch_acceptance.md) and
Robbie’s release decision.
