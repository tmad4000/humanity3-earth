# Humanity3 Earth Agent Guide

## Project Shape

- Static GitHub Pages site.
- Main page: `index.html`.
- Humanity Infrastructure tracker source: `data/humanity-infrastructure.json`.
- Validation script: `scripts/validate-infrastructure-data.mjs`.

## Beads

This repo uses a repo-local Beads tracker with prefix `h3`.

Before substantive work:

```bash
bd where
bd context
bd info
bd create "Task title"
bd update <id> --status in_progress
```

Reference the bead id in implementation commits and close the bead when complete:

```bash
bd close <id> --reason "Completed and validated"
bd export
```

If `bd where` resolves to `~/.beads`, stop before editing. This repository was
initialized in a linked worktree by creating a local `.beads/config.yaml` first so
bd v1.0.4 gives the current worktree priority over the global fallback.

## Local Checks

```bash
node scripts/validate-infrastructure-data.mjs
python3 -m http.server 7894
```

Open `http://127.0.0.1:7894/` for browser smoke testing.
