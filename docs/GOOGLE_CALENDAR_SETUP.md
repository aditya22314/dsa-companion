# Google Calendar setup

Calendar sync is optional. Without it you can still plan your week, approve it, and download an `.ics` file.

> Status: the integration is tested end to end against a simulated Google API (`server/calendar.test.ts`). It has **not** been verified against a live Google account yet. Do that once with the steps below before relying on it.

## 1. Create a Google Cloud project
1. Open https://console.cloud.google.com/ and create a project (e.g. "DSA Companion").
2. **APIs & Services → Library** → enable **Google Calendar API**.

## 2. OAuth consent screen
1. **APIs & Services → OAuth consent screen** (Google Auth Platform → Branding / Audience / Data access).
2. User type **External**, publishing status **Testing**, and add your own Google account as a **test user**.
3. Under **Data access**, add the scopes the app asks for:
   - `https://www.googleapis.com/auth/calendar.app.created` (dedicated "DSA Companion" calendar, the default and recommended mode)
   - `https://www.googleapis.com/auth/calendar.calendarlist.readonly` and `https://www.googleapis.com/auth/calendar.events` (only if you choose "use an existing calendar")
   - `https://www.googleapis.com/auth/calendar.freebusy` (only if you turn on "avoid busy times")

   The app requests only the scopes for the options you pick at connect time.

## 3. OAuth client
1. **Credentials → Create credentials → OAuth client ID → Web application.**
2. Authorized redirect URI: `http://localhost:8787/api/google/callback` (or your deployed `APP_BASE_URL` API origin + `/api/google/callback`).
3. Copy the client ID and secret.

## 4. Environment
```bash
cp .env.example .env
# fill GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, TOKEN_ENCRYPTION_KEY
npm run dev
```
Restart the server after editing `.env`. **Schedule → Google Calendar** now shows **Connect**.

## How the app treats your calendar
- Tokens are stored only on the server, encrypted with AES-256-GCM (`server/data/store.json`, file mode 0600). The browser never sees them.
- Access tokens refresh automatically. **Disconnect** revokes the grant at Google and deletes stored tokens.
- Each event the app creates is tagged with a private extended property (`dsaCompanion=1` plus a session key). The app only updates or deletes events it created; it never touches other events.
- Re-syncing updates the same event instead of creating duplicates. Rescheduling a missed session moves its existing event.
- Each event includes the objective, prep notes, a link back into the app, and a reminder.

## Verifying it live (checklist)
1. Connect, choose the dedicated calendar, approve a week, press **Sync to Google**. A "DSA Companion" calendar appears with your sessions.
2. Press sync again: nothing duplicates.
3. Edit one session's time in the app and sync: the same event moves.
4. Confirm other calendars and events are unchanged.
5. Disconnect: the app's access is gone from https://myaccount.google.com/permissions.
