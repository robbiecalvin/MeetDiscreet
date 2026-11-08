# MeetDiscreet — Task Routing

Follow [root instructions](../../AGENTS.md). Identify the actual request,
affected page or feature, dependencies, and consequences before execution.
Use [selective context loading](../development/context_and_rate_limits.md).

Scale work to the task:

- Small edits: inspect affected files, make the correction, run targeted checks.
- Shared or multi-file changes: outline the plan, identify consumers, verify related behaviour.
- Payments, permissions, migrations, and production operations: use explicit acceptance criteria, deeper validation, and an appropriate recovery approach.

Planning and review requests do not authorize unrelated implementation.
Ask only for unresolved information needed by dependent work; continue
independent work. Do not default all tasks to the full framework pipeline.

Architect, Builder, Validator, and similar names describe responsibilities.
One agent may perform them. Complexity does not require spawning agents;
use separate agents only when authorized and useful, and report only work
that actually occurred.

Apply the [workflow guide](./workflow_engine.md) proportionally and report
concrete [validation results](./validation_agent.md), not a routing ceremony.
