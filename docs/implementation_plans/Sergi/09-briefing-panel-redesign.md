# Sergi: briefing panel redesign

## Outcome and affected areas

Redesign the Chrome side panel as a concise conversation brief for relationship managers. Work in `apps/extension/entrypoints/sidepanel/App.tsx` and `apps/extension/assets/panel.css`; retain source evidence, client isolation, uncertainty, and existing review/import/capture actions.

## Approach and dependencies

Lead with the matched client and history coverage, then the most urgent open concerns and commitments, followed by goals, preferences, and message-specific signals. Reduce visible copy and put source excerpts, review controls, and recorded history behind focused disclosures. Use a restrained Google Workspace-inspired visual language in plain CSS, tuned for the narrow Chrome panel and readable states.

Consume the current briefing and capture state without changing core rules, contracts, storage, or Gmail behavior.

## Verification

Check all existing states and actions remain represented, review the narrow panel layout and keyboard focus, run the project's typecheck/build, and inspect the final UI once for overflow and hierarchy. Do not add test coverage as part of this visual change.
