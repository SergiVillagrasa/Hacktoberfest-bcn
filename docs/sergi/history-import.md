# Automatic Gmail context and history import

## Open a fictional Gmail thread

1. Run `bun run build`, reload the extension in `chrome://extensions`, and reload
   Gmail so its content script matches the current build.
2. Open the fictional conversation and open the extension side panel. Capture
   automatically expands messages in that conversation, reads incoming messages
   and manager replies, and stores the thread for its matched client.
3. If the sender is unregistered, choose **Register client with empty history**
   once. The current thread then resumes automatically and Qwen generates
   suggestions. No example profile facts or answers are seeded.
4. Review the generated observations and their source excerpts. Reopening the
   same thread reuses saved analyses and keeps one record per Gmail message ID.

You no longer need to preview/import the open thread or expand its individual
messages manually. Capture is limited to the current conversation; it never
navigates to other threads or searches the mailbox. Open the side panel to process
context; if it was closed, its startup replay reads the current thread when opened.

The content script preserves each message ID, direction, exact text and available
sender/recipient metadata, then sends a bounded thread envelope to the extension.
Core requires one unambiguous external client and validates outgoing recipients
against that client. Unknown clients get no other client's context; ambiguous
participant or recipient data produces a visible error before history is saved.
If Gmail cannot expand a message or expose its recipient, follow the error and
choose **Retry thread capture**. At most 50 messages/1 MB are captured per thread.

Recorded Gmail messages are labeled **Captured automatically from the open Gmail
thread**. A changed capture updates its existing ID; sender/recipient conflicts
are rejected. Known stored dates are retained when Gmail does not expose a reliable
date. Coverage stays partial: an open conversation is not the entire mailbox or
all of a client's communications. An absent recorded reply proves nothing about
whether one was sent. The panel interface/errors are English; source emails and
quotations retain their original language.

## Import JSON history outside the open thread

Expand **Import fictional history**, select a UTF-8 JSON file, and choose
**Import messages**. Then choose **Analyze history with Qwen3**. JSON import is
manual, limited to 1 MB and 50 messages per file. It merges messages without
creating confirmed facts or invoking inference until requested. Use the existing
[fictional test messages](gmail-test-messages.md) as source material.

The following example illustrates format only; it is never loaded automatically:

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

Replace the addresses with exact test addresses. Optional `sentAt` must be an ISO
timestamp with timezone, such as `2026-10-24T10:00:00+02:00`; omit unknown dates.
The importer always marks file messages `source: "demo-import"`. Incoming senders
must match the selected client; outgoing senders must match the declared manager
and their recipient must match the client. Duplicate IDs within a file and
conflicting existing content are rejected without partially writing the file.

## Analysis cache and errors

Successful analysis is stored locally by client/message, exact recorded source
content and an analysis revision covering model/prompt/evidence policy. Reopening
an unchanged thread reuses its results, including valid empty results. The badge
shows **Saved Qwen3 analysis** when all recorded analyses are reused. Reviews,
dismissals and resolutions persist. Changed source content/history or an analysis
revision triggers fresh inference; message history itself stays deduplicated.

Capture and storage complete before inference. If Ollama fails, the recorded
thread stays available and the panel reports **Thread saved. Analysis incomplete**.
It never generates substitute answers. After restoring Ollama choose **Retry thread
capture**; earlier successful analyses are reused. Capture/ownership errors show
no previous client's context. Switching Gmail tabs/threads invalidates pending UI
results; another window's active tab cannot publish context into this panel.

## Manual acceptance in signed-in Chrome

- [ ] Open the actual fictional Gmail thread with older messages collapsed and a
  manager reply last. Verify automatic expansion and capture of both directions.
- [ ] Register an unknown client once, then verify automatic Qwen suggestions and
  exact source excerpts, incoming/outgoing labels and unknown dates.
- [ ] Confirm a suggestion and resolve a commitment; close/reopen the panel and
  thread. Reviews persist, history count stays constant, and cached results avoid
  additional model work.
- [ ] Switch to an unknown sender and between Gmail tabs/windows: no previous
  client's history should remain. Return and verify saved review state.
- [ ] Add/change a fictional message and verify analysis refreshes while IDs remain
  unique. With Ollama unavailable, verify captured history persists and retry works.
- [ ] Try malformed/wrong-client JSON imports and an ambiguous multi-party thread;
  errors must preserve existing recorded history and client isolation.

Report the failed step and exact error. Synthetic browser tests do not complete
actual signed-in Gmail acceptance. No Gmail OAuth, cloud backend or new extension
permission is required.
