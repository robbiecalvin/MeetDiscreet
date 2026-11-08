# AI Agent Development Framework

This framework provides a structured instruction system for AI coding agents.

Instead of relying on free-form prompts, the system defines:

- agent governance
- instruction hierarchy
- architecture awareness
- development workflows
- debugging procedures
- coding standards

The goal is to convert LLMs from conversational tools into structured development assistants that follow engineering discipline.

## Framework Layers

1. Governance
   - [Guardrails](./docs/security/guardrails.md)
   - instruction_priority.md
   - model_instructions.md

2. System Context
   - [Architecture](./docs/architecture/architecture.md)
   - repo_map.md
   - environment.md

3. Development Workflows
   - task_template.md
   - change_planning.md
   - [Debugging Playbook](./docs/security/debugging_playbook.md)
   - pr_rules.md

4. Engineering Standards
   - [Code Style] (./docs/development/code_style.md)
   - anti_overengineering.md

### Memory Layer

Stores persistent system knowledge:

- system_memory.md