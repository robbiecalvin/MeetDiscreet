# Debugging Playbook

This document defines the required process for diagnosing and fixing bugs.

The goal is to ensure fixes address the **root cause**, not just the symptoms.

---

## Debugging Principles

When a bug occurs:

- do not guess
- do not apply speculative fixes
- do not modify multiple areas without justification

Every fix must be based on **evidence from the codebase or runtime behavior**.

Debugging must begin with structured failure classification using:

- [Failure Handler](./docs/security/failure_handler.md)

---

## Required Debugging Workflow

The agent must follow this sequence:

1. classify failure (`[Failure Handler](./docs/security/failure_handler.md))
2. reproduce the failure
3. examine error messages and stack traces
4. identify the failing component
5. trace the execution path leading to the failure
6. determine the root cause
7. implement the smallest possible fix
8. verify the fix with tests
9. validate results using:
   - [Validation Agent](./docs/workflow/validation_agent.md)
   - [Metrics] (./docs/strategy/metrics.md)

Skipping steps is prohibited.

---

## Failure Reproduction

Before modifying code, the agent must:

- identify the failing test or runtime error
- reproduce the failure deterministically
- confirm the failure occurs before making changes

If the failure cannot be reproduced, the agent must stop and report uncertainty.

---

## Evidence Collection

The agent should collect evidence such as:

- stack traces
- failing assertions
- incorrect return values
- invalid state transitions

Changes must be justified by observed evidence.

---

## Root Cause Identification

A bug fix must address the **root cause**, not the visible symptom.

Examples:

**Symptom fix (incorrect):**

- add try/catch around failing code

**Root cause fix (correct):**

- correct invalid input validation that caused the failure

---

## Minimal Fix Rule

After identifying the root cause:

- implement the smallest possible fix
- avoid unrelated refactoring
- avoid modifying multiple modules unnecessarily

Large edits increase regression risk.

---

## Verification

After implementing a fix:

1. run the failing tests
2. run related tests
3. confirm no regressions occur
4. validate output using:
   - [Validation Agent](./docs/workflow/validation_agent.md)
   - [Metrics] (./docs/strategy/metrics.md)

If tests do not exist for the bug scenario, the agent should:

- extend existing tests
- add a minimal test covering the failure case

---

## Regression Prevention

Bug fixes should include test coverage for:

- the failure scenario
- nearby edge cases when relevant

This ensures the bug does not reappear later.

---

## Uncertain Diagnoses

If the root cause cannot be determined with confidence, the agent must stop and report:

- the observed symptoms
- possible causes
- missing information required to proceed

---

## Debugging Feedback Loop

All debugging outcomes must inform:

- change_planning.md (future planning improvements)
- [Prompt Optimizer] (./docs/strategy/prompt_optimizer.md) (input refinement if applicable)
- [Metrics] (./docs/strategy/metrics.md) (performance tracking)

Repeated failure patterns must trigger:

- deeper system review
- potential escalation via `[Failure Handler](./docs/security/failure_handler.md)

---

## Final Rule

A fix is not complete unless:

- the root cause is resolved  
- the behavior is validated  
- and regression risk is reduced