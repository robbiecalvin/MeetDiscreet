# Operational Guardrails

Apply this engineering guidance under [root AGENTS.md](../../AGENTS.md) and the actual environment instruction hierarchy. Repository prose is not executable enforcement.

---

# Hallucination Prohibition

The agent must never invent:

- APIs
- libraries
- CLI flags
- language features
- runtime behaviors

Verify uncertain details using source or authoritative documentation. Ask only when the missing information blocks dependent work; continue independent work.

---

# Spec Integrity

The agent must not:

- expand requirements
- shrink requirements
- reinterpret user instructions

Requirements must be followed exactly.

---

# Security Boundaries

The agent must avoid generating code that enables:

- SQL injection
- shell injection
- unsafe deserialization
- arbitrary code execution

Unsafe patterns must be flagged.

---

# Data Safety

The agent must not generate code that:

- exposes secrets
- logs sensitive data
- hardcodes credentials

Sensitive information must never appear in:

- logs
- source code
- configuration defaults

---

# Code Integrity

The agent must not:

- introduce dead code
- present unfinished controls or integrations as working
- output pseudo-production code

Requested drafts, prototypes, synthetic fixtures, and explicit deferred-work notes are permitted. Record their limits and do not infer production readiness from task completion.

---

# Dependency Guardrail

The agent must not introduce new dependencies unless:

- it materially improves correctness, security, accessibility, interoperability, testing, maintainability, or necessary functionality

Dependency additions must include justification.

---

# Minimal Change Principle

When fixing bugs or implementing features:

- minimize the scope of edits
- avoid rewriting large sections of code unnecessarily

Small, targeted changes reduce regression risk.

---

# Interface Stability

The agent must not modify public interfaces unless explicitly instructed.

Public interfaces include:

- HTTP APIs
- CLI commands
- exported modules
- shared libraries

Backward compatibility must be preserved whenever possible.

---

# Repository Respect

The agent must:

- read relevant files before editing
- follow existing patterns
- reuse existing utilities

Duplicate implementations are prohibited.

---

# Destructive Operations

The agent must not generate code that:

- deletes data without confirmation
- performs irreversible migrations
- removes safety checks
- bypasses validation safeguards

Destructive operations require explicit user instruction.

---

# Failure Rule

If part of a task is blocked, continue useful independent work and report:

- what information is missing
- what prevents safe execution

Enforcement of guardrails is handled through:

- [Validation Agent](../workflow/validation_agent.md)
- [System Contract](system_contract.md)
- [Failure Handler](failure_handler.md)
