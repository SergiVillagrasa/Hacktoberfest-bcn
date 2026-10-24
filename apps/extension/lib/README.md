# Composition ownership

Sergi owns this directory and extension composition. Coordinate changes here and
in contracts before merging feature lanes. No application services are wired yet.

Gmail/history work adds `entrypoints/gmail.content.ts` and infra capture/import
adapters. AI/context work implements core use cases and infra Chrome-storage and
Ollama adapters. Albert and Joana choose those lanes at kickoff.

Capture messages use `email/captured` and `email/cleared` with a new `requestId`
for each selection/navigation. Validate unknown payloads with `isCaptureMessage`
and check the Chrome sender/tab origin in the handler; shape validation alone
does not establish sender trust. Clear the prior briefing on navigation and
ignore results belonging to an older request/tab. Capture cannot initiate AI.

Panel actions call the corresponding `ClientContextUseCases` method once.
Core owns client matching, source ownership, exact-excerpt checks, import
acceptance and review/resolution. Infra implements `HistoryPort`, `ProfilePort`
and `InferencePort`. Imported outgoing messages need client attribution checked
against the explicitly selected client's history; sender matching alone cannot
attribute a manager's reply. Core must revalidate the supplied profile when
implementing `analyzeEmail`; callers cannot authorize a client.
