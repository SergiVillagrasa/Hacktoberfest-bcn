# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Bank relationship managers who prepare for client conversations from Gmail.
They need to recover open concerns and promises quickly while keeping the
supporting communication available for inspection.

## Product Purpose

Bring relevant recorded client context into view before a conversation: current concerns, open commitments, goals, preferences, and dated communication signals with source evidence.

Deliver a dependable professional product with a complete manager workflow,
clear recovery from failures, and usable installation and operating guidance.
The product acceptance record is `docs/sergi/implementation-checklist.md`;
Sergi owns the remaining work.

## Positioning

A local briefing assistant that uses fictional Gmail threads, explicitly imported fictional history, and local Qwen analysis to assemble an evidence-backed brief. The manager reviews suggestions and makes relationship decisions.

## Operating Context

The manager opens a fictional client thread in Gmail and uses a Chrome side panel to recover context. The panel must make the next conversation easier to prepare and keep deeper history available on demand.

The open thread expands and is captured automatically, including manager replies.
An unknown client requires explicit registration before analysis. Captured history
is stored before inference; reopening unchanged messages reuses saved analysis
and manager reviews. The side panel must be open to process the current thread.

## Capabilities and Constraints

- TypeScript/Bun workspace; React and plain CSS in a Chrome Side Panel.
- Local Ollama `qwen3:1.7b` and `chrome.storage.local`; no cloud backend, database, or Gmail OAuth.
- Capture is limited to the currently open thread. Imported history must be labeled; mailbox-wide synchronization is out of scope.
- Client matching and isolation are application rules. The manager reviews suggested facts and manually resolves concerns or commitments.
- Preserve source message IDs and exact excerpts. A matching quote does not prove an interpretation.
- Communication signals belong to individual messages/topics and may be unclear; do not create permanent emotional profiles or manager scores.
- No automated email sending, pricing, or financial decisions.

## Evidence on Hand

The implemented extension, core services, and local adapters are the source of
capability truth. Relevant context is in `architecture.md`,
`research-bank-manager-sidebar.md`, and `docs/sergi/history-import.md`.
Automated checks and synthetic Chromium verification are recorded in
`docs/sergi/implementation-checklist.md`; actual signed-in Gmail acceptance is
still pending. Do not invent product metrics, client facts, or readiness claims.

## Product Principles

- Put concerns and open commitments before background context.
- Show evidence and distinguish suggestions from manager-confirmed facts.
- Keep missing history and uncertain interpretations explicit.
- Keep the brief short; make detailed evidence and history available when needed.
- Leave client and financial decisions with the manager.
