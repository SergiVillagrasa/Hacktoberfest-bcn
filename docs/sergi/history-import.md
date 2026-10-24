# History import and Chrome rehearsal

The panel interface and exposed errors are in English. Original email text and
source excerpts retain their original language. No inbox, answers or profile facts
are seeded automatically.

## Import the expanded Gmail thread

1. Run `bun run build`, reload the extension in `chrome://extensions`, and reload
   Gmail so its content script matches the new build.
2. Open the fictional thread and expand each message you want to import, including
   manager replies. Collapsed messages and other conversations are not read.
3. Open the side panel and choose **Preview expanded thread**. This works even
   when the last expanded message is an outgoing manager reply.
4. Review the count and participants. Enter the exact **Client email for this
   fictional thread**, then choose **Import expanded messages**.
5. Choose **Analyze history with Qwen3** to generate evidence-backed suggestions.
   Importing alone creates no model results or confirmed facts.

The preview identifies the manager from the signed-in Gmail account. Every outgoing
reply needs exactly one recipient matching the selected client. If the recipient
is missing or ambiguous, open its recipient details in Gmail and preview again.
Unrelated participants are rejected by core. A valid explicit import can register
an empty client record if needed; the model never authorizes that selection.

The import is labeled **Manually imported (fictional)**. IDs, direction, sender,
recipient and exact message text are retained; Gmail display dates stay unknown
rather than guessing from localized labels. The preview is checked again before
saving and is rejected if its messages or active tab changed. Repeated identical
IDs merge with recorded history; different content under the same ID is rejected.

## Import a JSON history instead

For messages not available as expanded Gmail messages, expand **Import fictional
history**, select a UTF-8 JSON file and choose **Import messages**. The maximum is
1 MB and 50 messages per import. Then choose **Analyze history with Qwen3**.
Use the existing [fictional test messages](gmail-test-messages.md) as source
material. This format example is never loaded automatically:

```json
{
  "version": 1,
  "clientEmail": "client@example.test",
  "managerEmail": "manager@example.test",
  "messages": [
    {
      "id": "history-client-1",
      "senderEmail": "client@example.test",
      "subject": "Copy the fictional subject here",
      "body": "Copy the exact fictional client message here.",
      "direction": "incoming"
    },
    {
      "id": "history-manager-1",
      "senderEmail": "manager@example.test",
      "recipientEmail": "client@example.test",
      "subject": "Copy the fictional reply subject here",
      "body": "Copy the exact fictional manager reply here.",
      "direction": "outgoing"
    }
  ]
}
```

Replace the addresses with the exact test addresses. Include messages only, never
confirmed facts or answers. `sentAt` is optional; use an ISO timestamp with timezone
when known, such as `2026-10-24T10:00:00+02:00`. Omit unknown dates. The importer
always sets `source: "demo-import"`. Incoming senders must match the selected
client; outgoing senders must match the declared manager and their recipient must
match the client. Duplicate IDs within a file and conflicting existing IDs are
rejected without partially writing the file. Identical captured messages retain
their Gmail capture label when merged with imports.

## Cache behavior

Successful analysis is stored locally by client/message, exact recorded source
content and an analysis revision covering model/prompt/evidence policy. Reopening
an unchanged message or repeating history analysis reuses its result, including a
valid empty result, without another Ollama call. The current-message badge reads
**Saved Qwen3 analysis** for cache hits. Review and resolution states persist.
Changed history/content or an analysis-revision change triggers fresh inference.
Failures and unsupported evidence are not cached as successful results. A failed
history run preserves completed messages; retry reuses those successful analyses.

## Manual acceptance in your signed-in Chrome

Automated browser checks use synthetic Gmail markup in an isolated profile. This
rehearsal checks the actual Gmail DOM and toolbar side panel.

- [ ] Follow the thread-import steps with both the incoming client message and
  outgoing manager reply expanded; verify their preview count and participants.
- [ ] Verify imported/Gmail-capture labels, incoming/outgoing direction, partial
  coverage, unknown dates and exact source excerpts. No facts should be seeded.
- [ ] Analyze history, confirm a generated suggestion and resolve a commitment.
  Close/reopen the panel; review states persist and repeated analysis uses cache.
- [ ] Open an unknown sender: no previous client's context should remain. Return
  to the original client and verify saved review state.
- [ ] Try a JSON file for another client or malformed JSON. Try changing the
  expanded thread after preview. Errors must preserve recorded history.
- [ ] With Ollama unavailable, analyze an uncached/changed message. Cached
  messages intentionally work offline. Verify an error without substitute answers,
  then restore Ollama and choose **Reopen current message** or analyze history again.

If automatic single-message capture reports **Manager reply open**, use thread
preview/import to include the reply, or collapse it to analyze only an incoming
message. **Retry message capture** rechecks the current message. Other diagnostic
states explain missing account identity, unreadable markup or a disconnected tab.

Report the failed step and exact visible error. Do not mark signed-in Gmail
acceptance complete based only on unit or synthetic browser checks.

## Verification scope

Root Vitest, typecheck and build are run for the current branch; the project
[checklist](implementation-checklist.md) records the latest result. Fresh Chromium
smoke checks cover capture, explicit registration, imports, history analysis,
review/cache persistence across reload, invalid files, navigation and failures.
A separate real local `qwen3:1.7b` check extracted a manager commitment with exact
source evidence and reused cached analyses. Gmail markup was synthetic in both.

Sergi explicitly approved the architecture change allowing expanded-thread import.
The change does not add mailbox search, Gmail OAuth, application dependencies or
extension permissions. Actual signed-in Gmail acceptance remains manual.
