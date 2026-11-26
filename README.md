# DSA Companion — Learn, Solve, Remember

A study companion for people who understand DSA explanations but freeze when solving alone, and forget approaches a few days later. It walks every topic through **Understand → Visualize → Predict → Easy → Guided → Independent → Course-level → Revision**, measures what you can actually do (not what you watched), and brings problems back with spaced recall.

## Quick start
```bash
npm install
npm run dev        # web on http://localhost:5173, API on http://localhost:8787
npm test           # 98 tests (engine, content, calendar sync against a fake Google API)
npm run build && npm start   # production: serves dist/ from the API server
```
No credentials are needed. Copy `.env.example` to `.env` only to turn on the optional features below.

## What needs credentials
| Feature | Needs | Without it |
|---|---|---|
| Google Calendar two-way sync | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `TOKEN_ENCRYPTION_KEY` (see [docs/GOOGLE_CALENDAR_SETUP.md](docs/GOOGLE_CALENDAR_SETUP.md)) | Weekly plan still works; export `.ics` |
| AI tutor chat | `ANTHROPIC_API_KEY` (server only) | Scripted Socratic mentor (always on) |

Calendar sync is verified against a simulated Google API in tests, **not yet against a live Google account**. The UI says "not configured" until the server has credentials.

## Features
- **Dashboard** answers "what should I do today?" with one primary task, Minimum 10 / Normal 25 / Deep 45–60 modes, resume of your last draft, and a gentle comeback session after 3+ days away.
- **Learn**: 9 topics (loops, complexity, arrays, two pointers, recursion, binary search, strings, hashing, sliding window), each with intuition, analogy, a step-through visualization, and predict-the-output questions.
- **Playground**: CodeMirror editor, Run Code / Run Tests in a Web Worker sandbox (2s timeout, no network), 31 original problems with hidden tests, 4 progressive hints, scripted mentor, dry run, complexity notes, explicit "show solution", confidence before and after, and a mistake journal.
- **Honest outcomes**: the app suggests the highest outcome the evidence allows (hints used, solution viewed, failed runs). You can only rate yourself lower, never higher.
- **Mastery levels 0–6** come from evidence: independent solves, delayed recall, transfer problems. Watching a lesson never raises a level.
- **Spaced repetition**: recall on day 1, 3, 5, 7, 14, then adaptive. Five-step recall (pattern, approach, edge cases, code, verify) and five outcome ratings. A failed recall queues an easier bridge problem.
- **Adaptive difficulty**: two weak attempts step down to a bridge; two independent solves step up.
- **Namaste DSA**: the public module and lesson titles (with source and retrieval date), or paste your own lesson list. "Watched" and "can do it" are tracked separately. "Too hard" diagnoses missing prerequisites and offers original bridge exercises. No paid content is reproduced; all problems are original.
- **Schedule**: routine preferences (default Asia/Kolkata), editable weekly plan you approve, missed-session reschedule, `.ics` export, and optional Google Calendar sync.
- **Progress**: non-punitive analytics (Recharts), milestones, weekly reflection. Export/import/reset data in Settings.
- Dark premium UI with light mode, responsive with a mobile bottom nav. Progress persists in localStorage.

## Architecture
```
src/            React 18 + TypeScript + Vite + Tailwind, Zustand (persisted), lazy-loaded routes
  content/      topics and original problems (+ content tests: every solution passes, every starter fails)
  lib/engine/   srs, mastery, adaptive, planner, weekly, course — pure functions, unit tested
  lib/runner*   Web Worker sandbox for user code
  viz/          trace builders + player for visualizations
server/         Express API (tsx)
  google.ts     OAuth 2.0 + Calendar REST, refresh on 401, retry on 429/5xx
  sync.ts       idempotent event upsert/delete, tagged via extendedProperties.private
  crypto.ts     AES-256-GCM token encryption
  tutor.ts      optional Anthropic tutor (Socratic, never dumps full solutions unasked)
shared/         types and the public Namaste DSA syllabus snapshot
```
Secrets stay on the server. The frontend only calls `/api/*`, which reports which features are configured.

## Scripts
`dev`, `dev:web`, `dev:api`, `build`, `start`, `typecheck`, `test`, `test:watch`.
