# Project implementation checklist

Use this as the project manager's acceptance checklist. Tick an item when you
have seen it work in a review, test result, or demo. Keep the evidence in the
relevant PR or demo notes; this page tracks completion, not implementation detail.
Owner labels show who should lead or share each item. Albert and Joana work
jointly across both feature areas; they agree on the concrete split as they go.

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
  and unavailable Gmail/Ollama. Static samples and fallbacks are labeled clearly.
  (Everyone)
- [ ] The team compares time to answer the same three questions from raw
  messages and the brief; `main` remains runnable, with gaps recorded.
  (Sergi coordinates; everyone contributes)

## Scope guard

- [ ] Client data stays fictional and local. The demo adds no Gmail OAuth,
  mailbox-wide sync, cloud backend, database, or automatic email sending; tone
  never becomes a permanent profile or drives financial decisions. (Everyone;
  Sergi checks integration scope)
