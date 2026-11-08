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

### 2. metrics Failure

- Output passes validation but scores below threshold

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

- Trigger Auditor
- Perform full system review

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

Maximum retries per task: `3`

If exceeded:

- Escalate to Systemic Failure

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

- generic layout detection
- repeated design patterns
- weak visual identity

These must be logged to [Design Memory](./docs/design/design_memory.md) under [ANTI-PATTERN]

## Integration Points

Works with:

- [Validation Agent](./docs/workflow/validation_agent.md)
- [Metrics] (./docs/strategy/metrics.md)
- [Task Router](./docs/workflow/task_router.md)
- [Context Resolver](./docs/development/context_resolver.md)

Feeds into:

- [Debugging Playbook](./docs/security/debugging_playbook.md)
- ChangePlanner.md

## Learning Loop

Failures must inform:

- [Prompt Optimizer] (./docs/strategy/prompt_optimizer.md)
- [Metrics] (./docs/strategy/metrics.md)
- change_planning.md
- system_memory.md (for recurring or systemic issues)

No failure should repeat without improvement.

## Versioning

Failure handling must evolve based on:

- Real-world usage
- Failure frequency
- System complexity

## Final Rule

If failure is not handled correctly, the system cannot improve.
