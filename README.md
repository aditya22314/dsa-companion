# DSA Companion — Learn, Solve, Remember

A study companion for people who understand DSA explanations but freeze when solving alone, and forget approaches a few days later. It walks every topic through **Understand → Visualize → Predict → Easy → Guided → Independent → Course-level → Revision**, measures what you can actually do (not what you watched), and brings problems back with spaced recall.

## Quick start
```bash
npm install
npm run dev        # http://localhost:5173
npm test           # engine, content, daily plan, reminder and page tests
npm run build      # static site in dist/ (host anywhere, or `npm run preview`)
```
No accounts, API keys or server. Everything runs in the browser and progress is saved in localStorage (export a backup from Settings).

## The daily plan
**Daily plan** in the app (and [docs/DAILY_PLAN.md](docs/DAILY_PLAN.md)) is a 55-day path that follows the public Namaste DSA order for modules 1–6, Strings, Binary Search, and Two Pointers & Sliding Window. Each day:
1. Warm up in the app (concept, visual, or an easy bridge problem)
2. Watch the Namaste DSA lesson ("try first" days: attempt the app's matching problem before watching)
3. Solve on your own in the app
4. Close: write the key idea from memory

Every fifth day is a review day. Ticking a lesson marks it watched in the Namaste DSA tracker. Days are numbered, not dated, so missing a day never puts you behind. A downloadable `.ics` adds one repeating reminder to any calendar app.

**Printable version:** [docs/DSA-Daily-Plan.pdf](docs/DSA-Daily-Plan.pdf) (64 pages) has the whole plan with checkboxes, topic sheets, all 31 problems with hints, full solutions at the back, and a recall tracker. It works without the app.

After editing `src/content/dailyPlan.ts`, regenerate with `npm run plan:doc` (markdown) and `npm run plan:pdf` (PDF, needs Playwright's Chromium).

## Features
- **Dashboard** answers "what should I do today?" with one primary task, Minimum 10 / Normal 25 / Deep 45–60 modes, resume of your last draft, and a gentle comeback session after 3+ days away.
- **Learn**: 9 topics (loops, complexity, arrays, two pointers, recursion, binary search, strings, hashing, sliding window), each with intuition, analogy, a step-through visualization, and predict-the-output questions.
- **Playground**: CodeMirror editor, Run Code / Run Tests in a Web Worker sandbox (2s timeout, no network), 31 original problems with hidden tests, 4 progressive hints, a step-by-step scripted mentor, dry run, complexity notes, explicit "show solution", confidence before and after, and a mistake journal.
- **Honest outcomes**: the app suggests the highest outcome the evidence allows (hints used, solution viewed, failed runs). You can only rate yourself lower, never higher.
- **Mastery levels 0–6** come from evidence: independent solves, delayed recall, transfer problems. Watching a lesson never raises a level.
- **Spaced repetition**: recall on day 1, 3, 5, 7, 14, then adaptive. Five-step recall (pattern, approach, edge cases, code, verify) and five outcome ratings. A failed recall queues an easier bridge problem.
- **Adaptive difficulty**: two weak attempts step down to a bridge; two independent solves step up.
- **Namaste DSA**: the public module and lesson titles (with source and retrieval date), or paste your own lesson list. "Watched" and "can do it" are tracked separately. "Too hard" diagnoses missing prerequisites and offers original bridge exercises. No paid content is reproduced; all problems are original.
- **Progress**: non-punitive analytics (Recharts), milestones, weekly reflection. Export/import/reset data in Settings.
- Dark premium UI with light mode, responsive with a mobile bottom nav. Progress persists in localStorage.

## Architecture
```
src/            React 18 + TypeScript + Vite + Tailwind, Zustand (persisted), lazy-loaded routes
  content/      topics, original problems, and the daily plan (all tested)
  lib/engine/   srs, mastery, adaptive, planner, course: pure functions, unit tested
  lib/runner*   Web Worker sandbox for user code
  lib/reminder  recurring .ics reminder
  viz/          trace builders + player for visualizations
scripts/        plan-doc.ts generates docs/DAILY_PLAN.md
shared/         shared types and the public Namaste DSA syllabus snapshot
```
