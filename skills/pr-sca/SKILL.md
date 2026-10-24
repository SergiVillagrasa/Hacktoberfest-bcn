---
name: pr-sca
description: "Review PR scope and integration readiness in hacktoberfest-bcn so each useful feature can merge while preserving package boundaries and the working demo."
---

# PR scope and merge readiness

Read architecture.md, AGENTS.md, the affected implementation plan and the actual diff. Assess the feature being delivered, not unrelated speculative risks.

Check that the PR has one coherent responsibility and its main path works. Related contract, use-case, adapter and UI edits can belong together when needed for that capability; split independent extras. Verify dependencies and merge targets for stacked work.

For changed areas, inspect the architecture boundaries: contracts import no workspace packages; core imports no app/infra/platform implementation; infra implements core ports and carries no domain decisions; extension handlers call a single use case; the Gmail content script captures and messages only. Treat any proposed architecture.md edit as requiring Sergi's explicit permission for that edit.

Review client isolation, exact source ownership, suggested/confirmed state, incomplete-history labels and static fallbacks when touched by the change. Check that any prior-client UI cannot survive a switch to another sender through a late result. Read ../client-context-evidence/SKILL.md or ../extension-local-ai/SKILL.md only for relevant changes.

Use checks proportionate to the diff: targeted Vitest tests for meaningful domain/boundary behavior, workspace type checking/build for code, and a Chrome exercise for runtime integration. For preparation docs/skills, validate links, instructions and protected-file integrity instead of inventing application test results. Do not create .qa directories or screenshot collections at this stage.

Report concrete blockers separately from optional improvements. A teammate checks behavior and Sergi reviews integration before merge. Merge only when the useful main path and relevant checks pass, using a merge commit and preserving main's working demo. This skill is a focused scope/readiness review, not a requirement to add unrelated security scanners or plugins.
