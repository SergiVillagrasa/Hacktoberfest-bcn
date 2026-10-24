# Automatic context from the open Gmail thread

## Scope and authorization

Sergi requested automatic reading of the entire open thread and storage of context.
This supersedes the explicit-preview requirement approved earlier. Update the
architecture accordingly: expand only messages in the current fictional thread,
capture incoming and outgoing messages with original IDs, validate ownership in
core, merge local history and analyze through the existing cache. Never navigate
to another thread or search the mailbox. Unknown clients still require explicit
registration; ambiguous threads fail without exposing saved context.

## Approach and dependencies

Add a bounded captured-thread envelope, automatic current-thread expansion and
replay with navigation cancellation. Core selects one exact external participant,
validates manager recipients, stores captures without duplicate IDs and analyzes
recorded messages. Return saved context with explicit inference errors on failure.
The panel consumes the single thread use case, clears stale state on navigation,
and automatically resumes after client registration. Keep JSON import available
for history outside the open thread. Preserve evidence and manager review states.

## Verification

Use targeted Vitest coverage for thread ownership, outgoing capture, idempotent
reopening, changed messages, failure retries and collapsed-message expansion.
Run root typecheck, Vitest and build plus an isolated Chromium rehearsal covering
auto expansion/capture, registration, inference/cache, reload and client switching.
Document any actual Gmail DOM limits found during manual rehearsal.

## Verification outcome

Root `bun run typecheck`, `bun run test` (88 tests across 12 Vitest files), and
`bun run build` pass. Fresh isolated Chromium with synthetic Gmail passes automatic
collapsed-header expansion, Expand all, incoming/outgoing capture, registration,
deduplicated/cache-backed reopening, saved review state, unknown-client navigation
and offline/retry. No page errors or horizontal overflow at 320/480px.

A separate fresh Chromium run against real local Qwen also passes automatic
expansion and both message analyses, including the manager reply. Two model calls
occur on first capture and zero on reopen. Actual signed-in Gmail DOM remains a
manual acceptance step; follow docs/sergi/history-import.md after reloading Gmail.
