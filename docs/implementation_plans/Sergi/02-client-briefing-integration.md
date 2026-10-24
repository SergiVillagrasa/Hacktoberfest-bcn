# Sergi: client briefing and end-to-end integration

Suggested branch after the shell merges: feat/client-briefing.

## Outcome and affected areas

Deliver a concise React brief with client identity/coverage, current concerns and open commitments, goals/preferences, recent communication signals, and expandable evidence/history. Work primarily in apps/extension entry points, feature components and composition wiring.

## Approach and dependencies

Consume core result/view contracts rather than reimplement matching, ranking, evidence or review rules in components. Wire the AI/context lane's core use cases to the Gmail/history lane's validated input and infra adapters at the composition root. Each handler invokes one use case and maps its result to UI state.

Lead with at most three current-context points, label suggestions and incomplete history, and provide source excerpts for every observation. Make confirmation/dismissal and manual resolution available. Clear the previous client context during navigation so a late result cannot appear for another sender. Coordinate request identity/cancellation with the service owner.

Use actual captured or explicitly imported messages; do not seed prewritten observations. Exercise the actual services before merging the integrated feature. Add shared UI only when another feature needs it. For frontend work, suggest/use Impeccable when available; it is not a required dependency. Reply drafting is secondary.

## Verification and useful PR boundary

Verify source expansion, review/resolution persistence, loading/failure/unknown-client states and navigation between fictional clients. Check that the UI does not invent missing context or turn tentative tone into an emotional profile. Confirm the live Gmail-to-core-to-local-Ollama-to-briefing path with the recorded fictional history. Merge a useful panel feature independently, then a complete integration feature when the real path works.
