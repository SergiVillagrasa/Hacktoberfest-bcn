# Instructions for AI assistants

## Read first

Before planning, editing, or implementing anything, read [architecture.md](architecture.md). It defines package boundaries, the stack, permitted data sources, and the development workflow. Then read the relevant member plan in [docs/implementation_plans](docs/implementation_plans/README.md) and the [team setup](setup-hacktoberfest.md).

Treat architecture.md as read-only. Never edit, replace, reformat, rename, or delete it without asking Sergi for permission for the specific proposed change and receiving approval. Ordinary project work already allowed by the architecture does not need another approval. If a task would require an architectural change, explain the conflict and seek approval before that change; continue independent authorized work when possible.

This is pre-event preparation: documentation, local skills, and directory structure only. Start application code, dependency installation for the application, and fictional dataset/inbox creation at the event. Do not create a remote repository until the team requests it.

## Project intent and constraints

- The product is a local client briefing tool for a manager with many clients. Prioritize concerns, open commitments, goals/preferences, and dated communication signals, each with evidence. Reply drafting is optional.
- Use the TypeScript/Bun workspace structure in architecture.md: apps/extension, packages/contracts, packages/core, packages/infra. Keep domain decisions in core and platform/model integration in adapters.
- Gmail capture is limited to the current fictional message and passes validated messages to the extension. It never reads saved profiles or calls Ollama. Imported history must be explicitly labeled.
- Client matching and client isolation are application rules. The AI cannot authorize clients, approve facts, resolve concerns, determine prices, or make financial decisions.
- Preserve source message IDs and exact excerpts. Distinguish suggestions, confirmed context, and unknown information. A matching quotation is not a guarantee that the interpretation is correct.
- Communication signals concern individual messages/topics. They may be unclear; do not build a permanent emotional profile or a manager-performance score from them.
- Use local Ollama qwen3:1.7b and chrome.storage.local. Do not add a cloud backend, Gmail OAuth, database, or component library to the five-hour prototype.

## Plans and local skills

Write concise plans covering affected areas, approach, dependencies, and verification. Save them only under docs/implementation_plans, with member plans in Sergi/, Albert/, and Joana/. The root shortcut named "implementation plans" resolves to that canonical location; do not create a second copy of the plans. Save any explicitly requested designs only under docs/design_plans.

Do not create a .agents file or directory. Project skills live in skills/ and must be committed with the project. They are ordinary Markdown instructions usable by any assistant: read the relevant SKILL.md directly if your tool does not discover this directory automatically. No plugin or global skill installation is required.

| Skill | Read when |
|---|---|
| [branch-naming](skills/branch-naming/SKILL.md) | Starting or changing an implementation branch |
| [pr-description](skills/pr-description/SKILL.md) | Writing or updating a PR |
| [pr-sca](skills/pr-sca/SKILL.md) | Reviewing scope and merge readiness of a PR |
| [client-context-evidence](skills/client-context-evidence/SKILL.md) | Changing extraction, briefing, review, client matching, history or communication signals |
| [extension-local-ai](skills/extension-local-ai/SKILL.md) | Changing WXT entry points, Chrome messaging/storage, history import or Ollama adapters |

Use the three branch/PR skills required by architecture.md for their respective operations. Load only the additional skills relevant to the task. These project skills do not depend on Superpowers. Do not start a Superpowers workflow by default; use it only if the user explicitly opts in after the architecture's required explanation. For frontend design/implementation, suggest Impeccable when it is available and use it where appropriate; the project must remain usable without that plugin.

## Team and integration

- Sergi owns the shared foundation, contracts coordination, side panel, critical end-to-end path, and integration.
- Albert and Joana work together in parallel across Gmail capture/history and local AI/client-context. They coordinate concrete tasks to avoid overlap; Sergi coordinates shared contracts and integration.
- Define package exports and messages together in the shared foundation PR, then work in separate branches/checkouts. Coordinate edits to contracts and composition files with Sergi.
- Use focused `feat/<short-slug>` or `fix/<short-slug>` branches in the normal checkout; no git worktrees. The foundation branch is feat/sidepanel-shell.
- Open feature PRs when independently useful and their main path works. Sergi reviews integration and another teammate checks behavior before merge. Merge with merge commits, preserving a runnable demo path on main once the foundation is available.
- Manage dependencies from the root Bun workspace; commit bun.lock. Bun is the package manager; Vitest is the selected test runner. Do not substitute bun test for Vitest.
- Run checks appropriate to the change and report the commands and actual results. For docs-only work, check references, consistency and protected-file integrity; do not claim application tests passed before code exists.
- PRs state what changed, how to try it, and known gaps. Explicitly label static fallback behavior. Do not publish, deploy, send email, or claim event offers as part of ordinary implementation.

Keep plans and skills aligned with architecture.md. If another project document contains older shorthand, use architecture.md and repair that secondary document without editing the architecture.
