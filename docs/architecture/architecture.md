# Architecture Guidelines
This framework follows a **clarity-first architecture philosophy**. Code must remain understandable to engineers who did not originally write it.
## Core Principles
1. Prefer simple architectures over complex ones.
2. Prefer composition over inheritance.
3. Prefer explicit behavior over implicit behavior.
4. Prefer small modules with clear responsibilities.
### System Architecture Layers
In addition to code-level architecture, the system operates across defined execution layers. These layers ensure that the system is: predictable, enforceable and scalable
1. Input Layer
   - [Task Router](./docs/workflow/task_router.md)
2. Context Layer
   - [Context Resolver](./docs/development/context_resolver.md)
   - [State Manager](./docs/workflow/state_manager.md)
3. Execution Layer
   - [Workflow Engine](./docs/workflow/workflow_engine.md)
   - [AGENTS] (./docs/AGENTS.md)
4. Validation Layer
   - [Validation Agent](./docs/workflow/validation_agent.md)
   - [Metrics] (./docs/strategy/metrics.md)
5. Optimization Layer
   - [Prompt Optimizer](./docs/strategy/prompt_optimizer.md)
6. Recovery Layer
   - [Failure Handler](./docs/security/failure_handler.md)
7. Governance Layer
   - [System Contract](./docs/security/system_contract.md)
   - [Guardrails](./docs/security/guardrails.md)
###  Separation of Concerns
When designing systems, maintain clear boundaries between:
1. Domain Logic:
   - Pure business logic
   - Independent from infrastructure
   - Easily testable in isolation
2. Infrastructure and external systems:
   - databases
   - APIs
   - file systems
   - message queues
   - external services
3. Interfaces and entry points into the system:
   - HTTP handlers
   - CLI commands
   - UI components
   - background jobs
4. Modules, their structure should:
   - have a single responsibility
   - expose minimal public interfaces
   - avoid circular dependencies
Infrastructure must not contain business logic. 
Interfaces should coordinate work but avoid embedding domain logic. 
Prefer multiple small modules over large monolithic files.
### File Size Guidelines
Files should generally remain under approximately `1000` lines. If a file grows beyond this size, consider splitting it into focused modules. Large files reduce maintainability and increase cognitive load.
### Function Complexity
Functions should remain small and focused.
- Prefer functions that perform a single logical task.
- Avoid functions exceeding approximately `100` lines unless necessary.
- Large functions should be broken into smaller composable units.
### Dependency Direction
Dependencies should flow inward toward domain logic.
- Infrastructure should depend on domain logic.
- Domain logic must never depend directly on infrastructure.
### State Management
Avoid hidden state. Prefer:
- explicit inputs
- explicit outputs
- immutable data where practical
State handling must align with:
- [State Manager](./docs/workflow/state_manager.md) for persistence and lifecycle
- [Context Resolver](./docs/development/context_resolver.md) for context prioritization
Implicit state creates unpredictable behavior and difficult debugging.
### Error Handling Architecture
Error handling must be explicit and consistent. Failures must be handled through:
- [Failure Handler](./docs/security/failure_handler.md) for classification and recovery
- [Debugging Playbook](./docs/security/debugging_playbook.md) for root cause resolution
Prefer returning structured errors rather than relying on implicit failure modes. Do not swallow errors. Failures should:
- propagate clearly
- include useful diagnostic context
- remain observable during debugging
### Public Interface Stability
Public interfaces should remain stable. Avoid breaking API contracts unless explicitly requested. This includes:
- CLI commands
- HTTP endpoints
- exported modules
- public library APIs
Backward compatibility must be preserved whenever possible.
### Testing Relationship
Domain logic must be easily testable. Design systems so that business logic can be tested without:
- databases
- external services
- network access
Prefer dependency injection or interface boundaries when required.
### Complexity Control
Architecture must serve the problem, not impress the reader. Avoid introducing:
- unnecessary abstraction layers
- speculative architecture
- framework-heavy patterns
### Refactoring Expectations
Refactoring must not change behavior unless explicitly required. Refactoring is allowed when it improves:
- clarity
- maintainability
- safety
### Execution Alignment
Architecture is not only structural; it must support system execution and reliability. All architecture must support:
- [Workflow Engine](./docs/workflow/workflow_engine.md) for enforced execution order
- [Task Router](./docs/workflow/task_router.md) for correct task classification
- [Validation Agent](./docs/workflow/validation_agent.md) for correctness verification
- [Metrics] (./docs/strategy/metrics.md) for measurable quality
### Visual Design Expecations
The system includes a Design Layer responsible for enforcing visual differentiation and identity:
- [Design System](./docs/design/design_system.md)
- [Design Memory](./docs/design/design_memory.md)
- [Design Variation Engine](./docs/design/design_variation_engine.md)
## Final Principle
Good architecture is not just clean code. **It is a system that behaves: consistently, predictably and correctly under pressure**
