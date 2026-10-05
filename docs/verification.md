# Release verification · October 5, 2026

Course source commit: `c2de06c`.

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
- Every optional video is explicitly marked TODO in the content data. No unverified videos or timestamps are embedded.
- Optional Google Sheets delivery has no configured live endpoint. Tests validate the browser retry contract and run the receiver using an in-memory Sheet adapter. Actual Google delivery must be verified after configuring a parent-owned deployment; no-cors responses cannot prove acceptance.

Run the optional live harness with `COURSE_URL=https://two-spoons-gluten-free.github.io/the-books-lab/ node tests/browser.mjs` after installing Playwright as described in the README.
