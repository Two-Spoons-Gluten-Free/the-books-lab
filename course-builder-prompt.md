# Prompt: Build "The Books Lab" — an interactive 4-hour bookkeeping course

## Your role and deliverable

You are building a self-paced, interactive web course that teaches a 17-year-old bookkeeping assistant the basics of accounting, QuickBooks Online (QBO), and handling exceptions. Deliver it as:

- A **GitHub repository** with the full source code, and a README that covers setup, how to edit content, and how to deploy.
- A **static site hosted on GitHub Pages**. It must have no backend, no API keys and no paid services. Deploy it with a GitHub Actions workflow (`actions/deploy-pages`), or from the `main` branch if there is no build step.
- Use **plain HTML/CSS/JavaScript (ES modules) with no build step**, unless you have a strong reason to choose otherwise. A non-developer parent should be able to edit the content.
- Keep **all course content in data files** (`/content/*.json` or `.js`), separate from the app code. That way a parent can fix a quiz answer, swap a video, or add a scenario without touching any logic.

Before you write code, show me a short plan: file structure, module outline, and the list of interaction components. Then build it, test it, and push it.

## The learner

- She is 17 and already works as a bookkeeping assistant at a small business. She is self-taught and **will not sit through long reading**. Keep any block of text to about 150 words before something interactive happens.
- Her current work covers receiving customer payments, matching deposits, paying bills through bill pay, matching bank feed transactions, and some reconciliation.
- Her theory background is thin. She has heard of double-entry accounting, assets, and liabilities, and that is about it.
- She uses QuickBooks **Online**. She has access to **QBO sandbox companies**, so practicing with real clicks is safe.
- **The real problem to fix:** an ACH payment shows up in the bank feed, but the CRM sent no matching payment. She then adds the deposit straight to checking as income. She should instead check for an open invoice and follow the correct flow: Invoice → Accounts Receivable → Receive Payment → Undeposited Funds (or straight to bank) → Deposit → match in the bank feed. Posting it directly causes two problems: **income gets counted twice, and AR stays open.** The course must make her understand *why* this is wrong, not just memorize a rule. It must also teach her when posting directly *is* correct, which is when no invoice exists.

## Tone and gamification

- **Professional, not childish.** Think of a modern professional-training app, not a kids' game. No cartoon mascots, no confetti for every click, and no "Great job, superstar!"
- Show **XP, a per-module accuracy %, and a streak of correct answers.** Award **skill badges named after real job competencies**, for example "Clean Deposits," "Feed Matcher," "Reconciler," and "Exception Handler."
- **Scenario framing:** she is the bookkeeper for a fictional small business. Use something like a landscaping company that has recurring customers, a few vendors, ACH and check payments, and a CRM that sometimes fails to sync. Use the same company everywhere so the story builds from module to module.
- When she gets something wrong, **explain why** and let her retry. Mistakes are where she learns.

## Structure: 8 modules, about 30 minutes each (4 hours total)

Every module follows this rhythm:

1. **Hook** (2 min): a real problem from the fictional company, such as "The bank shows $1,200 but QBO says $2,400 of revenue. What happened?"
2. **Learn** (5–8 min): a short explanation plus **one interactive diagram**, and optionally **one curated video clip**.
3. **Practice** (10–15 min): 2–3 interactive exercises.
4. **Sandbox mission** (5–10 min, where it applies): guided steps in her QBO sandbox.
5. **Check** (3 min): a short scored quiz that feeds her competency profile.

### Module outline (you may refine this, but keep the scope)

1. **The Money Map.** The accounting equation (Assets = Liabilities + Equity), plus income and expenses. *Interactive:* drag accounts into the five account types. A live "balance scale" diagram stays balanced as transactions are applied.
2. **Double Entry Without Tears.** Debits and credits as "where money comes from and where it goes," with T-accounts. *Interactive:* a journal entry builder that checks whether debits equal credits and gives feedback on which accounts were chosen.
3. **The Customer Cash Cycle.** Invoice → AR → Receive Payment → Undeposited Funds → Bank Deposit → Bank Feed match. *Interactive:* an animated flow diagram where she steps a $500 invoice through each stage and watches every account balance change. Show the **wrong path** too (deposit posted straight to income) and how it double-counts income while leaving AR open.
4. **Bank Feeds: Match, Add, Transfer, Exclude.** *Interactive:* a decision-tree tool, then a mock bank feed of 10–15 transactions where she chooses an action for each. Include the core scenario: **an ACH with no CRM payment.** She must find the open invoice, then receive the payment, then match it. Also include genuine cases where "Add" is correct.
5. **The Vendor Side.** Bills → AP → Bill Pay → bank feed match. Covers why you match a bill payment instead of adding a new expense, and what happens if you do both. *Interactive:* a mirror version of Module 3's flow diagram, applied to vendors.
6. **Reconciliation.** What reconciling proves, how to read the reconcile screen, and how to hunt down a difference. Techniques: the difference divisible by 9 (transposed digits), a difference equal to one transaction, a difference equal to twice a transaction (sign flipped), and changes to previously reconciled items. *Interactive:* a simulated reconciliation that won't balance. She has to find the planted error.
7. **The Exceptions Lab.** A rapid series of short cases, each with diagnosis → fix → "what this would have broken." Cases:
   - Payments stuck in Undeposited Funds
   - A deposit that bypassed Undeposited Funds and caused duplicate income
   - Unmatched bank feed transactions
   - A payment applied to the wrong invoice
   - Overpayments and customer credits
   - Duplicate entries
   - A reconciliation that won't balance
   - Customer refunds
   - NSF / bounced checks
   - **Void vs. delete**, and when to use each
8. **Month-End Capstone.** A full simulated month for the fictional company: about 30 bank feed lines, open invoices, open bills, a CRM sync gap, and 5–6 planted exceptions. She works through all of it and then reconciles. Score her on accuracy, exceptions caught, and the dollar effect of anything missed. This is the main **demonstration of competency.**

## Required interaction components (reusable, data-driven)

Build these once and drive them from content data:

- Multiple choice and multi-select, with an explanation for each answer
- Drag-and-drop sort (accounts into categories, transactions into actions)
- Journal entry builder (pick accounts, enter debit/credit amounts, check that it balances, then check correctness)
- T-account visualizer that updates live
- Step-through flow diagram (Modules 3 and 5) showing account balances at each step
- Mock bank feed table (Match / Add / Transfer / Exclude, with a "find match" picker)
- Mock reconciliation screen (check off cleared items, show a live difference)
- Sandbox mission checklist (see below)
- Embedded video clip (see below)

All diagrams must be responsive (inline SVG or HTML/CSS). They must work on a laptop and be usable on a phone.

## Video clips: real, verified, and short

- Use well-known, reputable sources only, for example: the official **QuickBooks / Intuit** YouTube channel, **Intuit QuickBooks support** articles, the **Accounting Stuff** channel, and **Hector Garcia CPA**.
- **Use web search to confirm that every video exists and to check what it covers before you include it. Never invent a URL or a timestamp.** If you can't verify a clip, leave it out and put a `TODO: find clip for <topic>` entry in the content file instead.
- Embed **slices**, not full videos: use `youtube-nocookie.com/embed/ID?start=X&end=Y`. Aim for **3 minutes or less per clip**, with a maximum of 5.
- Use at most one clip per module. Pair each clip with a "watch for this" prompt beforehand and a single question afterward.

## QBO sandbox missions

The site cannot control QuickBooks, so missions are **guided side-by-side exercises**:

- Use a "Open your sandbox in another tab" button, then numbered steps with checkboxes.
- Write steps that rely on stable navigation: the **+ New** button, the search bar, and **Settings ⚙ → Chart of Accounts**. QBO menus move around, so add a note like "if your screen looks different, search for X."
- Each mission ends with a **checkpoint question** she answers from what she sees. Example: "Create a $500 invoice, then receive payment to Undeposited Funds. What is the Undeposited Funds balance now, compared with before?" The answer is checked against the expected change, not an absolute balance, because sandbox data varies from company to company.
- Missions for Modules 3–7 at minimum. Module 4's mission must reproduce the "ACH with no CRM payment" case done correctly.
- Also include a short optional "Co-pilot" note in the README. It should explain that a parent or an AI browser assistant (such as Claude in Chrome) can walk through the sandbox alongside her, and give suggested prompts for doing that.

## Progress, scoring, and proof of competency

- Save progress in `localStorage`. Wrap every read and write in try/catch, and make sure the app still works if storage is unavailable.
- Build a **competency profile** with these skills: Account Types, Double Entry, Customer Cash Cycle, Bank Feed Decisions, Vendor Cycle, Reconciliation, and Exception Handling. Rate each one Not Yet / Developing / Proficient, based on her scores in the related exercises.
- Add a **Report page** that shows module completion, the score for each skill, the capstone result, and the questions she missed. It should be printable (print CSS) and exportable as a JSON or PDF-friendly page, so she can send it to her parent.
- Add a **"Retry missed questions"** mode that shuffles the questions she got wrong into a review session.

### Optional results sync to a Google Sheet (via Apps Script)

The parent wants to see her results without asking for them. Add optional syncing to a Google Sheet:

- Put a ready-to-paste **`/apps-script/Code.gs`** in the repo. It should expose a `doPost(e)` web app that appends one row per event (timestamp, learner name, module, exercise ID, correct/incorrect, score, time spent) to an `Attempts` tab. It should also add a row to a `Summary` tab each time a module or the capstone is completed. Include a `doGet` that returns `{ok:true}` so the connection can be tested.
- **CORS:** Apps Script web apps don't answer preflight (OPTIONS) requests. Send with `fetch(url, {method:'POST', body: JSON.stringify(data)})` and **no custom headers** (it defaults to `text/plain`), so the browser never sends a preflight. Don't rely on reading the response.
- Store the endpoint URL and a **shared token** in a single `config.js`. The script rejects any post where the token doesn't match. Note in the README that this only filters out junk and is **not real security**, because the URL and token are visible in a public static site. Send no sensitive data: first name only, no real company or financial data.
- The app must work exactly the same **without** this configured. `localStorage` stays the main store. Queue failed posts and retry them later. Never block the UI waiting on the sheet.
- The README should have a short step-by-step setup guide: create the Sheet → Extensions → Apps Script → paste Code.gs → Deploy as web app (Execute as: me; Access: Anyone) → copy the URL into `config.js` → push.
- Optional: add a `Dashboard` tab in the sheet that uses formulas to show her accuracy per skill over time.

## Accounting accuracy

- All content must reflect **US small-business practice in QuickBooks Online**, using accrual-basis framing (and mentioning cash basis where it matters).
- Use QBO's real terminology: Undeposited Funds (labeled "Payments to deposit" in newer QBO), Receive Payment, Bank Deposit, For Review / Categorized / Excluded, Reconcile.
- Every exercise answer and explanation must be internally consistent. Write a **small test script** (Node, no dependencies) that loads every content file and confirms that each journal entry balances, each quiz has exactly one valid correct-answer key (or a valid set for multi-select), and the capstone answer key adds up.

## Done means

- [ ] The repo is pushed, Pages deployment succeeds, and the live URL works.
- [ ] All 8 modules can be completed from start to finish. Total active time is about 4 hours.
- [ ] Every video link has been verified, or else marked TODO.
- [ ] The content test script passes.
- [ ] The report page shows a realistic competency profile after a test run.
- [ ] The README explains how to edit content, add a scenario, and redeploy.
- [ ] With the Sheet configured, finishing an exercise adds a row to the Sheet. With it left out, the app works with no errors.
