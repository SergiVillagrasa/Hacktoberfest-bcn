# Project implementation checklist

Use this as the project manager's acceptance checklist. Tick an item when you
have seen it work in a review, test result, or demo. Keep the evidence in the
relevant PR or demo notes; this page tracks completion, not implementation detail.
Owner labels show who should lead or share each item. Albert and Joana work
jointly across both feature areas; they agree on the concrete split as they go.

## Audit — 24 October 2026

Source review and automated checks on `fix/remove-scripted-answers` establish the
items below. Existing checked event/demo items retain their earlier team evidence;
this audit did not repeat them in Chrome.

- [x] Remove keyword-driven extraction and automatic demo profile/history seeding.
  Unknown senders require explicit registration of an empty client record.
- [x] Remove simulation controls and substitute sample history from the panel.
- [x] Ollama connection/malformed-response failures reject instead of generating
  scripted answers; valid empty model output remains valid. (`ollama.test.ts`)
- [x] Remove persisted fallback/unattributed observations and known bundled demo
  messages when accessed; keep reviewed live-model results and captured messages.
  (`packages/infra/src/index.test.ts`)
- [x] Root `bun run typecheck`, `bun run test` and `bun run build` pass on this
  branch (45 Vitest tests). Browser acceptance is still pending.

### History import and cache implementation

- [x] Explicit bounded JSON import UI, including manager replies with client
  recipients; ownership and source-ID conflicts validated in core. Imports merge
  captured history and never seed model answers or confirmed facts.
- [x] Recorded history labels manual imports/Gmail captures, message direction,
  unknown dates and partial coverage; no mailbox synchronization is implied.
- [x] Separate history-analysis action uses live Qwen, with persistent per-client/
  message/source/revision caching and preserved review/resolution states.
- [x] Automated regression coverage includes invalid/cross-client imports,
  manager replies, persisted cache reuse, changed history, retries, empty results,
  unsupported evidence and overlapping inference. Root checks: 82 Vitest tests,
  typecheck and build pass on `feat/history-import-cache`.
- [x] Fresh-profile Chromium smoke check passes using synthetic Gmail DOM and
  mocked HTTP inference: import, review/cache persistence, navigation, invalid
  import rejection, failure/retry and no horizontal overflow at 320/480px.
- [x] Fresh-profile Chromium with real local `qwen3:1.7b` produces an imported
  manager commitment with exact evidence and suggested review state. Repeating
  analysis uses cached results (three model requests total, zero on repeat).
  Gmail markup was synthetic; the model and local extension request were real.
- [x] Capture diagnostics distinguish outgoing manager replies, missing account
  identity, unreadable markup and disconnected content scripts; retry is exposed.
  Parser/message tests and synthetic Chromium navigation cover the outgoing case.
- [x] Approved explicit expanded-thread preview/import supports incoming client
  messages and manager replies. Core validates participants/recipients; preview
  revalidation rejects changed threads. Collapsed messages are excluded.
- [x] Frontend labels, help, comments and exposed errors use English; original
  email bodies/excerpts are preserved. Synthetic Chromium checks cover the new
  English thread-import flow and existing JSON/review/cache behavior.
- [x] Fresh Chromium expanded-thread import also passes with real local Qwen:
  two expanded messages, one manager reply, exact suggested evidence, two model
  requests total and no additional request on repeated analysis. Gmail DOM remains
  synthetic; source/recipient rejection and cache behavior are exercised.
- [ ] Actual signed-in Gmail + toolbar side-panel rehearsal by Sergi; follow the
  [manual guide](history-import.md). Automated fixture checks do not close this item.

### Remaining work, in priority order

1. Complete the [signed-in Chrome rehearsal](history-import.md#manual-acceptance-in-your-signed-in-chrome)
   for real Gmail capture, import, cache reuse, review persistence, unknown sender
   navigation and unavailable-service behavior.
2. Complete the briefing: prioritize/cap current concerns and open commitments,
   separate recent message-specific signals, collapse source evidence, and support
   resolving concerns in the panel as well as commitments. Core supports both.
3. Review the completed import/client-isolation integration with another teammate.
   Registration and current-message orchestration now call core actions.
4. Rehearse startup with a teammate and measure the three context questions.
   Preference-change review and reply drafting remain deferred.

## Shared foundation and kickoff

- [x] The foundation is merged to `main`; the documented root install, checks,
  and build pass, and the side panel opens in Chrome. (Sergi)
- [x] The collaboration plan is agreed: Albert and Joana will work in parallel
  across both areas; Sergi coordinates shared contracts and integration.
  (Everyone)
- [x] The team sends [the fictional message set](gmail-test-messages.md) to a
  dedicated test inbox. It covers a client concern, manager promise, stated
  goal/preference, and an unknown sender. (Sergi)

## Gmail capture and history

- [ ] Gmail capture reads only the currently open fictional message; navigation
  clears stale context, and malformed or repeated captures are handled safely.
  (Albert + Joana)
- [ ] Opening a client message loads all that client's locally captured or
  explicitly imported history, including manager replies. Coverage and import
  labels are clear; message IDs, direction, dates, and excerpts are preserved.
  Missing history or dates stay unknown, and the inbox is not implied to be
  fully synced. (Albert + Joana)
- [ ] Exact sender matching selects the right client, and an unknown sender
  never sees another client's history. (Albert + Joana)

## Local AI and client context

- [x] Qwen3 1.7B runs locally; bounded suggestions cite messages from the
  matched client's history and include exact excerpts from those messages.
  (Albert + Joana; verified through the local adapter with exact evidence, PR #4)
- [ ] The manager can confirm or dismiss suggestions and resolve concerns or
  commitments; suggestions remain unconfirmed until reviewed, and choices persist.
  (Albert + Joana)
- [ ] Communication signals stay message-specific and uncertain; dates/counts
  come from recorded data, and missing replies remain unknown. (Albert + Joana)

## Briefing and integration

- [ ] The panel shows identity and history coverage, then concerns/commitments,
  goals/preferences, and recent signals. Observations include expandable source
  excerpts, and suggestions are distinct from confirmed context. (Sergi; with
  Albert + Joana on the core results)
- [ ] Switching messages or clients clears stale results and previous context.
  UI handlers call core use cases; client and evidence rules live in core.
  (Sergi + Albert + Joana)
- [ ] A manager can open a fictional message, inspect its history-backed brief,
  run local analysis, review a suggestion, resolve an item, and switch clients
  without losing saved state or exposing another profile. (Everyone; Sergi leads
  integration)

## Demo readiness

- [ ] Typecheck, Vitest, and build pass; each PR records actual results, Sergi
  reviews integration, and another teammate checks behavior. (Each PR author;
  Sergi reviews; a teammate checks behavior)
- [ ] The team rehearses from a fresh Chrome load, including an unknown sender
  and unavailable Gmail/Ollama. Failures show honest empty/error states without substitute answers.
  (Everyone)
- [ ] The team compares time to answer the same three questions from raw
  messages and the brief; `main` remains runnable, with gaps recorded.
  (Sergi coordinates; everyone contributes)

## Scope guard

- [ ] Client data stays fictional and local. The demo adds no Gmail OAuth,
  mailbox-wide sync, cloud backend, database, or automatic email sending; tone
  never becomes a permanent profile or drives financial decisions. (Everyone;
  Sergi checks integration scope)
