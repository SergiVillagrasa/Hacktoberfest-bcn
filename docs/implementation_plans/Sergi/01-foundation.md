# Sergi: foundation and contract coordination

Branch: feat/sidepanel-shell. Status: planned for the event.

## Outcome and affected areas

Establish the root Bun workspace, shared contracts, core port/API skeleton and a working WXT/React side panel. Affected areas are root tooling, apps/extension, package entry points and framework-independent contracts. Follow the [shared kickoff plan](../shared/00-kickoff-and-contracts.md).

## Approach

Lead the team agreement on email identity, source evidence, review states, action/message shapes and handler/use-case boundaries. Scaffold only at the event. Use the architecture's monorepo, plain CSS, Vitest, root dependency management and bun.lock. Define workspace exports that let adapters implement core ports without core importing infra.

Get the toolbar-to-side-panel path working first with an honest empty state. Establish loading, unavailable and no-client state contracts for the later integrations. Share the foundation through a useful PR as early as possible so Albert and Joana can branch from the same interfaces.

## Verification and completion

Run the actual workspace typecheck, Vitest and build scripts once created. Load the extension in Chrome and verify the toolbar opens the panel. Check imports and workspace exports against architecture.md. The PR must describe how teammates start the extension, which scripts exist, and which domain/model features are still pending.
