# hacktoberfest-bcn

Local client briefing assistant for bank relationship managers. A Chrome side panel restores relevant client context while the manager reads a fictional email: concerns, unresolved requests and promises, goals/preferences, and message-specific communication signals with source evidence.

## Start here

1. Read [architecture.md](architecture.md), the authoritative architecture and workflow. Changes to this file require Sergi's prior permission.
2. Read [AGENTS.md](AGENTS.md) if you are using an AI assistant.
3. Read the [team setup](setup-hacktoberfest.md) and [research findings](research-bank-manager-sidebar.md).
4. Use the [implementation plan index](docs/implementation_plans/README.md) to find your member plan and feature lane.

## Implementation status

The workspace includes Gmail current-message capture, Chrome local storage,
local Ollama extraction, evidence checks, and a briefing panel with review actions.
Unknown senders require explicit registration, which creates an empty client
record. No profiles, history or answers are seeded from message keywords.
Ollama failures show an unavailable state; no scripted answers are substituted.
See the [acceptance checklist](docs/sergi/implementation-checklist.md) for remaining
integration and demo checks. Explicit JSON history import, an expanded Gmail-thread preview/import action including manager replies, and persistent analysis caching are available in the English-language panel. See the [import and rehearsal guide](docs/sergi/history-import.md).

```text
architecture.md                    Protected architecture
AGENTS.md                          Assistant entry point and skill routing
setup-hacktoberfest.md             Shared product/stack/team decisions
research-bank-manager-sidebar.md   Findings, sources and sidebar priorities
apps/extension/                    WXT/React extension and composition ownership
packages/contracts/                Shared value types and capture validation
packages/core/                     Exact client matching, ports and service interfaces
packages/infra/                    Chrome storage and local Ollama adapters
docs/implementation_plans/         Concise plans and member folders
docs/design_plans/                 Reserved for explicitly requested designs
skills/                            Five local assistant skills
LICENSE                            MIT license for project code
```

## Team

| Member | Responsibility |
|---|---|
| Sergi | Critical path: foundation, contract coordination, React panel and integration |
| Albert | Parallel work across Gmail/history and local AI/context with Joana |
| Joana | Parallel work across Gmail/history and local AI/context with Albert |

The two available lanes are Gmail capture/import and local AI/client-context services. Feature plans for both are already written and linked from each member's plan.

## Run locally

Run all commands from the repository root. Verified toolchain: Bun 1.4.3 and
Node 22.22.2 (Vite 7 requires Node 20.19+ or 22.12+). Use a recent Chrome;
the manifest requires Chrome 116+. Dependencies resolve through `bun.lock`.

```sh
bun install --frozen-lockfile
bun run typecheck
bun run test
bun run build
```

In `chrome://extensions`, enable Developer mode, choose **Load unpacked**, and
select `apps/extension/.output/chrome-mv3`. Pin **Client briefing** and click its
toolbar icon. The panel initially waits for a Gmail message. Open a fictional incoming message
and explicitly register its sender if unknown. Registration creates no facts or
history. Start local Ollama with `qwen3:1.7b` and configure the extension origin as
explained in [setup](setup-hacktoberfest.md); the model generates suggestions that
the manager can confirm or dismiss. Unavailable Ollama produces an error.

On first access after updating, storage removes observations without explicit
`ollama-live` provenance (including previously reviewed scripted facts) and known
bundled sample messages. Captured messages and live model results are retained, except results citing the removed bundled sample messages.
Test fixtures remain in test-only files and are not loaded by the extension.

`bun run dev` starts WXT with hot reload and its browser runner. For the simplest
manual Chrome check, use the production-build loading steps above. Never use
real client data.

`bun run prepare` regenerates WXT types; installation and typecheck also run it.
`bun run test` runs Vitest, with separate domain and WXT extension projects.
Vite 7 and React plugin 5 are aligned through root overrides so WXT and Vitest
use compatible plugin types. Keep extension tests outside `entrypoints/` so WXT
does not treat tests as extension entry points.

## Teammate handoff

The foundation is merged to `main`. Update local checkouts from `main`. Albert
and Joana work in parallel across both `feat/gmail-context` and
`feat/local-ai-profile`, coordinating task boundaries and shared-contract edits
with Sergi.

Workspace exports are `@briefing/contracts`, `@briefing/core` and
`@briefing/infra`. Contracts provides email/source, evidence, review, coverage,
panel-state and capture-envelope types plus `isEmailContext`/`isCaptureMessage`.
Core exports exact `matchClient`, `HistoryPort`, `ProfilePort`, `InferencePort`
and `ClientContextUseCases`, plus the implemented `ClientContextService`.
Infra exports Chrome local-storage ports and the local Ollama inference adapter.

Sergi coordinates contract edits and owns extension composition under
[`apps/extension/lib/`](apps/extension/lib/README.md). That handoff describes
message names, request identity, navigation clearing and handler boundaries.
Shape validation does not replace sender-origin or client/evidence validation.
Keep permissions limited to the side panel, storage, Gmail capture and loopback inference.

Keep the primary demonstration on Sergi's computer: labeled imported fictional history plus live extraction from the current Gmail message. Display missing history honestly. If Gmail or Ollama is unavailable, show an empty/error state; scripted answer fallbacks have been removed. Reserve the final integration/rehearsal period; implement the approved preference-change stretch feature only after the briefing flow works.

## Assistant skills and plugins

Project skills are plain files under skills/, indexed by AGENTS.md. An assistant can read them directly without installing a plugin. Superpowers is optional and is not required for these plans. Impeccable may help frontend work if available; no product dependency relies on it.

## License

Project code is under the [MIT License](LICENSE). Third-party packages and model weights retain their own licenses; this repository license does not replace them.
