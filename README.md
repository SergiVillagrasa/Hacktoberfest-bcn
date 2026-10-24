# hacktoberfest-bcn

Local client briefing assistant for bank relationship managers. A Chrome side panel restores relevant client context while the manager reads a fictional email: concerns, unresolved requests and promises, goals/preferences, and message-specific communication signals with source evidence.

## Start here

1. Read [architecture.md](architecture.md), the authoritative architecture and workflow. Changes to this file require Sergi's prior permission.
2. Read [AGENTS.md](AGENTS.md) if you are using an AI assistant.
3. Read the [team setup](setup-hacktoberfest.md) and [research findings](research-bank-manager-sidebar.md).
4. Use the [implementation plan index](docs/implementation_plans/README.md) to find your member plan and feature lane.

## Preparation status

This folder contains planning documents, portable project skills, and the agreed monorepo directories. Application code, dependency manifests, the lockfile, sample data and the GitHub repository will be created at the event. No application checks have run yet. The folder name is a working project name; the team can choose its public name at kickoff.

The two earlier documents have been copied here so this folder can become the repository root. Use these in-folder copies going forward; the older copies in Documentos are preserved as prior snapshots.

```text
architecture.md                    Protected architecture
AGENTS.md                          Assistant entry point and skill routing
setup-hacktoberfest.md             Shared product/stack/team decisions
research-bank-manager-sidebar.md   Findings, sources and sidebar priorities
apps/extension/                    Future WXT/React extension
packages/contracts/                Future framework-independent contracts
packages/core/                     Future domain rules, ports and use cases
packages/infra/                    Future storage, history and Ollama adapters
docs/implementation_plans/         Concise plans and member folders
docs/design_plans/                 Reserved for explicitly requested designs
implementation plans -> docs/implementation_plans
skills/                            Five local assistant skills
LICENSE                            MIT license for project code
```

## Team

| Member | Responsibility |
|---|---|
| Sergi | Critical path: foundation, contract coordination, React panel and integration |
| Albert | Feature lane selected with Joana at kickoff |
| Joana | Complementary feature lane selected with Albert at kickoff |

The two available lanes are Gmail capture/import and local AI/client-context services. Feature plans for both are already written and linked from each member's plan.

## At the event

Use the [kickoff plan](docs/implementation_plans/shared/00-kickoff-and-contracts.md). Create an empty GitHub repository and connect this existing folder as its local repository; avoid generating another README/license remotely. Publish the preparation files as the initial baseline, then create feat/sidepanel-shell for the application foundation. The team should use separate local clones/checkouts for concurrent branches.

Install and manage project dependencies from the root Bun workspace once the foundation manifests exist. Agree on root scripts for dev, typecheck, test and build. The test script must run Vitest. These are planned script names, not commands available in the current preparation folder.

Use a recent Chrome, Bun, a Node version compatible with the selected WXT/Vite release, Git and local Ollama. qwen3:1.7b has already been confirmed fast on Sergi's computer. Match tool versions across the team during foundation setup and commit bun.lock.

Keep the primary demonstration on Sergi's computer: labeled imported fictional history plus live extraction from the current Gmail message. Display missing history honestly and retain a clearly labeled fallback. Reserve the final integration/rehearsal period; implement the approved preference-change stretch feature only after the briefing flow works.

## Assistant skills and plugins

Project skills are plain files under skills/, indexed by AGENTS.md. An assistant can read them directly without installing a plugin. Superpowers is optional and is not required for these plans. Impeccable may help frontend work if available; no product dependency relies on it.

## License

Project code is under the [MIT License](LICENSE). Third-party packages and model weights retain their own licenses; this repository license does not replace them.
