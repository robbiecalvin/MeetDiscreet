# Context Resolver System

## Purpose

The Context Resolver determines which information is relevant, authoritative, and actionable at any point in execution.

It prevents conflicts, ambiguity, and stale data from corrupting system behavior.

---

## Core Principles

1. Not all context is equal.
2. Conflicts must be resolved explicitly.
3. The most relevant context must always win.
4. Stale or irrelevant context must be discarded.

## Context Sources

The system may receive context from multiple sources:

- User Input
- ProjectContext
- NextSteps
- state_manager
- repo_map / Codebase
- Framework Files (Guardrails, instruction_priority, etc.)
- SystemMemory (system_memory.md)
- [Design System](./docs/design/design_system.md)
- [Design Memory](./docs/design/design_memory.md)
- [Design Variation Engine](./docs/design/design_variation_engine.md)

## Context Priority Order

When conflicts occur, resolve using this hierarchy:

```plaintext
1. Guardrails / Safety Constraints
2. instruction_priority
3. Explicit User Intent (Current Task)
4. Active Project Context
5. Current State (state_manager)
6. Historical Context
7. Default Framework Behavior
```

## Context Resolution Process

### Step 1: Collect Context

- Gather all available inputs
- Identify overlapping or conflicting data

### Step 2: Classify Context

Each piece of context must be labeled:

- Critical (must follow)
- Relevant (should follow)
- Optional (nice to have)
- Irrelevant (discard)

### Step 3: Conflict Detection

Identify:

- Contradictions
- Outdated instructions
- Ambiguous directives

### Step 4: Resolution

If conflict exists:

- Apply priority hierarchy
- Select dominant instruction
- Log discarded or overridden context

### Step 5: Clean Context Output

Produce a resolved context set:

```plaintext
[RESOLVED CONTEXT]

Primary Goal:
- ...

Constraints:
- ...

Active Instructions:
- ...

Discarded Context:
- ...
```

## Context Freshness Rules

- Prefer current input over historical data
- Expire outdated `NextSteps`
- Re-validate `ProjectContext` periodically

## Ambiguity Handling

If context is unclear:

- Pause execution
- Request clarification, or
- Proceed with safest valid interpretation

## Context Compression

When context becomes large:

- Summarize into structured format
- Retain only actionable data
- Remove duplication

## Failure Modes

- Conflicting instructions ignored
- Stale context overriding current intent
- Overloading system with irrelevant data

## Correction Rules

If output misaligns:

- Re-run context resolution
- Re-evaluate priority order
- Update state

## Anti-Patterns

- Blindly merging all context
- Ignoring conflicts
- Overvaluing historical data
- Carrying unnecessary context forward

## Integration Points

Works with:

- [State Manager](./docs/workflow/state_manager.md)
- [Task Router](./docs/workflow/task_router.md)
- [Workflow Engine](./docs/workflow/workflow_engine.md)

Aligns with:

- instruction_priority`
- Guardrails`

## Versioning

Context logic must evolve based on:

- System complexity
- Identified conflicts
- Scaling requirements

## Final Rule

If context is not resolved correctly, everything that follows will be wrong.
