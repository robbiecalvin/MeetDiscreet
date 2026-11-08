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

- [Task Router](../workflow/task_router.md)
- [Workflow Engine](../workflow/workflow_engine.md)
- [Project context](../project_context.md), [roadmap](../next_steps.md), and [decisions](../decisions.md)

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

- Concrete acceptance criteria are unmet
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

> "Improve clarity, reduce redundancy, and meet the stated acceptance criteria and report verification limits"

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
- "Implement the agreed scope and distinguish prototypes from live integrations"

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

Keep reusable task structure in [the task template](../workflow/task_template.md). Record progress in [the roadmap](../next_steps.md), material decisions in [the decision register](../decisions.md), and supported visual lessons in design memory. Do not create a competing memory file.

## Design improvements must consider:

- successful patterns from [Design Memory](../design/design_memory.md)
- approved page briefs and the [design system](../design/design_system.md)

Preserve useful familiar layouts and approved references. Do not optimize for novelty.

## Anti-Patterns

- Overcomplicating prompts unnecessarily
- Adding constraints without purpose
- Ignoring real performance data
- Optimizing based on assumptions instead of results

## Integration Points

Works with:

- [Metrics](metrics.md)
- [Validation Agent](../workflow/validation_agent.md)
- task_template.md

Feeds into:

- [Agent Workflow](../workflow/agent_workflow.md)
- ProjectTemplates`

## Versioning

Prompts must evolve through:

- Iterative refinement
- Version tracking (`v1`, `v1.1`, `v2`)
- Controlled improvements

## Final Rule

If a prompt produces inconsistent results, it is not finished.
