# hacktoberfest-bcn

Local client briefing assistant for bank relationship managers. A Chrome side panel restores relevant client context while the manager reads a fictional email: concerns, unresolved requests and promises, goals/preferences, and message-specific communication signals with source evidence.

## Start here

1. Read [architecture.md](architecture.md), the authoritative architecture and workflow. Changes to this file require Sergi's prior permission.
2. Read [AGENTS.md](AGENTS.md) if you are using an AI assistant.
3. Read the [team setup](setup-hacktoberfest.md) and [research findings](research-bank-manager-sidebar.md).
4. Use the [implementation plan index](docs/implementation_plans/README.md) to find your member plan and feature lane.

## Foundation status

The first application foundation provides Bun workspaces, shared contracts, core
ports, Vitest and a WXT/React side panel. The toolbar opens an honest empty state.
Gmail capture, history import, storage, Ollama and the briefing/review services are
pending. No demo inbox or static analysis fallback is included.

```text
architecture.md                    Protected architecture
AGENTS.md                          Assistant entry point and skill routing
setup-hacktoberfest.md             Shared product/stack/team decisions
research-bank-manager-sidebar.md   Findings, sources and sidebar priorities
apps/extension/                    WXT/React extension and composition ownership
packages/contracts/                Shared value types and capture validation
packages/core/                     Exact client matching, ports and service interfaces
packages/infra/                    Adapter export placeholder
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
toolbar icon. The panel should show **No message connected** and explain that
capture and analysis are pending. This path does not require Gmail or Ollama.

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
and `ClientContextUseCases` integration signatures; the service implementations
are pending. Infra exports no adapters yet.

Sergi coordinates contract edits and owns extension composition under
[`apps/extension/lib/`](apps/extension/lib/README.md). That handoff describes
message names, request identity, navigation clearing and handler boundaries.
Shape validation does not replace sender-origin or client/evidence validation.
Keep the permissions minimal: the shell requests only `sidePanel`; feature PRs
add Gmail, Chrome storage or loopback access when implemented.

Keep the primary demonstration on Sergi's computer: labeled imported fictional history plus live extraction from the current Gmail message. Display missing history honestly and retain a clearly labeled fallback. Reserve the final integration/rehearsal period; implement the approved preference-change stretch feature only after the briefing flow works.

## Assistant skills and plugins

Project skills are plain files under skills/, indexed by AGENTS.md. An assistant can read them directly without installing a plugin. Superpowers is optional and is not required for these plans. Impeccable may help frontend work if available; no product dependency relies on it.

## License

Project code is under the [MIT License](LICENSE). Third-party packages and model weights retain their own licenses; this repository license does not replace them.
