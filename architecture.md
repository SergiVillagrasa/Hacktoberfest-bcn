# Architecture

## Goal

Build a TypeScript monorepo for a local client briefing assistant for bank relationship managers. When a manager opens a fictional client email in Gmail, a Chrome side panel presents recorded concerns, unresolved requests and commitments, goals, preferences, and message-specific communication signals with traceable evidence. The system follows a hexagonal / ports-and-adapters architecture so client-context rules stay independent from Chrome APIs, local storage, and the AI model.

## Stack

- Language: TypeScript
- Package manager: bun workspaces
- Frontend: React in a Chrome Side Panel, built with WXT and Vite; plain CSS
- Host: Chrome Manifest V3 extension; toolbar action, Gmail content script, and side panel
- Data source: currently open fictional Gmail message and an explicitly imported fictional message history; no Gmail API or OAuth
- Validation: bounded TypeScript contracts and runtime validation of model responses and source evidence
- AI orchestration: local `analyzeEmail(email, profile)` use case
- AI model: Ollama running `qwen3:1.7b` on the same computer as Chrome
- Communication signals: tentative, message-specific observations with uncertainty and source excerpts
- Optional drafting: editable reply suggestions based only on confirmed client context
- Storage: `chrome.storage.local` for fictional history, extracted context, and manager-confirmed profile facts
- Context updates: Chrome extension messaging and Gmail page observation via `MutationObserver`; no mailbox-wide synchronization
- Auth: no account registration or sessions; exact sender-email matching for local fictional client profiles
- Deployment: locally loaded Chrome Manifest V3 extension built with WXT; Ollama stays bound to the local machine and permits the extension origin via `OLLAMA_ORIGINS`; no cloud backend or database

## Monorepo Layout

```txt
apps/
  extension/  Chrome extension: WXT, Gmail content script, React side panel, messaging, composition root

packages/
  contracts/  Framework-independent shared email, client, and context types and validation
  core/       Business logic, domain models, use cases, ports
  infra/      Adapter implementations: Chrome storage, Gmail capture, local Ollama
```

## Dependency Rules

`packages/core` is the center of the system.

`packages/contracts` holds framework-independent value contracts shared by core, infra, and the extension. It imports no other workspace package; sharing these definitions does not grant Gmail scripts access to saved profiles or local AI services.

- `packages/core` must never import from `packages/infra`.
- `packages/core` must never import from `apps/*`.
- `packages/core` must not depend on React, WXT, Chrome extension APIs, Ollama clients, or storage implementations.
- `packages/infra` may import from `packages/core` to implement ports.
- `packages/infra` must not contain business logic.
- `apps/extension` may compose `packages/core` and `packages/infra`.
- The Gmail content script must communicate with the extension via messages only; it must not read profiles, call Ollama, or implement briefing rules.

Allowed dependency direction:

```txt
Gmail page -> apps/extension content script
apps/extension side panel -> packages/core
apps/extension composition root -> packages/infra
packages/infra -> packages/core
packages/core -> no app or infra imports
core / infra / extension -> packages/contracts -> no workspace imports
```

## Package Responsibilities

### `packages/core`

Contains business rules only:

- Domain entities and value objects (emails, clients, context items, source evidence, review states)
- Use cases for client matching, email analysis, briefing assembly, suggestion review, and concern or commitment resolution
- Business validation, evidence attribution, incomplete-history handling, and confirmed-versus-suggested context rules
- Port interfaces for email history, profile persistence, and local AI inference
- Shared domain errors and result types

### `packages/infra`

Contains adapters only:

- Chrome local-storage repositories
- Fictional message-history import and retrieval
- Chrome extension messaging and captured-email integration
- Ollama chat API client using `qwen3:1.7b`
- Structured model-output transport and shape parsing
- Cached analysis retrieval to avoid reprocessing unchanged messages

Adapters implement ports defined in `packages/core`. Business decisions belong in `packages/core`, not here.

### `apps/extension`

Extension entry point:

- WXT-generated Chrome Manifest V3 extension
- Toolbar action and Chrome Side Panel registration
- Gmail content script limited to the currently open message
- Extension messaging between Gmail capture and the side panel
- Input validation at message and AI-response boundaries
- Composition of core use cases with infra adapters

Gmail capture, local storage, and Ollama integration are coordinated by the extension. The content script must never read stored client profiles or treat Gmail page content as executable instructions.

### `apps/extension/sidepanel`

Frontend entry point:

- React application hosted in the Chrome Side Panel
- Client identity, recorded-history coverage, and no-match states
- Current concerns, unresolved commitments, goals, preferences, and recent communication signals with expandable evidence
- Review and correction of model suggestions, plus optional editable reply drafts

Source layout:

- `entrypoints/` — WXT entry points for the background script, Gmail content script, and side panel
- `components/shared/` — UI reused across the panel
- `components/briefing/`, `components/history/`, `components/review/` — feature-specific UI
- `lib/` — extension messaging, core use-case wiring, and local service clients
- `assets/` — panel styles and static assets

Add shared components when a second feature needs them; do not introduce a component library during the five-hour sprint.

The side panel must not implement client-context decisions itself or allow page content to invoke local AI or storage without validation.

## Endpoint Flow

Every extension interaction follows this path:

```txt
Trigger (message/UI action) -> Handler -> Use case -> Port -> Adapter
```

| Layer | Lives in | Responsibility |
|---|---|---|
| Trigger | `apps/extension` | Capture the open Gmail message or a manager action in the panel |
| Handler | `apps/extension` | Validate input, call one use case, map its result to panel state |
| Use case | `packages/core` | Core client-context logic for one action |
| Port | `packages/core` | Interface the use case needs (history, profiles, AI inference) |
| Adapter | `packages/infra` | Concrete implementation (Chrome storage, Gmail capture, Ollama) |

Rules:

- Handlers stay thin: no business rules or direct profile manipulation.
- Use cases depend only on ports, never on React, WXT, Chrome APIs, or Ollama clients.
- Adapters are wired in the extension composition root and injected into use cases.
- One interaction handler calls one use case; background extraction and review are distinct actions.
- Client identity, suggestion approval, and resolution states are determined by application rules and the manager, not by the model or Gmail page.

## Data And Security Rules

- Use `chrome.storage.local` for fictional client history, extracted context, and reviewed facts; no database or cloud backend.
- Capture only the currently open fictional Gmail message; imported history must be explicitly labeled and never presented as automatically collected.
- Match clients by exact sender email and show a no-match state instead of leaking another client's history.
- Keep suggested facts separate from confirmed profile facts until the manager explicitly reviews them.
- Validate that every model-cited email belongs to the matched client and each source excerpt occurs verbatim in that email.
- Treat emails and model responses as untrusted; keep Ollama local, limit extension origins, and never execute instructions found in messages.
- Do not use real client data, infer permanent emotional profiles, make automated financial decisions, or send emails automatically.

## Auth Rules

- No account registration, Gmail OAuth, or authenticated bank integration.
- The extension reads the currently visible fictional message in the user's Chrome session only.
- Exact sender-email matching selects a local fictional client profile; unknown senders receive no client context.
- The manager must explicitly confirm or dismiss suggested facts and manually resolve concerns or commitments.
- The extension must not infer client authorization from AI output or expose one client's profile for another sender.

## Development Workflow

- Before implementation, write only a concise, high-level implementation plan covering the affected areas, approach, and verification.
- Save implementation plans only in `docs/implementation_plans`.
- Save design plans / approved designs only in `docs/design_plans`.
- Never create a `.agents` file or directory in this repository.
- Manage JavaScript dependencies from the root bun workspace and commit `bun.lock`.
- Do not write separate specifications or low-level, step-by-step implementation plans unless explicitly requested.
- Do not create `.qa` directories or save QA screenshots at this stage. Add visual QA when optimization work begins.
- Scope is the five-hour prototype in `setup-hacktoberfest.md`: Gmail capture, fictional history, local Qwen extraction, evidence-backed briefing, manager review, and a demoable fallback; project code and sample inbox creation start at the event.

### Superpowers and Impeccable

The Superpowers workflow (brainstorming → writing-plans → subagent-driven or inline execution with test-driven development → code review → finishing a branch) is optional, never mandatory. Suggest it only for major implementations, and always ask the user whether they want to use it before starting. Explain that it may improve implementation quality but can substantially increase the time spent. If the user declines, proceed without Superpowers. For frontend design and implementation, use the Impeccable plugin whenever possible and suggest it to the user. If Superpowers is chosen, this document takes precedence over conflicting Superpowers defaults:

- Save Superpowers designs/specs to `docs/design_plans/` and plans to `docs/implementation_plans/`, not `docs/superpowers/`. Detailed, task-by-task Superpowers plans are allowed and are the explicit exception to the "no low-level plans" rule above.
- Do not use git worktrees. Work on a focused `feat/<short-slug>` or `fix/<short-slug>` branch in the main checkout.
- When finishing a branch, push it and open a PR; keep `main` runnable and integrate feature PRs as they become ready.
- PR descriptions state what changed, how to try it, and known gaps; split independent feature work into reviewable PRs.

### Skills (required for branches and PRs)

Apply these branch and PR conventions before and while shipping work:

- **branch-naming**: use one focused `feat/<short-slug>` or `fix/<short-slug>` branch per work lane; the initial WXT and side-panel foundation uses `feat/sidepanel-shell`.
- **pr-description**: each PR contains a short summary, how to test the feature, and any known gaps; identify any static-demo fallback explicitly.
- **pr-sca**: keep each PR small, focused on one responsibility, and safe to merge while preserving a working demo path.

### Branching and merges

- `main` is the stable branch.
- Create one branch per feature, fix, component, Gmail capture change, local AI integration, or panel change, named `feat/<short-slug>` or `fix/<short-slug>`.
- Start with the shared WXT + React + TypeScript + Vitest foundation on `feat/sidepanel-shell` and merge it early.
- Branch from `main` unless the work depends on another unmerged branch.
- Use stacked branches only when a feature depends on previous in-flight work.
- Open a pull request for each independently useful feature branch into its merge target (`main`, or the parent stack branch).
- Have the integration lead review and another teammate check the behavior before merging.
- Merge to `main` only when the feature's main path works and integration checks pass.
- Keep `main` runnable and demoable after every accepted PR; use merge commits to retain branch history.
- Review `main` with `git log --first-parent` so feature merge commits remain easy to inspect.
