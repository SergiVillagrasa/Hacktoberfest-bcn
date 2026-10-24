# Kickoff and shared contracts

Owner: Sergi leads; Albert and Joana participate. Status: foundation merged to
`main`; Albert and Joana will work together in parallel across both feature
areas. See [Sergi's foundation plan](../Sergi/01-foundation.md) and the root
README for implemented exports, commands, and verification.

## Outcome and affected areas

The shared baseline for apps/extension and packages/contracts, core and infra is merged to `main`. Albert and Joana contribute across both feature areas in parallel; Sergi coordinates shared contracts and composition. Use focused branches by capability.

## Approach and dependencies

The repository, workspace, and WXT/React/TypeScript shell are already in place. Use the root Bun workspace and lockfile, Vitest, and plain CSS. Continue feature work on focused capability branches from `main`.

The foundation defines contracts for message IDs, sender, direction, optional date and source; client identity; review states; source evidence; coverage/unknown states; and validated extension message envelopes. Contracts remain framework independent. Core port and use-case signatures support both feature areas; Chrome/Ollama implementations live in infra.

Implement panel-to-service actions for importing history, analyzing the selected email, reviewing context, and resolving an item. Each handler calls one core use case. Sergi coordinates composition-root edits; Albert and Joana agree task boundaries before overlapping file changes.

## Verification and useful PR boundary

Confirm all workspaces resolve, the extension builds and loads in Chrome, and the toolbar opens the panel. Exercise a meaningful Vitest check of a framework-independent rule and verify type checking. Confirm core has no app/infra/platform imports and contracts imports no workspace package. Merge the useful foundation PR early, then branch/update each lane from that baseline.

Do not wait for full Gmail or Ollama features to merge the shell. Record actual script names, tool versions and package exports in the setup guide after they exist.
