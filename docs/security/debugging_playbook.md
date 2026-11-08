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

- [Failure Handler](failure_handler.md)

---

## Required Debugging Workflow

The agent must follow this sequence:

1. classify failure ([Failure Handler](failure_handler.md))
2. reproduce the failure
3. examine error messages and stack traces
4. identify the failing component
5. trace the execution path leading to the failure
6. determine the root cause
7. implement the smallest possible fix
8. verify the fix with tests
9. validate results using:
   - [Validation Agent](../workflow/validation_agent.md)
   - [Metrics](../strategy/metrics.md)

Apply these responsibilities proportionally under root AGENTS.md. Do not repeat irrelevant steps or checks.

---

## Failure Reproduction

Before modifying code, the agent must:

- identify the failing test or runtime error
- reproduce the failure deterministically
- confirm the failure occurs before making changes

If reproduction is unavailable, continue useful investigation and report the evidence limits. Do not invent a confirmed cause.

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
   - [Validation Agent](../workflow/validation_agent.md)
   - [Metrics](../strategy/metrics.md)

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

If the root cause remains uncertain, continue useful independent investigation and report:

- the observed symptoms
- possible causes
- missing information required to proceed

---

## Debugging Feedback Loop

All debugging outcomes must inform:

- change_planning.md (future planning improvements)
- [Prompt Optimizer](../strategy/prompt_optimizer.md) (input refinement if applicable)
- [Metrics](../strategy/metrics.md) (performance tracking)

Repeated failure patterns must trigger:

- deeper system review
- potential escalation via [Failure Handler](failure_handler.md)

---

## Final Rule

A fix is not complete unless:

- the root cause is resolved  
- the behavior is validated  
- and regression risk is reduced