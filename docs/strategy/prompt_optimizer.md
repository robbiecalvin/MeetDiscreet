# Prompt Optimizer System

## Purpose

The Prompt Optimizer is responsible for analyzing, refining, and improving prompts over time to increase clarity, efficiency, and output quality.

It ensures that prompting evolves based on performance data, not guesswork.

---

## Core Principles

1. Prompts are systems, not one-time inputs.
2. Every prompt can be improved.
3. Optimization is driven by metrics and failures.
4. Clarity and constraint produce better outputs than creativity alone.

Prompts must align with system execution:

- [Task Router](./docs/workflow/task_router.md)
- [Workflow Engine](./docs/workflow/workflow_engine.md)
- system_memory.md

## Responsibilities

The Prompt Optimizer must:

- Analyze prompt effectiveness
- Identify ambiguity and inefficiencies
- Refine structure and constraints
- Improve instruction clarity
- Align prompts with system architecture
- Ensure repeatability

## Optimization Triggers

Prompt optimization must occur when:

- metrics score `< 10`
- Validation fails
- Output contains ambiguity
- Repeated corrections are required
- User clarification is frequently needed

## Optimization Targets

### 1. Clarity

- Remove vague language
- Replace open-ended phrasing with explicit instructions

BAD:

> "Make it better"

GOOD:

> "Improve clarity, reduce redundancy, and ensure production-ready output"

### 2. Structure

- Convert free-form prompts into structured formats
- Use defined control blocks

Example:

```plaintext
[MODE]
[INTENT]
[CONSTRAINTS]
[OUTPUT]
```

### 3. Constraint Definition

- Add explicit limitations
- Prevent unwanted behavior

Example:

- "No placeholders"
- "Production-ready code only"

### 4. Scope Control

- Narrow overly broad requests
- Prevent scope creep

### 5. Redundancy Removal

- Eliminate repeated or conflicting instructions
- Simplify where possible

## Optimization Workflow

### Step 1: Input Analysis

- Review original prompt
- Identify weaknesses

### Step 2: Failure Mapping

Map issues to:

- metrics failures
- Validation errors
- Output inconsistencies

### Step 3: Refinement

Rewrite prompt using:

- Clear intent
- Structured format
- Defined constraints

### Step 4: Re-Test

- Re-run prompt through system
- Compare results

### Step 5: Store Improved Version

- Save optimized prompt as a reusable template

## Output Format

```plaintext
[PROMPT OPTIMIZATION REPORT]

Original Prompt:
- ...

Issues Identified:
- ...

Optimized Prompt:
- ...

Expected Improvements:
- Clarity
- Accuracy
- Consistency
```

## Prompt Templates

Optimized prompts should be stored in a reusable format:

```plaintext
[PROMPT TEMPLATE]

Mode:
Intent:
Context:
Constraints:
Output:
```

## Feedback Integration

Prompt optimization must use:

- metrics data
- Validation results
- User corrections
- Repeated failure patterns

No optimization without evidence.

Previously successful prompt patterns may be stored and reused via system_memory.md

## Design improvements must consider:

- successful patterns from [Design Memory](./docs/design/design_memory.md)
- variation gaps from [Design Variation Engine](./docs/design/design_variation_engine.md)

Avoid reinforcing generic layouts even if they perform adequately.

## Anti-Patterns

- Overcomplicating prompts unnecessarily
- Adding constraints without purpose
- Ignoring real performance data
- Optimizing based on assumptions instead of results

## Integration Points

Works with:

- [Metrics] (./docs/strategy/metrics.md)
- [Validation Agent](./docs/workflow/validation_agent.md)
- task_template.md

Feeds into:

- [Agent Workflow](./docs/workflow/agent_workflow.md)
- ProjectTemplates`

## Versioning

Prompts must evolve through:

- Iterative refinement
- Version tracking (`v1`, `v1.1`, `v2`)
- Controlled improvements

## Final Rule

If a prompt produces inconsistent results, it is not finished.
