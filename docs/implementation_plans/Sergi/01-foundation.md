# Sergi: foundation and contract coordination

Branch: feat/sidepanel-shell. Status: implemented; PR and teammate review pending.

## Outcome and affected areas

Establish the root Bun workspace, shared contracts, core port/API skeleton and a working WXT/React side panel. Affected areas are root tooling, apps/extension, package entry points and framework-independent contracts. Follow the [shared kickoff plan](../shared/00-kickoff-and-contracts.md).

## Approach

Lead the team agreement on email identity, source evidence, review states, action/message shapes and handler/use-case boundaries. Scaffold only at the event. Use the architecture's monorepo, plain CSS, Vitest, root dependency management and bun.lock. Define workspace exports that let adapters implement core ports without core importing infra.

Get the toolbar-to-side-panel path working first with an honest empty state. Establish loading, unavailable and no-client state contracts for the later integrations. Share the foundation through a useful PR as early as possible so Albert and Joana can branch from the same interfaces.

First PR scope: root dev/typecheck/test/build scripts and lockfile; shared email,
evidence, review, coverage and capture-message contracts with boundary validation;
core port/use-case interfaces; package exports; and an empty side panel opened by
the toolbar. Add focused validation and client-matching checks. Leave Gmail
capture, history import, storage, inference and briefing/review implementations
for the feature lanes. Albert/Joana ownership remains unassigned. Sergi owns
`apps/extension/lib/` composition and coordinates subsequent contract edits.

## Verification and completion

Run the actual workspace typecheck, Vitest and build scripts once created. Load the extension in Chrome and verify the toolbar opens the panel. Check imports and workspace exports against architecture.md. The PR must describe how teammates start the extension, which scripts exist, and which domain/model features are still pending.

Verified: frozen-lockfile install, `bun run typecheck`, `bun run test` (15 tests)
and `bun run build` pass. An unpacked-extension check in Playwright Chromium
confirmed the panel renders without page errors or horizontal overflow at 320
and 480 pixels, and `openPanelOnActionClick` is enabled. Branded Chrome blocked
the automated extension-page check. A teammate still needs to perform the real
Chrome toolbar click before merge. `architecture.md` remains unchanged.
