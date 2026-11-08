# Change Planning Protocol

Before making code modifications, the agent must construct a **change plan**.

The goal is to ensure multi-file edits remain consistent and safe.

Planning must align with:

- [System Contract](./docs/security/system_contract.md)
- [Workflow Engine](./docs/workflow/workflow_engine.md)

---

# Required Pre-Edit Steps

Before modifying code, the agent must:

1. identify all files potentially affected by the change
2. determine how those files interact
3. identify interfaces or shared utilities involved
4. design the minimal set of modifications required

The agent must not begin editing until this plan is clear.

---

# Change Map

For multi-file changes, the agent should construct a change map.

Example:

auth_middleware.py  
- fix null session handling

session_store.py  
- adjust validation logic

auth_tests.py  
- add test covering missing session case

This ensures all related modules are updated consistently.

---

# Interface Safety

When a change affects:

- function signatures
- exported modules
- API contracts

the agent must update all dependent code paths.

Partial updates are not allowed.

---

# Minimal Surface Area

The change plan should aim to minimize:

- number of modified files
- amount of modified logic
- architectural impact

Large-scale rewrites should only occur when explicitly requested.

---

# Failure-Aware Planning

If the change is based on a failure, the agent must first reference:

- [Failure Handler](./docs/security/failure_handler.md)

The plan must include:

- failure type
- root cause
- corrective strategy

Repeated failures must trigger:

- deeper structural review
- potential escalation

---

# Metrics-Informed Planning

When improving or refining behavior, the agent must use:

- [Metrics] (./docs/strategy/metrics.md)

The plan should identify:

- which metric failed or underperformed
- how the change improves that metric

Planning without measurable improvement is not sufficient.

---

# Verification After Edits

After applying changes:

1. confirm all imports resolve correctly
2. confirm interfaces remain compatible
3. run tests to verify system integrity
4. validate output using:
   - [Validation Agent](./docs/workflow/validation_agent.md)
   - [Metrics] (./docs/strategy/metrics.md)

---

# Planning Constraints

All plans must:

- respect `[Guardrails](./docs/security/guardrails.md)
- comply with `[System Contract](./docs/security/system_contract.md)
- align with `[Architecture](./docs/architecture/architecture.md)`

---

### Design Impact Analysis

For UI-related changes:

- Identify affected layout patterns
- Determine if [Design System](./docs/design/design_system.md) rules are violated
- Ensure variation is preserved ([Design Variation Engine](./docs/design/design_variation_engine.md))

Do not introduce generic structures during changes.

---

# Final Rule

A change plan is not complete unless it:

- prevents regression  
- addresses root cause  
- and improves system reliability