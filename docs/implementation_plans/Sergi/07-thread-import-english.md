# Explicit expanded-thread import and English frontend

Superseded for Gmail capture by [automatic thread context](08-automatic-thread-context.md). The English UI and JSON import remain.

## Scope and authorization

Sergi explicitly approved updating architecture.md to allow a user-triggered import
of all expanded messages in the current fictional Gmail thread, including manager
replies, preserving message IDs and validating client/recipient ownership. Update
only those scope rules; current-message automatic capture remains separate.

## Approach and dependencies

Add a bounded preview transport that reads expanded messages only after a panel
request. Show client selection and message counts before the explicit import.
Label these as manually imported fictional history and route acceptance through
core ownership/merge rules. Clear previews on message/tab changes and reject
ambiguous recipients, malformed messages and unrelated participants. No mailbox
search, profile access from content scripts, AI authorization or new permissions.
Translate frontend UI/comments and exposed errors to English without modifying
source-message text or quotations. Preserve the current panel styling.

## Verification

Test mixed incoming/outgoing expanded threads, hidden/collapsed messages, missing
recipients, client isolation and bounds. Run root Vitest/typecheck/build and fresh
Chromium smoke checks of preview/import, cache/review persistence and English UI.
Real signed-in Gmail acceptance stays manual if its DOM cannot be accessed here.

## Verification so far

82 Vitest tests, typecheck and build pass. Fresh Chromium with synthetic Gmail
and mocked HTTP inference passes mixed incoming/outgoing preview/import, collapsed
message exclusion, stale-preview and missing-recipient rejection, cache reuse,
English labels and widths 320/480px. The existing JSON/review/navigation/retry
smoke flow also passes. Actual signed-in Gmail remains a manual acceptance step.

The same fresh Chromium expanded-thread flow also passes against real local
`qwen3:1.7b`: two expanded messages including a manager reply are imported,
manager evidence is suggested with an exact excerpt, and repeated analysis makes
no new calls (two model requests total). Stale-preview and recipient-error checks
also pass. No page errors or horizontal overflow at 320/480px.
