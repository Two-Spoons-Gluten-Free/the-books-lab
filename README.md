# The Books Lab

A planned interactive, four-hour course in US small-business bookkeeping and QuickBooks Online for a working bookkeeping assistant.

## Status

Repository setup only. The course application and GitHub Pages deployment have not been implemented yet. The complete requirements are in [course-builder-prompt.md](course-builder-prompt.md).

## Build outline

Use plain HTML, CSS, and JavaScript ES modules with no build step. Keep editable lessons, scenarios, answer keys, and sandbox missions in `content/` data files.

Planned structure:

```text
index.html
config.js
styles/
js/                  # Application, interactions, scoring, progress, reports, sync
content/             # Eight modules and the capstone answer key
tests/               # Dependency-free Node content validation
apps-script/Code.gs  # Optional Google Sheets results receiver
.github/workflows/   # GitHub Pages deployment
```

The eight modules are The Money Map, Double Entry Without Tears, The Customer Cash Cycle, Bank Feeds, The Vendor Side, Reconciliation, The Exceptions Lab, and Month-End Capstone.

Reusable interactions include multiple-choice and multi-select questions, accessible sorting, journal entry builders, live T-accounts, account-balance flow diagrams, bank feed matching, reconciliation, sandbox checklists, and optional verified video clips.

Progress will use localStorage with an in-memory fallback. Reports will support printing, JSON export, competency ratings, and review of missed questions. Optional Sheets syncing will never block learning.

Before release, validate accounting answer keys, complete all eight modules in a browser, test storage failure and optional sync, and verify the deployed GitHub Pages URL.
