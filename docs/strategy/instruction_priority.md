# Instruction Priority

When instructions conflict, the AI agent must resolve them using the following priority order.

Higher levels override lower levels.

All conflicts must be resolved explicitly using:

- [Context Resolver](./docs/development/context_resolver.md)

---

# Priority Order

1. Operational Guardrails  
2. System Contract  
3. Task Instructions  
4. Governance Rules  
5. Workflow Rules  
6. Architecture Context  
7. Environment Constraints  
8. Engineering Standards  
9. Pull Request Rules  

---

# Priority Definitions

## 1. Operational Guardrails

Defined in:

[Guardrails](./docs/security/guardrails.md)

These rules define behaviors that must **never occur**, including:

- insecure code patterns
- hallucinated APIs
- secret exposure
- destructive operations without confirmation

Guardrails override all other instructions.

---

## 2. System Contract

Defined in:

[System Contract](./docs/security/system_contract.md)

The system contract defines:

- non-negotiable system guarantees
- refusal conditions
- execution boundaries

If any instruction violates the system contract, it must be rejected regardless of task intent.

---

## 3. Task Instructions

Defined using:

task_template.md

These instructions represent the **current task objective** and should guide the agent's immediate work.

However, task instructions must never override:

- guardrails
- system contract

---

## 4. Governance Rules

Defined in:

AGENTS.md  
model_instructions.md  

These documents define the expected engineering mindset and decision-making approach the agent must follow.

They govern:

- problem solving approach
- reasoning discipline
- minimal change philosophy
- safe engineering behavior

---

## 5. Workflow Rules

Defined in:

change_planning.md  
[Debugging Playbook](./docs/security/debugging_playbook.md)  
[Workflow Engine](./docs/workflow/workflow_engine.md)  

These documents control **how work is performed**, including:

- planning multi-file changes
- debugging failures
- enforcing execution order

Workflow rules guide execution but must not override governance rules, system contract, or guardrails.

---

## 6. Architecture Context

Defined in:

[Architecture](./docs/architecture/architecture.md)  
repo_map.md  

These documents define the intended structure of the system, including:

- module boundaries
- dependency direction
- separation of concerns

Architecture rules guide structural decisions but should not introduce unnecessary complexity.

---

## 7. Environment Constraints

Defined in:

environment.md

These instructions define assumptions about the runtime environment including:

- supported languages
- build and test behavior
- runtime expectations

Environment constraints ensure generated code is compatible with the repository.

---

## 8. Engineering Standards

Defined in:

[Code Style] (./docs/development/code_style.md)  
anti_overengineering.md  

These rules enforce:

- coding conventions
- maintainability
- simplicity

Style and complexity rules apply only after correctness and architecture constraints are satisfied.

---

## 9. Pull Request Rules

Defined in:

pr_rules.md

These rules apply when preparing changes for review, including:

- commit message formatting
- PR description expectations
- testing requirements

PR rules govern **how changes are presented**, not how they are implemented.

---

# Conflict Resolution Rule

All instruction conflicts must be resolved explicitly using:

- [Context Resolver](./docs/development/context_resolver.md)

The system must:

- identify conflicts
- apply priority hierarchy
- discard lower-priority instructions

No implicit merging of conflicting instructions is allowed.

---

# Final Rule

If instruction priority is not enforced, system behavior becomes unpredictable.