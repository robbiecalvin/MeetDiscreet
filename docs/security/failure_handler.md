# Failure Handler System

## Purpose

The Failure Handler defines how the system detects, classifies, responds to, and recovers from failures.

It ensures failures are handled systematically, not reactively or inconsistently.

---

## Core Principles

1. Failure is expected, not exceptional.
2. Every failure must be classified.
3. Recovery must be structured and repeatable.
4. No silent failures are allowed.
5. Every failure must produce insight.

## Failure Types

### 1. Validation Failure

- Output fails correctness or completeness checks

### 2. Acceptance Failure

- A concrete acceptance criterion is unmet or supporting evidence is missing

### 3. Context Failure

- Conflicting or unclear context
- Misaligned intent

### 4. Routing Failure

- Incorrect task classification
- Wrong agent selection

### 5. Execution Failure

- Builder produces incomplete or broken output

### 6. Systemic Failure

- Repeated failures across multiple attempts
- Indicates deeper structural issue

## Failure Classification

Every failure must be labeled:

```plaintext
[FAILURE REPORT]

Type:
Severity: LOW / MEDIUM / HIGH
Stage:
Cause:
Impact:
```

## Recovery Strategies

### 1. Retry (Simple Fix)

Used for:

- Minor validation issues
- Small gaps or errors

Action:

- Return to Builder with corrections

### 2. Re-route (Structural Fix)

Used for:

- Incorrect task classification
- Wrong agent selection

Action:

- Re-run task_router
- Restart workflow

### 3. Re-contextualize (Alignment Fix)

Used for:

- Ambiguous or conflicting context

Action:

- Re-run context_resolver
- Clarify or rebuild state

### 4. Optimize (Input Fix)

Used for:

- Repeated inefficiencies
- Poor prompt structure

Action:

- Trigger prompt_optimizer
- Re-run workflow

### 5. Escalate (Deep Issue)

Used for:

- Repeated failures
- System instability

Action:

- Investigate the affected system more deeply
- Use a separate agent only when authorized and useful; do not imply an auditor ran

## Failure Workflow

```plaintext
Failure Detected
↓
Classify Failure
↓
Select Recovery Strategy
↓
Apply Correction
↓
Re-run Workflow
↓
Validate Again
```

## Retry Limits

Retry only after a meaningful correction or new diagnosis. Avoid unchanged retry loops. Report concrete external blockers after finishing independent work.

## Failure Logging

All failures must be recorded:

```plaintext
[FAILURE LOG]

Timestamp:
Task:
Failure Type:
Resolution:
Outcome:
```

## Anti-Patterns

- Ignoring failures
- Silent retries without classification
- Infinite retry loops
- Treating symptoms instead of root causes


## Design failures include:

- mismatch with an approved page brief or reference
- broken responsive behaviour or keyboard interaction
- concrete usability or accessibility defects

Record supported observations and their scope in [Design Memory](../design/design_memory.md). Familiar layouts and repeated shared components are not failures.

## Integration Points

Works with:

- [Validation Agent](../workflow/validation_agent.md)
- [Metrics](../strategy/metrics.md)
- [Task Router](../workflow/task_router.md)
- [Context Resolver](../development/context_resolver.md)

Feeds into:

- [Debugging Playbook](debugging_playbook.md)
- change_planning.md

## Learning Loop

Failures must inform:

- [Prompt Optimizer](../strategy/prompt_optimizer.md)
- [Metrics](../strategy/metrics.md)
- change_planning.md
- [Roadmap](../next_steps.md) for unfinished work and handoffs
- [Decisions](../decisions.md) for material choices; design feedback belongs in design memory

No failure should repeat without improvement.

## Versioning

Failure handling must evolve based on:

- Real-world usage
- Failure frequency
- System complexity

## Final Rule

If failure is not handled correctly, the system cannot improve.
