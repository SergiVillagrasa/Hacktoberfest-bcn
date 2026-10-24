# Kickoff and shared contracts

Owner: Sergi leads; Albert and Joana participate. Status: foundation implemented on
`feat/sidepanel-shell`, pending PR review. Lane selection remains open. See
[Sergi's foundation plan](../Sergi/01-foundation.md) and the root README for the
implemented exports, commands and verification; the remaining sections retain
the kickoff approach.

## Outcome and affected areas

Create the shared baseline for apps/extension and packages/contracts, core and infra in a root Bun workspace. Read architecture.md first; no changes to it are authorized. Assign the Gmail/history lane and AI/context lane between Albert and Joana. Use feat/sidepanel-shell for the foundation.

## Approach and dependencies

Create the empty remote repository at the event, retain this preparation folder as its root, and establish the docs baseline before feature work. Scaffold WXT/React/TypeScript in apps/extension without moving workspace packages inside the app. Configure plain CSS, shared package exports and Vitest. Manage dependencies at the root and commit bun.lock. Agree on usable root dev, typecheck, test and build scripts.

Align the contracts before splitting: message IDs, sender, direction, optional date and source; client identity; suggested versus confirmed context; source evidence; incomplete-history/unknown states; and validated extension message envelopes. Contracts remain framework independent. Define the core ports and use-case signatures needed by the two lanes, leaving Chrome/Ollama implementations in infra.

Agree on panel-to-service actions for importing history, analyzing the selected email, reviewing context and resolving an item. Each handler calls one core use case. Decide the composition-root file ownership with Sergi to avoid parallel edits. Establish the simplest working side panel and UI states so features can integrate incrementally.

## Verification and useful PR boundary

Confirm all workspaces resolve, the extension builds and loads in Chrome, and the toolbar opens the panel. Exercise a meaningful Vitest check of a framework-independent rule and verify type checking. Confirm core has no app/infra/platform imports and contracts imports no workspace package. Merge the useful foundation PR early, then branch/update each lane from that baseline.

Do not wait for full Gmail or Ollama features to merge the shell. Record actual script names, tool versions and package exports in the setup guide after they exist.
