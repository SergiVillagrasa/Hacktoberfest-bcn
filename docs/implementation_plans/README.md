# Implementation plans

Read [architecture.md](../../architecture.md) and [AGENTS.md](../../AGENTS.md) before acting on a plan. These are concise implementation plans prepared for the event, with no Superpowers dependency. The foundation is merged to `main`. Albert and Joana work together in parallel across the two feature areas; see the root README for current commands and handoff.

## Shared preparation and work lanes

| Plan | Owner | Outcome |
|---|---|---|
| [Kickoff and contracts](shared/00-kickoff-and-contracts.md) | Sergi leads; all three agree | One working Bun/WXT workspace baseline and shared interfaces |
| [Gmail capture and history](shared/01-gmail-history.md) | Albert and Joana jointly | Validated current-message capture and labeled fictional-history import |
| [Local AI and client context](shared/02-local-ai-context.md) | Albert and Joana jointly | Core use cases, local adapters and evidence-backed context |

## Member plans

- [Sergi](Sergi/README.md): foundation, client briefing panel/integration, and demo readiness.
- [Albert](Albert/01-feature-lane.md): work with Joana across both feature areas and coordinate concrete tasks.
- [Joana](Joana/01-feature-lane.md): work with Albert across both feature areas and coordinate concrete tasks.

The team has agreed that Albert and Joana will work in parallel across both areas. Store plans only here; the old root shortcut was removed.

## Timing and handoffs

For five hours: 20 minutes to align and set up branches; 20 minutes for the shared foundation; about 2 hours 40 minutes for parallel features; 1 hour for integration/fixes; 40 minutes for rehearsal and final polish. Target the first complete imported-history + live-Gmail + reviewed-briefing flow before optional features.

Feature owners open PRs when a useful main path works. Follow the local branch-naming, pr-description and pr-sca skills. After a foundational or contract PR merges, update dependent branches from main. Keep module boundaries clear and send contract changes through Sergi's coordination.

The accepted preference-change review feature is a stretch item, covered by Sergi's final plan. Reply drafting is lower priority than the main briefing.
