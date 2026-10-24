# Albert: shared feature work and handoff

Assignment: work with Joana across both Gmail/history and local AI/client-context
in parallel. Coordinate concrete tasks with Joana and shared contracts or
composition changes with Sergi; no area is reserved for one teammate.

## Outcome and affected areas

Contribute across the two independently useful feature areas, targeted checks,
and reviewable PRs. Read architecture.md, AGENTS.md and the [shared kickoff
plan](../shared/00-kickoff-and-contracts.md). Before work begins, agree with
Joana on the tasks you will tackle in parallel and record progress in the PRs.

## Approach

For **Gmail capture/history**, follow [the Gmail/history plan](../shared/01-gmail-history.md) on feat/gmail-context: current-message capture, validated extension messaging, labeled import and fallback. Keep matching/review decisions in core; coordinate shared changes with Joana and Sergi.

For **AI/client context**, follow [the local AI/context plan](../shared/02-local-ai-context.md) on feat/local-ai-profile: core ports/use cases, local adapters, evidence validation, review and briefing results. Keep platform code out of core; coordinate shared changes with Joana and Sergi.

Build against the merged shared foundation. Albert and Joana can contribute to
both feature branches in parallel. Agree on concrete file/task boundaries before
overlapping edits; route contracts and extension composition through Sergi.

## Verification and completion

Use each feature area's verification criteria, run the actual relevant commands,
and record known gaps. Open focused PRs when capabilities are independently
useful. Sergi reviews integration and Joana checks behavior; help rehearse the
complete demo as features merge.
