# Joana: shared feature work and handoff

Assignment: work with Albert across both Gmail/history and local AI/client-context
in parallel. Coordinate concrete tasks with Albert and shared contracts or
composition changes with Sergi; no area is reserved for one teammate.

## Outcome and affected areas

Contribute across the two independently useful feature areas, targeted checks,
and reviewable PRs. Read architecture.md, AGENTS.md and the [shared kickoff
plan](../shared/00-kickoff-and-contracts.md). Coordinate parallel tasks with
Albert and record progress in the PRs.

## Approach

For **Gmail capture/history**, follow [the Gmail/history plan](../shared/01-gmail-history.md) on feat/gmail-context: visible-message extraction, validated messaging, source-preserving history import and a labeled sample fallback. Coordinate core import/capture rules with Albert and Sergi.

For **AI/client context**, follow [the local AI/context plan](../shared/02-local-ai-context.md) on feat/local-ai-profile: framework-independent use cases and local inference/storage adapters, reviewed context, incomplete-history handling and evidence-backed briefing output. Coordinate message identity and source ownership with Albert and Sergi.

Branch from the merged shared baseline, and keep changes in the appropriate
workspace packages. Albert and Joana can contribute to both feature branches in
parallel. Agree on concrete file/task boundaries before overlapping edits; route
contract and extension composition changes through Sergi. Keep unfinished
fixtures/fallbacks labeled.

## Verification and completion

Follow each feature area's verification criteria and report actual results. Keep
useful capabilities in focused PRs and identify remaining limitations. Sergi
reviews integration and Albert checks behavior. Help verify startup and the
complete client-briefing demo as the work merges.
