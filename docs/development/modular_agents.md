# Modular Agents System

## Purpose

This document defines how agents are designed, structured, and integrated as modular, reusable components within the framework.

The goal is to enable scalable, flexible, and maintainable multi-agent workflows.

---

## Core Principles

1. Agents are independent units with clear responsibilities.
2. Agents must be reusable across projects.
3. Agents communicate through defined interfaces, not assumptions.
4. New agents must integrate without breaking existing workflows.
5. No agent should contain hidden or overlapping responsibilities.

## Agent Structure Standard

Every agent must follow this structure:

```plaintext
[AGENT NAME]

Purpose:
- What this agent is responsible for

Inputs:
- What it receives

Outputs:
- What it produces

Constraints:
- What it must NOT do

Dependencies:
- Other agents or systems it relies on

Failure Modes:
- What can go wrong

Integration Points:
- Where it connects in workflows
```

## Agent Categories

### 1. Core Agents

Always active in most workflows:

- Architect
- Critic
- Builder
- Validator
- Auditor

### 2. Support Agents

Enhance system quality and control:

- Security Agent
- Prompt Optimizer
- State Manager
- Change Planner

### 3. Specialized Agents

Project-specific or task-specific:

- SEO Agent
- UI Agent
- Backend Agent
- Data Processing Agent

## Agent Lifecycle

### 1. Creation

- Define purpose clearly
- Avoid overlap with existing agents
- Specify strict inputs/outputs

### 2. Registration

All agents must be declared in a central list:

```plaintext
[AGENT REGISTRY]

- Name:
- Type: Core / Support / Specialized
- Status: Active / Optional
- Dependencies:
```

### 3. Execution

Agents must:

- Operate only within defined scope
- Not override other agents
- Pass output cleanly to next stage

### 4. Deactivation

If an agent is not needed:

- Remove from workflow explicitly
- Do not leave inactive agents assumed

## Communication Rules

Agents must communicate through:

- Structured outputs
- Explicit handoffs
- No implicit assumptions

Example:

```plaintext
[HANDOFF]

From: Architect
To: Builder

Context:
- System design complete

Instructions:
- Implement based on defined structure
```

## Conflict Resolution

If agents disagree:

- Critic identifies conflict
- Architect re-evaluates structure
- Validator ensures final decision is correct

No silent overrides allowed.

## Anti-Patterns (Strictly Forbidden)

- Agents doing multiple unrelated tasks
- Hidden logic inside agents
- Agents modifying global rules
- Skipping agent stages for speed
- Overlapping responsibilities

## Scalability Rules

- New agents must plug into existing workflows
- Do not duplicate functionality
- Prefer extending existing agents before creating new ones

## Integration with Framework

Works with:

- [Agent Workflow](./docs/workflow/agent_workflow.md)
- task_template.md
- [State Manager](./docs/workflow/state_manager.md)
- [Validation Agent](./docs/workflow/validation_agent.md)

Must align with:

- Guardrails
- instruction_priority

## Versioning

Agents must evolve through:

- Controlled updates
- Clear documentation
- Backward compatibility where possible

## Final Rule

If an agent cannot be clearly defined, it should not exist.
