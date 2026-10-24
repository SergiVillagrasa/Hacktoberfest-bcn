# Explicit history import, coverage and cached analysis

## Affected areas and approach

Extend contracts with a bounded client-specific history envelope including manager
identity and outgoing recipients. Validate shapes at import and ownership/merge
rules in core. Merge explicit imports without replacing captured messages or
silently rewriting source IDs. Keep imported messages labeled and suggestions
unconfirmed; analyze history only through an explicit panel action.

Add a cache port with Chrome-local persistence. Core keys successful analysis by
client, exact message/source content and analysis revision, preserves review state,
and shares pending requests. Do not cache failures or obsolete source snapshots.
Wire thin panel handlers to core actions, add a file import form, honest partial
coverage/date/source labels, cached-result status and retry controls. Preserve the
existing plain-CSS design and scripted-answer removal already in the checkout.

## Dependencies and verification

No new application dependencies. This branch carries the previous uncommitted
scripted-answer cleanup and must include that prerequisite when reviewed.
Test malformed/cross-client imports, manager replies, merge conflicts, caching,
changed sources/revisions, empty results, failure retries and review persistence.
Run root typecheck, Vitest and build, then a fresh isolated Chrome smoke test.
Document precisely which browser checks use mocked inference; live signed-in
Gmail and Ollama acceptance requires a manual rehearsal if inaccessible here.

## Verification outcome

74 Vitest tests, typecheck and build pass. Fresh Chromium passes the synthetic
Gmail/mocked-inference smoke flow and a separate real local Qwen run including a
manager commitment and cache reuse. See the [rehearsal guide](../../sergi/history-import.md)
for exact scope, results and the outstanding signed-in Chrome acceptance.
