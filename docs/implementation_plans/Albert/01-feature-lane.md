# Albert: feature lane and handoff

Assignment: intentionally pending until kickoff with Sergi and Joana. This is an executable choice between two prepared high-level plans, not a permanent assignment.

## Outcome and affected areas

Own one independently useful feature lane through implementation, targeted checks and a reviewable PR. Read architecture.md, AGENTS.md and the [shared kickoff plan](../shared/00-kickoff-and-contracts.md). Agree with Joana which lane each of you owns and record the choice in this plan and the index.

## Approach

If taking **Gmail capture/history**, follow [the Gmail/history plan](../shared/01-gmail-history.md) on feat/gmail-context: current-message capture, validated extension messaging, labeled import and fallback. Keep matching/review decisions in core and coordinate import use cases with the other lane.

If taking **AI/client context**, follow [the local AI/context plan](../shared/02-local-ai-context.md) on feat/local-ai-profile: core ports/use cases, local adapters, evidence validation, review and briefing results. Keep platform code out of core and coordinate actual message/history input with the other lane.

Build against the shared foundation after it merges. Coordinate contract changes and composition-root edits with Sergi. Provide the other lane with a small stable interface and clearly labeled temporary data, then demonstrate a real handoff before the integration period.

## Verification and completion

Use the chosen lane's verification criteria, run the actual relevant commands and record known gaps. Open PRs when a capture, import, core-context or adapter feature is independently useful. Follow the required local branch/PR skills, ask Sergi to review integration and have Joana check the behavior. Help rehearse the complete demo after your feature merges.
