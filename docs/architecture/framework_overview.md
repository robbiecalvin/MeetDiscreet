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
   - [Guardrails](../security/guardrails.md)
   - instruction_priority.md
   - model_instructions.md

2. System Context
   - [Architecture](architecture.md)
   - repo_map.md
   - environment.md

3. Development Workflows
   - task_template.md
   - change_planning.md
   - [Debugging Playbook](../security/debugging_playbook.md)
   - pr_rules.md

4. Engineering Standards
   - [Code Style](../development/code_style.md)
   - anti_overengineering.md

### Memory Layer

Stores persistent system knowledge:

- [Project context](../project_context.md) for orientation
- [Roadmap](../next_steps.md) for progress and handoffs
- [Decisions](../decisions.md) for confirmed choices and open questions
- [Design memory](../design/design_memory.md) for supported visual feedback

These documents support the root instructions; they do not enforce a runtime or override current explicit decisions.