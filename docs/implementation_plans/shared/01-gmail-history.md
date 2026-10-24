# Gmail capture and fictional-history import

Owners: Albert and Joana jointly. Suggested branch: feat/gmail-context.

## Outcome and affected areas

Deliver the currently visible fictional email to the extension and explicitly import a small fictional message history. Work touches the Gmail WXT entry point and relevant handlers in apps/extension, capture/import/messaging adapters in packages/infra, and agreed contracts. Coordinate shared-contract and composition-root changes with Sergi.

## Approach and dependencies

Depend on the shared foundation's email/message envelopes and history port. Keep the content script limited to capture and validated messaging; it must not load profiles, invoke Ollama, or decide how a client is matched. Observe Gmail navigation with MutationObserver while handling transitions and avoiding duplicate captures or stale content. Pass the email to an extension handler, which calls the agreed core use case.

Create the synthetic history at the event. Import a small client-specific dataset with stable message IDs, source labels and available dates. Include outgoing manager messages where promises are needed and a second client or unknown sender for isolation checks. Import transport/shape handling belongs in infra; attribution, duplicate policy and business acceptance belong in core. Coordinate those rules with the AI/context lane.

Label imported history in the panel data. Capture only the visible current Gmail message; do not imply mailbox-wide collection. Expose a clearly labeled sample-message fallback when extraction fails. Do not fabricate unavailable dates or treat a partial thread as complete history.

## Verification and useful PR boundaries

Check the prepared Gmail messages live, including navigation to another client, an unknown sender, and a state with no open message. Verify malformed messages/imports are rejected, repeat capture does not duplicate history, and source labels survive import. Use targeted Vitest checks around parser/transport boundaries and integration checks around client attribution; do not test copied implementation details.

An independently useful capture/message-delivery feature can be one PR; the import/fallback feature may be another. Demonstrate each through the agreed handler/use-case boundary. Hand Sergi the validated email stream and import action, with known Gmail DOM limitations recorded.
