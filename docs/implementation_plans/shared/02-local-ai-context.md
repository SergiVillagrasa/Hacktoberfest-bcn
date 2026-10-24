# Local AI and client-context services

Owner: the other of Albert/Joana after the Gmail/history owner is chosen. Suggested branch: feat/local-ai-profile.

## Outcome and affected areas

Deliver testable client-context use cases in packages/core and concrete Chrome-storage/Ollama adapters in packages/infra. Use shared contracts from packages/contracts. Coordinate entry-point composition with Sergi and history import/capture with the other lane.

## Approach and dependencies

Use ports for history, profile/context persistence and local inference. Implement exact-email matching and client isolation in core. The analyzeEmail use case obtains the matched client's allowed sources, invokes the injected AI port, validates attribution/evidence, and records suggestions separately from confirmed context. Unknown senders do not receive another client's context.

Keep a bounded extraction response: at most five concerns, commitments, goals, preferences or communication signals in total, each linked to a source email and verbatim excerpt. The Ollama adapter handles local HTTP transport, structured response parsing and failures; core decides whether an item is attributable and usable. Constrain output to qwen3:1.7b's demonstrated ability and simplify optional categories if reliability is poor.

Expose separate use cases for suggestion confirmation/dismissal, concern/commitment resolution and briefing assembly. Rank the small brief using explicit application rules, prioritizing current unresolved issues and relevant recorded context. Compute dates/counts in code only from available sources. Communication signals remain tentative and message-specific. Missing replies/dates are unknown, not evidence of neglect.

Persist via Chrome storage adapters, analyze unchanged messages once, and keep cache entries isolated by client, message and analysis revision. Coordinate cache policy in core through a port; infrastructure performs lookup/storage. Imported data and static fallback results stay labeled.

## Verification and useful PR boundaries

Use fake ports to verify client isolation, rejection of a source from another client, invalid JSON/shape handling, literal-excerpt validation, review-state transitions, resolution and incomplete-history behavior. Check that a real local Ollama call produces usable context on the fictional sample. Exercise adapter failures without marking fallback output live or inferred facts confirmed.

Core context/review rules can form one useful PR, and working local adapters plus analysis can form another. Hand Sergi a stable core API and injected adapters; keep rules out of React, handlers and storage/model code. Reply drafting is optional after the briefing path works.
