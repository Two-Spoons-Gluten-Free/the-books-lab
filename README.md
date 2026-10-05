# The Books Lab

An interactive course in US small-business bookkeeping and QuickBooks Online, built for a working bookkeeping assistant. Eight modules follow the fictional **Cedar Grove Landscaping** through account types, double entry, customer payments, bank feeds, vendors, reconciliation, exceptions, and a full month-end simulation.

**[Open the course](https://two-spoons-gluten-free.github.io/the-books-lab/)**

The site uses plain HTML/CSS/JavaScript ES modules: no build step, backend, API keys, paid service, or runtime dependencies. About four hours of active learning includes the guided QBO sandbox work; clicking through the website alone will take less time.

## Run locally

```sh
python3 -m http.server 8000
```

Open http://localhost:8000. Serve the folder over HTTP; double-clicking `index.html` cannot load its JSON data. To validate content and scoring, install Node 22+ and run:

```sh
npm test
```

No `npm install` is needed. `tests/content.mjs` checks every quiz key, journal/flow entry, accounting-equation transaction, feed match, and capstone total. `tests/engine.test.mjs` checks grading, first-attempt accuracy, retries, storage fallback, and reconciliation. `tests/sync.test.mjs` checks network retry and runs the Apps Script receiver against an in-memory Sheet adapter; it does not establish live Google delivery.

For the optional full browser harness, run the local server, install a development-only browser tool, then run:

```sh
npm install --no-save --package-lock=false playwright
npx playwright install chromium
node tests/browser.mjs
```

The harness solves all 69 activities, exercises wrong-answer review, reload, JSON download, mobile width, and blocked storage. It checks sandbox checkboxes as a simulation and does not operate QBO. `COURSE_URL` can point it at the deployed site; `CHROME_PATH` can select an installed Chrome executable. Playwright is not shipped to learners or needed by the course.

## What the learner does

Each module includes a hook, short lessons, a live diagram, practical exercises, a QBO mission, and a scored check. The course explicitly demonstrates why recording an already-invoiced ACH as new income duplicates accrual revenue and leaves Accounts Receivable open. It also teaches legitimate Add cases when neither an invoice nor another sales record exists, plus sales receipts for immediate sales that need customer/item tracking.

Exercises include multiple choice, multi-select, drag-and-drop with keyboard menus, journal builders with live T-accounts, customer/vendor balance flows, bank-feed matching and Receive Payment, and reconciliation with planted errors. The capstone has 30 feed imports (one is a duplicate), six planted exceptions, invoices and bills, and a reconciled statement.

Correct work earns XP once per activity; repeating an already-mastered activity cannot farm XP or extend a streak. Module completion requires all activities correct and all sandbox steps checked. Badges name actual competencies. All modules remain available so the learner can choose her pace.

## Progress and reports

Progress is saved only in this browser's `localStorage`. Every storage access is guarded; if saving is blocked or corrupt data is found, the course runs in memory and displays a notice. Export a report before closing an unsaved session. There is no account or cross-device progress import.

The report distinguishes **first-attempt accuracy** from **latest-attempt mastery**, lists missed work even after recovery, shows module completion and capstone outcomes, and exports JSON. Use **Print / save PDF** to create a PDF through the browser's print dialog. Retry missed work shuffles activities whose latest attempt is incorrect.

Competency thresholds: Not Yet below 60% or no evidence, Developing 60–84%, Proficient 85%+. Ratings use attempted activities and are learning evidence, not professional certification. Capstone bank-line exposure is the sum of the absolute amounts of incorrect lines, not a net income adjustment. Each exception explains its distinct account effect.

Only a first name is needed. All financial data is fictional. Reports contain learner-entered exercise answers; share them deliberately.

## Edit content without changing app logic

All course lessons, answer keys, scenarios, missions, sources, and optional clips are in [`content/course.json`](content/course.json). GitHub's file editor can edit this JSON directly. Keep straight quotation marks, commas between entries, and unique exercise IDs. Run `npm test` after an edit; the deployment workflow also validates before publishing.

- **Fix a quiz:** find its `id`, edit `options[].text` and `options[].explanation`, and set `correct` to the option ID. For multi-select, use `multi: true` and include every correct ID.
- **Change a lesson:** edit `learn[].title` and `learn[].text`. Keep each text block under about 150 words.
- **Add a scenario:** copy an exercise of the same `type` into a module's `practice`, assign a new ID, and update prompt, evidence, explanation, and key. Set `skill` to one of the seven top-level skills. Supported types are `choice`, `sort`, `journal`, `feed`, and `reconcile`.
- **Edit a journal:** update `accounts` and `expected` rows with `account`, `debit`, and `credit`; all entries must balance. Zero amounts are explicit.
- **Edit a feed:** each line specifies `action`, a `matchId` for Match or `category` for Add, and evidence in `context`. Missing CRM receipts set `requiresPayment: true` and `invoiceId`; the learner must record Receive Payment before matching.
- **Edit reconciliation:** signed deposits are positive and payments negative. Each line has `amount` (book value), `correctAmount`, `cleared`, and statement `evidence`. Beginning balance plus all cleared corrected amounts must equal `ending`.
- **Edit a mission:** change numbered `steps` and its `checkpoint`. Check expected changes rather than absolute sandbox balances.

`js/engine.js` owns grading, `js/store.js` persistence, `js/components.js` exercise rendering, `js/app.js` navigation and reporting, and `js/sync.js` optional network delivery. Styling is in `styles/app.css`.

### Optional verified video clips

All eight modules now have a verified short excerpt: two from Accounting Stuff and six from Intuit QuickBooks. The eight excerpts use seven videos, with separate reconciliation excerpts for Modules 6 and 8. Each lasts 49–152 seconds. See [the clip manifest](docs/video-clips.md) for exact ranges and primary verification sources. Each clip has a watch prompt and one scored question immediately afterward. The interactive lessons also stand on their own.

To add a clip, verify the video and the specific start/end interval with an official Intuit/QuickBooks channel, Accounting Stuff, or Hector Garcia CPA. Replace the module's `video` with:

```json
{
  "id": "REAL_11CHAR_ID",
  "title": "Verified video title",
  "start": 0,
  "end": 150,
  "watchFor": "What happens to Accounts Receivable when payment is received?",
  "verifiedUrl": "Paste the actual source URL here",
  "verified": "YYYY-MM-DD",
  "channel": "Intuit QuickBooks",
  "timingEvidence": {
    "url": "Paste the official transcript or creator chapter URL",
    "kind": "official timestamped transcript",
    "boundaries": [0, 150]
  }
}
```

The ID shown is a schema illustration, not a real video. Use at most one clip per module, ideally three minutes or less, never more than five. Both excerpt endpoints must be real published markers listed in `timingEvidence.boundaries`; the example values above are schema illustrations and must be replaced with verified timings. Pair the clip with a single scored question in `check` and mark that question `"videoQuestion": true`. That question is displayed immediately after the clip, while the remaining checks stay at the end of the module. The renderer uses `youtube-nocookie.com`. If no suitable clip can be verified, use `{"todo":"TODO: find clip for <topic>"}` and remove the video question.

### QBO sandbox co-pilot

Use an existing QBO sandbox or the linked Intuit sample company; the sample resets between sessions and may present a CAPTCHA. Menus differ by QBO edition and change over time. Missions use + New (or + Create), search, and Settings → Chart of Accounts. The course also explains For Review / Pending and Add / Post labels.

A parent or an AI browser assistant, such as Claude in Chrome, can work alongside the learner. Suggested prompts:

> “Stay in the sample company. Ask me to predict the account effect before each click. Help me create an invoice, receive its payment to Undeposited Funds, and select that payment in Bank Deposit. Do not do the work for me.”

> “This ACH has no CRM payment. Help me verify the customer, amount and open invoice, then guide Receive Payment and matching. Ask why Add would duplicate income.”

> “Compare my reconciliation to the statement. Give a hint about the difference, then let me locate the error. Do not force an adjustment just to reach zero.”

## Deploy / redeploy

The repository uses GitHub Pages with GitHub Actions. In repository **Settings → Pages**, select **GitHub Actions** as the source. Push to `main`; `.github/workflows/pages.yml` validates content and scoring, assembles only static assets, and deploys with `actions/deploy-pages`. Check the Actions run before opening the live URL. Every future content edit pushed to `main` automatically redeploys.

## Optional Google Sheets results sync

Leave `config.js` empty to keep everything local. Learning and reporting work identically without Sheets.

1. Create a Google Sheet. Open **Extensions → Apps Script**.
2. Paste [`apps-script/Code.gs`](apps-script/Code.gs), replacing `SHARED_TOKEN` with a chosen shared string.
3. **Deploy → New deployment → Web app**. Execute as **Me**, access **Anyone**. Authorize it and copy the `/exec` URL.
4. Put that URL in `config.js` as `sheetEndpoint` and the same string as `sharedToken`. Push the change.
5. Visit the endpoint URL: it should return `{"ok":true}`. Complete an exercise and verify a row in **Attempts**. Complete a module and verify **Summary**. Test this against your actual Sheet after configuration.

The script creates both tabs and deduplicates retries using event IDs. Attempt rows include timestamp, first name, module, exercise ID, correctness, score, seconds spent, and skill. Summary rows include module completion, accuracy, mastery, and time spent. Time is elapsed time since opening an exercise, including retries and time away; it is not a precise active-learning timer.

Posts use `fetch` with no custom headers, a JSON string body sent as `text/plain`, and `mode: 'no-cors'` so Apps Script does not receive an unsupported OPTIONS preflight. The UI never waits. Failed network sends are queued in guarded localStorage and retried on reload or when the browser comes online. No-cors responses are opaque: the browser cannot confirm that the script accepted a request, so check the Sheet when testing. An invalid URL/token can silently prevent rows; this is best-effort delivery, not guaranteed reporting. If storage is unavailable, the queue lasts only this session.

The endpoint and token are visible in a public site. **The token only filters junk; it is not real security.** Send a first name and fictional exercise results only. Never send real company or financial data. Optional Dashboard formulas can use an Attempts pivot table: rows = Skill, values = average Score, filters = Learner and Timestamp.

## Verification limits

Content and scoring tests cannot prove that a learner spent four hours, performed the sandbox steps, or can independently keep production books. Sandbox checkboxes are self-reported. Video topic and timing verification is recorded in the clip manifest; availability can change. Live Google Sheets delivery requires a parent-owned endpoint and is tested only after one is configured.
