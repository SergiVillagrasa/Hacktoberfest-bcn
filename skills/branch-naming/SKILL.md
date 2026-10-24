---
name: branch-naming
description: "Choose and manage focused feature or fix branches for hacktoberfest-bcn, including its early foundation PR and dependent feature lanes."
---

# Branch naming

Read architecture.md and AGENTS.md at the project root before branch work. Check git status and the current branch so existing work is preserved. During preparation, the absence of a repository is expected; do not initialize or create a remote as an incidental skill action.

Use `feat/<short-slug>` for a useful feature and `fix/<short-slug>` for a correction. The initial WXT/side-panel foundation is feat/sidepanel-shell. Likely later lanes are feat/gmail-context, feat/local-ai-profile and feat/client-briefing. Albert/Joana's lane ownership remains undecided until kickoff.

Start from main unless the work needs a specific unmerged feature. For a true dependency, use a stacked branch and identify its parent merge target; otherwise keep PRs independent. Work in the normal checkout, not a git worktree. Teammates use separate local clones/checkouts for concurrent work; do not switch another person's shared working tree out from under them.

Keep the branch focused on an independently useful capability. Coordinate changes to shared contracts and composition files with Sergi. Before shipping, read ../pr-sca/SKILL.md and ../pr-description/SKILL.md. After review and passing relevant checks, integrate with a merge commit so main's first-parent history shows feature boundaries. Do not squash or rebase main's published history as routine cleanup.
