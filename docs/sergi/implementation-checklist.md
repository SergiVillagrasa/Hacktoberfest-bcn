# Product completion checklist

This checklist defines acceptance for the finished Client Briefing product. The
goal is a dependable, clear, locally installed Chrome extension that helps a
relationship manager review fictional client context with evidence. It is not an
event demo checklist. Product quality includes the complete user journey, safe
client isolation, honest history coverage, understandable failures, and usable
documentation.

The architecture remains authoritative for technical and data boundaries:
TypeScript/Bun workspace, Chrome Side Panel, local Ollama `qwen3:1.7b`,
`chrome.storage.local`, fictional data, no Gmail OAuth or mailbox-wide sync, and
no automatic financial decisions or email sending. “Product” here means a
finished deliverable within those boundaries, not approval for real banking use.

Sergi owns all remaining work and acceptance. Completed items below are based on
the recorded implementation and verification evidence; remaining items should
be checked only after direct acceptance. Keep fresh Chrome findings and command
results with the relevant change or release notes.

## Implemented and verified

### Product foundation and local AI

- [x] Bun workspace separates contracts, core rules, infrastructure adapters,
  and the Chrome extension UI.
- [x] Ollama `qwen3:1.7b` produces bounded suggestions with exact source excerpts;
  unavailable or invalid model responses do not produce scripted answers.
- [x] Suggestions remain distinct from manager-confirmed context. Client matching
  and evidence validation are application rules, and unknown clients receive no
  other client's history.
- [x] No seeded client profile, canned answer, or substitute sample history is
  loaded into the product.

### Gmail capture and history

- [x] Opening the current Gmail conversation automatically expands and captures
  its visible incoming messages and manager replies, preserving per-message IDs,
  direction, exact text, and available participant metadata.
- [x] Capture is bounded to the currently open thread. It does not search or
  synchronize the mailbox, and navigation clears stale context.
- [x] Core validates a single external client and manager recipients before
  saving. Unknown clients require explicit registration; ambiguous ownership
  fails without exposing another profile.
- [x] Capture is deduplicated by message ID. History is stored before inference,
  and model failures preserve the captured messages for retry.
- [x] Explicit fictional JSON history import supports incoming messages and
  manager replies, validates ownership and size limits, and merges without
  creating confirmed facts.
- [x] The UI distinguishes Gmail-captured and manually imported messages, labels
  partial/unknown history, and preserves source-language email text and excerpts.
- [x] Persistent analysis caching reuses unchanged results, including valid
  empty results, and preserves manager review/resolution state.

### Automated and synthetic-browser verification

- [x] Root `bun run typecheck`, `bun run test` (88 Vitest tests across 12 files),
  and `bun run build` pass on `feat/history-import-cache`.
- [x] Synthetic Gmail/Chromium coverage exercises automatic expansion, incoming
  and outgoing messages, registration, cache reuse, review persistence,
  navigation, invalid imports, and inference failure/retry.
- [x] A fresh Chromium run with real local Qwen analyzes both messages in a
  synthetic thread and makes no additional model calls when reopened unchanged.
- [x] The extension UI, comments, labels, help, and exposed errors use English.
  Original email content remains unchanged.

## Remaining product acceptance — Sergi

### Real Chrome and Gmail acceptance

- [ ] Complete the [signed-in Chrome acceptance](history-import.md#manual-acceptance-in-signed-in-chrome)
  against the actual fictional Gmail inbox. Verify collapsed and grouped thread
  messages, manager replies, recipient metadata, and automatic capture.
- [ ] Verify first-time client registration resumes the open thread and shows
  evidence-backed Qwen suggestions; confirm unavailable Ollama leaves history
  intact and retry succeeds.
- [ ] Verify reopening a thread does not duplicate messages or repeat unchanged
  model analysis, while a changed message triggers fresh analysis.
- [ ] Verify tab/thread changes and unknown senders never leave the previous
  client's context visible. Record Gmail parser failures and their exact UI state.

### Complete the manager workflow

- [ ] Present a concise, prioritized brief for current concerns and open
  commitments, followed by goals/preferences and recent message-specific signals.
- [ ] Make evidence easy to inspect without overwhelming the brief; show each
  item's source message, exact excerpt, date when known, and suggestion/review
  status.
- [ ] Let the manager confirm or dismiss suggestions and resolve both concerns
  and commitments. Verify each decision persists after reload and client changes.
- [ ] Make partial history and missing dates/replies explicit, and avoid implying
  that absent records prove a communication did not happen.
- [ ] Review empty, loading, no-match, capture-error, storage-error, and
  unavailable-model states so each offers a clear next step and no stale data.

### Professional finish and handoff

- [ ] Review the complete panel at supported Chrome Side Panel sizes for clear
  hierarchy, readable evidence, keyboard access, visible focus, and no clipping
  or horizontal overflow.
- [ ] Confirm all user-facing copy is clear English while source messages remain
  untouched. Remove obsolete labels and controls left by superseded workflows.
- [ ] Document installation, Ollama setup, permissions, data location, JSON
  history format, cache behavior, limitations, and recovery steps in the project
  README and user guide.
- [ ] Verify a clean local setup can install dependencies from the lockfile, build
  the extension, load it in Chrome, connect to local Ollama, and complete the
  acceptance flow without repository-specific leftovers.
- [ ] Run and record `bun run typecheck`, `bun run test`, `bun run build`, and
  `git diff --check` after the final changes. Resolve failures before calling the
  deliverable complete.
- [ ] Review the final changes for client-data leakage, fabricated or
  unattributed claims, stale-context races, accidental permissions, and
  undocumented limitations.

## Deferred scope

Reply drafting, preference-change review, mailbox-wide synchronization, Gmail
OAuth, cloud services, databases, real-client data, automatic sending, and
automated financial decisions are outside the current product boundary. Revisit
them only through a separately approved architecture change.
