# Release verification · October 5, 2026

Initial release source commit: `c2de06c`. The subsequent video update is documented in [video-clips.md](video-clips.md).

Live site: https://two-spoons-gluten-free.github.io/the-books-lab/

GitHub Actions deployment: https://github.com/Two-Spoons-Gluten-Free/the-books-lab/actions/runs/37293599404 — succeeded.

## Verified

- `npm test`: all 10 scoring, storage, capstone, and optional sync tests pass. Content validation covers 8 modules and 61 exercises, balanced journals/flows/equation, quiz keys, evidence, and capstone totals.
- Capstone: 30 imported rows, one duplicate excluded; 29 statement movements net $6,860. Opening $5,000 plus activity equals ending $11,860. Six planted exceptions have separate account effects.
- Real Chrome integration harness passed locally and against the live GitHub Pages URL. It completed every activity and module, deliberately missed a question, recovered through shuffled review, checked the competency report and JSON download, reloaded saved progress, tested a 390px phone viewport, and completed an exercise with localStorage blocked. No uncaught browser errors.
- The report distinguishes preserved first-attempt accuracy from recovered mastery; the test learner's missed answer remained listed as recovered.
- Read-only specification and code reviews completed; findings were fixed and regression-tested.
- HTTP check of the public site returned 200.

## Limits

- Browser tests simulate sandbox checkboxes; they do not operate QBO or verify learner competency in production books. Active learning time includes the real sandbox missions and cannot be established by an automated run.
- The initial release left clips as TODO. The subsequent video update fills all eight modules with verified excerpts, published timing evidence, and immediate scored follow-up questions; no video TODOs remain.
- Optional Google Sheets delivery has no configured live endpoint. Tests validate the browser retry contract and run the receiver using an in-memory Sheet adapter. Actual Google delivery must be verified after configuring a parent-owned deployment; no-cors responses cannot prove acceptance.

Run the optional live harness with `COURSE_URL=https://two-spoons-gluten-free.github.io/the-books-lab/ node tests/browser.mjs` after installing Playwright as described in the README.

## Video update

Local Chrome completed all 69 activities and verified exactly one privacy-enhanced embed per module, the correct start/end range, and a scored question immediately after each clip. `npm test` passes all 10 tests and validates all 69 exercises. YouTube oEmbed returned public metadata and embed HTML for each of the seven source videos. All eight excerpts last under three minutes. See the clip manifest for source and timing evidence.
