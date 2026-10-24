---
name: pr-description
description: "Write concise project PR descriptions with behavior, reproducible verification and known demo limitations for hacktoberfest-bcn."
---

# PR description

Read architecture.md and AGENTS.md. Base the description on the actual final diff and actual checks, not just the plan. State the concrete behavior delivered and its main affected workspace areas. Keep it short enough to review during the five-hour event.

Include:

- A brief summary of what changed and why the manager/demo benefits.
- How to try the feature, including the needed fictional history or local Ollama setup when relevant.
- Verification actually performed and the result; distinguish automated checks from a Chrome/manual check.
- Known gaps, dependencies and every static-demo fallback affecting the feature.

Do not report a fake/sample response as live inference, imply mailbox-wide collection, or claim an inferred emotion is verified. If a PR is stacked, name its parent branch/PR and correct merge target. The first foundation PR can have an honest empty panel; explain which integrations remain pending.

For CLI-based multiline PR bodies, use a temporary body file rather than fragile shell interpolation. Opening/pushing the feature PR follows the task's existing authorization and architecture workflow; this skill does not authorize unrelated messages, submissions or deployments. Read ../pr-sca/SKILL.md before declaring merge readiness.
