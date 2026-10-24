# Project implementation checklist

Use this as the project manager's acceptance checklist. Tick an item when you
have seen it work in a review, test result, or demo. Keep the evidence in the
relevant PR or demo notes; this page tracks completion, not implementation detail.

## Shared foundation and kickoff

- [ ] A fresh checkout installs from the root lockfile, passes the documented
  checks, builds, and opens the side panel in Chrome.
- [ ] Albert and Joana choose the Gmail/history and local AI/context lanes
  between them; the choice and shared-contract agreement are recorded.
- [ ] The team prepares fictional messages that cover a client concern, an
  outgoing manager promise, a stated goal or preference, and an unknown sender.

## Gmail capture and history

- [ ] Gmail capture reads only the currently open fictional message; navigation
  clears stale context, and malformed or repeated captures are handled safely.
- [ ] Imported history is clearly labeled and preserves message IDs, direction,
  available dates, and source excerpts; missing history or dates stay unknown.
- [ ] Exact sender matching selects the right client, and an unknown sender
  never sees another client's history.

## Local AI and client context

- [ ] Qwen3 1.7B runs locally; bounded suggestions cite messages from the
  matched client's history and include exact excerpts from those messages.
- [ ] The manager can confirm or dismiss suggestions and resolve concerns or
  commitments; suggestions remain unconfirmed until reviewed, and choices persist.
- [ ] Communication signals stay message-specific and uncertain; dates/counts
  come from recorded data, and missing replies remain unknown.

## Briefing and integration

- [ ] The panel shows identity and history coverage, then concerns/commitments,
  goals/preferences, and recent signals. Observations include expandable source
  excerpts, and suggestions are distinct from confirmed context.
- [ ] Switching messages or clients clears stale results and previous context.
  UI handlers call core use cases; client and evidence rules live in core.
- [ ] A manager can open a fictional message, inspect its history-backed brief,
  run local analysis, review a suggestion, resolve an item, and switch clients
  without losing saved state or exposing another profile.

## Demo readiness

- [ ] Typecheck, Vitest, and build pass; each PR records actual results, Sergi
  reviews integration, and another teammate checks behavior.
- [ ] The team rehearses from a fresh Chrome load, including an unknown sender
  and unavailable Gmail/Ollama. Static samples and fallbacks are labeled clearly.
- [ ] The team compares time to answer the same three questions from raw
  messages and the brief; `main` remains runnable, with gaps recorded.

## Scope guard

- [ ] Client data stays fictional and local. The demo adds no Gmail OAuth,
  mailbox-wide sync, cloud backend, database, or automatic email sending; tone
  never becomes a permanent profile or drives financial decisions.
