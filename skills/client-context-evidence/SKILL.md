---
name: client-context-evidence
description: "Implement or review client matching, source evidence, history coverage, briefing, context review and message-specific communication signals for the banking sidebar."
---

# Client context and evidence

Read architecture.md and the applicable plan. For product intent and examples, consult research-bank-manager-sidebar.md at the root. The core value is reducing the manager's time to recover relevant context before a conversation or decision.

Keep rules in packages/core, independent of React, Chrome, WXT, Ollama and persistence. Shared value types belong in packages/contracts; ports belong in core. The model supplies candidate observations, while core selects the matched client and the manager confirms facts or resolves items.

For every proposed item, preserve a source message ID and exact excerpt. Check that the source belongs to the matched client and the excerpt occurs in the recorded email. Preserve uncertainty: literal occurrence verifies the quote, not the interpretation. Reject malformed/cross-client attribution, and expose a useful error or unknown state without silently confirming a model claim.

Maintain distinct suggested, confirmed and dismissed states. Review and resolution are explicit manager actions. Show current concerns and open commitments first, then relevant goals/preferences, with dates and source history available. Compute repeat counts and elapsed dates from recorded messages in code; unavailable dates and unseen replies remain unknown. An absent recorded reply is not proof of an ignored request. Attribute an outgoing manager promise differently from a client's report of that promise.

Keep communication signals attached to a message, topic and time when available. Separate explicit statements from tentative tone; allow unclear and correction. Do not persist an emotion as a permanent client trait or turn sentiment into a manager-performance, suitability, pricing or churn score. A positive interaction does not resolve a separate complaint without evidence/review.

If implementing the agreed stretch feature, show a possible preference change with old/new evidence; keep the current confirmed value until the manager approves replacement and preserve the prior history. Optional drafting uses confirmed context only.

Verify meaningful transitions and isolation with fake core ports: unknown client, another client's source, unsupported quote, review/resolution, missing history and preference replacement when implemented. Keep real financial decisions with the manager and mark missing bank records rather than inferring them from email tone.
