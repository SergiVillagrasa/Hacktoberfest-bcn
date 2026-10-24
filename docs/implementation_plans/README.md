# Implementation plans

Read [architecture.md](../../architecture.md) and [AGENTS.md](../../AGENTS.md) before acting on a plan. These are concise implementation plans prepared for the event, with no Superpowers dependency. They describe intended work; none of the application features are implemented yet.

## Shared preparation and work lanes

| Plan | Owner | Outcome |
|---|---|---|
| [Kickoff and contracts](shared/00-kickoff-and-contracts.md) | Sergi leads; all three agree | One working Bun/WXT workspace baseline and shared interfaces |
| [Gmail capture and history](shared/01-gmail-history.md) | Albert or Joana; select at kickoff | Validated current-message capture and labeled fictional-history import |
| [Local AI and client context](shared/02-local-ai-context.md) | The other of Albert/Joana | Core use cases, local adapters and evidence-backed context |

## Member plans

- [Sergi](Sergi/README.md): foundation, client briefing panel/integration, and demo readiness.
- [Albert](Albert/01-feature-lane.md): select one ready-to-use lane with Joana, then implement its contract and main path.
- [Joana](Joana/01-feature-lane.md): take the complementary lane, then implement its contract and main path.

Record the Albert/Joana lane selection here and in their plans at kickoff. It is intentionally unassigned now. The requested root folder "implementation plans" is a relative directory symlink to this location; store plans only here.

## Timing and handoffs

For five hours: 20 minutes to align and set up branches; 20 minutes for the shared foundation; about 2 hours 40 minutes for parallel features; 1 hour for integration/fixes; 40 minutes for rehearsal and final polish. Target the first complete imported-history + live-Gmail + reviewed-briefing flow before optional features.

Feature owners open PRs when a useful main path works. Follow the local branch-naming, pr-description and pr-sca skills. After a foundational or contract PR merges, update dependent branches from main. Keep module boundaries clear and send contract changes through Sergi's coordination.

The accepted preference-change review feature is a stretch item, covered by Sergi's final plan. Reply drafting is lower priority than the main briefing.
