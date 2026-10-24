# Remove scripted answers and audit readiness

## Affected areas and approach

Remove offline extraction, seeded profile facts/history, keyword-based client
registration and simulated panel messages. Keep explicit registration with an
empty profile; only live Ollama results create suggestions. Remove legacy
non-model observations and bundled sample history when reading local storage,
while retaining captured messages and model results. Failures show an unavailable
state rather than substitute answers. Update secondary guidance and the acceptance
checklist from source inspection and actual checks; leave browser acceptance open.

## Dependencies and verification

Use existing contracts/core ports and local adapters without new dependencies.
Run regression tests for model failures and legacy storage cleanup, root typecheck,
Vitest and build. Inspect remaining sample/fallback references and confirm
architecture.md is unchanged. Fresh Chrome/Ollama rehearsal remains manual.
