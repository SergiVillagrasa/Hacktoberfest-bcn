# Briefing visual guidance and motion

## Outcome and affected areas

Refresh the existing Impeccable product/design records and enhance the incumbent
Chrome side panel with semantic visuals and minimal motion. Preserve the existing
Google Workspace-inspired identity and all capture, evidence, review, and history
behavior. Design records describe the shipped interface within the architecture.

## Approach and motion

Use consistent line icons to distinguish context types and message direction.
Strengthen review labels and source quotations so managers can scan before opening
evidence. Use short disclosure/control transitions and one brief status fade.
No entrance choreography, animated counts, or new dependencies. Reduced motion
preserves immediate state feedback without animation.

## Verification

Run typecheck, existing Vitest coverage, and build. Inspect the finished extension
at narrow and wide panel sizes in one browser pass, including keyboard disclosure,
review persistence, long copy, empty/error states, and reduced motion. Run the
Impeccable detector once and record actual results and limitations.

## Verification outcome

Root typecheck, all 88 existing Vitest tests, and production build pass. An
isolated Chromium extension check with synthetic Gmail and mocked inference
passes at 280/320/400/480px without overflow or page errors. It verifies five
context icons, keyboard evidence disclosure and focus, confirm/resolve persistence,
cached reopening, message direction, reduced motion, and capture-error isolation.
Visual inspection at 320/480px confirms the existing hierarchy is preserved.
Actual signed-in Gmail acceptance remains with Sergi.

Amber and confirmed-green labels were darkened after contrast measurement. The
final semantic label pairs exceed 4.5:1 (amber 4.80:1; green 5.24:1); neutral
evidence labels and informational notices also exceed 4.5:1.

The Impeccable detector reported documentation advisories for existing color,
type, and radius values; the design record and sidecar now include those values.
