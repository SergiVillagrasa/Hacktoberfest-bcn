# Joana: feature lane and handoff

Assignment: intentionally pending until kickoff with Sergi and Albert. Take the complementary lane after agreeing the split together; no feature has been assigned to either teammate in advance.

## Outcome and affected areas

Own one independently useful feature lane through implementation, targeted checks and a reviewable PR. Read architecture.md, AGENTS.md and the [shared kickoff plan](../shared/00-kickoff-and-contracts.md). Record your selected lane in this plan and the index so assistants do not implement both lanes or duplicate Albert's work.

## Approach

If taking **Gmail capture/history**, follow [the Gmail/history plan](../shared/01-gmail-history.md) on feat/gmail-context: visible-message extraction, validated messaging, source-preserving history import and a labeled sample fallback. Work with the context owner on the core import/capture rules.

If taking **AI/client context**, follow [the local AI/context plan](../shared/02-local-ai-context.md) on feat/local-ai-profile: framework-independent use cases and local inference/storage adapters, reviewed context, incomplete-history handling and evidence-backed briefing output. Work with the capture owner on message identity and source ownership.

Branch from the merged shared baseline, and keep your feature in the appropriate workspace packages. Coordinate shared contracts and composition with Sergi. Share interface progress early enough for the panel and complementary lane to integrate, while keeping unfinished fixtures/fallbacks labeled.

## Verification and completion

Follow the selected lane's verification criteria and report actual results. Keep useful capabilities in focused PRs and identify remaining limitations. Follow the three required local branch/PR skills; Sergi reviews integration and Albert checks the behavior. After merge, help verify startup and the complete client-briefing demo rather than adding another feature before integration is stable.
