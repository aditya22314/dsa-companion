import express, { type Request, type Response } from 'express';
import cookieParser from 'cookie-parser';
import { randomBytes } from 'node:crypto';
import { existsSync } from 'node:fs';
import path from 'node:path';
import type { CalendarEventInput } from '../shared/types';
import { aiConfigured, googleConfigured, type ServerConfig } from './config';
import { encrypt } from './crypto';
import { GoogleCalendar, GoogleError, scopesFor, SCOPES, type FetchLike } from './google';
import { JsonStore } from './store';
import { syncEvents } from './sync';
import { tutorReply, type TutorRequest } from './tutor';

export interface AppDeps {
  config: ServerConfig;
  store?: JsonStore;
  fetchImpl?: FetchLike;
  tutor?: typeof tutorReply;
  retryDelayMs?: number;
}

export function createApp({ config, store = new JsonStore(config.dataFile), fetchImpl, tutor = tutorReply, retryDelayMs }: AppDeps) {
  const app = express();
  app.use(express.json({ limit: '200kb' }));
  app.use(cookieParser());
  const google = new GoogleCalendar(config, store, fetchImpl, retryDelayMs);

  const handle = (fn: (req: Request, res: Response) => Promise<unknown>) => async (req: Request, res: Response) => {
    try {
      await fn(req, res);
    } catch (e) {
      const status = e instanceof GoogleError ? e.status : 500;
      if (e instanceof GoogleError && e.status === 401 && /revoked|reconnect/i.test(e.message)) {
        store.update((d) => {
          delete d.google;
        });
      }
      res.status(status >= 400 && status < 600 ? status : 500).json({ error: e instanceof Error ? e.message : 'Unexpected error' });
    }
  };

  const requireGoogle = (res: Response) => {
    if (!googleConfigured(config)) {
      res.status(503).json({ error: 'Google Calendar is not configured on the server. See docs/GOOGLE_CALENDAR_SETUP.md.' });
      return false;
    }
    if (!store.get().google) {
      res.status(401).json({ error: 'Google Calendar is not connected.' });
      return false;
    }
    return true;
  };

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, googleConfigured: googleConfigured(config), aiConfigured: aiConfigured(config), aiModel: aiConfigured(config) ? config.ai.model : null });
  });

  // ── Google OAuth ──────────────────────────────────────────────
  app.get('/api/google/status', (_req, res) => {
    const g = store.get().google;
    res.json({
      configured: googleConfigured(config),
      connected: !!g,
      calendarId: g?.calendarId ?? null,
      calendarSummary: g?.calendarSummary ?? null,
      scopes: g?.scopes ?? [],
      canCheckAvailability: !!g?.scopes.includes(SCOPES.freeBusy),
      canListCalendars: !!g?.scopes.includes(SCOPES.calendarList),
      syncedEvents: Object.keys(store.get().events).length,
    });
  });

  app.get('/api/google/auth', (req, res) => {
    if (!googleConfigured(config)) return res.status(503).send('Google Calendar is not configured on the server.');
    const mode = req.query.mode === 'existing' ? 'existing' : 'dedicated';
    const availability = req.query.availability === '1';
    const state = randomBytes(16).toString('hex');
    store.update((d) => (d.oauthState = { value: state, mode, availability, createdAt: new Date().toISOString() }));
    res.redirect(google.authUrl(state, scopesFor(mode, availability)));
  });

  app.get(
    '/api/google/callback',
    handle(async (req, res) => {
      const st = store.get().oauthState;
      const back = `${config.appBaseUrl}/schedule`;
      if (req.query.error) return res.redirect(`${back}?google=denied`);
      if (!st || req.query.state !== st.value || Date.now() - Date.parse(st.createdAt) > 10 * 60_000) return res.redirect(`${back}?google=state-mismatch`);
      const { tokens, scopes } = await google.exchangeCode(String(req.query.code ?? ''));
      const prev = store.get().google;
      store.update((d) => {
        delete d.oauthState;
        d.google = {
          tokens: encrypt(JSON.stringify(tokens), config.encryptionKey!),
          scopes,
          calendarId: prev?.calendarId,
          calendarSummary: prev?.calendarSummary,
          calendarCreatedByApp: prev?.calendarCreatedByApp,
          connectedAt: new Date().toISOString(),
        };
      });
      res.redirect(`${back}?google=connected`);
    }),
  );

  app.post(
    '/api/google/disconnect',
    handle(async (req, res) => {
      if (store.get().google) await google.revoke();
      const removeEvents = req.body?.forgetEvents !== false;
      store.update((d) => {
        delete d.google;
        if (removeEvents) d.events = {};
      });
      res.json({ ok: true });
    }),
  );

  // ── Calendars ─────────────────────────────────────────────────
  app.get(
    '/api/google/calendars',
    handle(async (_req, res) => {
      if (!requireGoogle(res)) return;
      const g = store.get().google!;
      if (!g.scopes.includes(SCOPES.calendarList)) {
        return res.json({ items: g.calendarId ? [{ id: g.calendarId, summary: g.calendarSummary, createdByApp: g.calendarCreatedByApp }] : [] });
      }
      const list = await google.api<{ items: { id: string; summary: string; accessRole: string; primary?: boolean }[] }>('GET', '/users/me/calendarList', undefined, { minAccessRole: 'writer' });
      res.json({ items: list.items.map((c) => ({ id: c.id, summary: c.summary, primary: !!c.primary })) });
    }),
  );

  app.post(
    '/api/google/calendar',
    handle(async (req, res) => {
      if (!requireGoogle(res)) return;
      const { action, calendarId, summary, timeZone } = req.body as { action: 'create' | 'select'; calendarId?: string; summary?: string; timeZone?: string };
      if (action === 'create') {
        const cal = await google.api<{ id: string; summary: string }>('POST', '/calendars', { summary: summary || 'DSA Study', description: 'Study sessions and revision reminders from DSA Companion.', timeZone: timeZone || 'Asia/Kolkata' });
        store.update((d) => Object.assign(d.google!, { calendarId: cal.id, calendarSummary: cal.summary, calendarCreatedByApp: true }));
        return res.json({ calendarId: cal.id, summary: cal.summary });
      }
      if (!calendarId) return res.status(400).json({ error: 'calendarId is required' });
      store.update((d) => Object.assign(d.google!, { calendarId, calendarSummary: summary ?? calendarId, calendarCreatedByApp: false }));
      res.json({ calendarId, summary });
    }),
  );

  app.post(
    '/api/google/freebusy',
    handle(async (req, res) => {
      if (!requireGoogle(res)) return;
      const g = store.get().google!;
      if (!g.scopes.includes(SCOPES.freeBusy)) return res.status(403).json({ error: 'Availability checking was not granted. Reconnect with "check availability" on.' });
      const { timeMin, timeMax, timeZone } = req.body as { timeMin: string; timeMax: string; timeZone: string };
      const fb = await google.api<{ calendars: Record<string, { busy: { start: string; end: string }[] }> }>('POST', '/freeBusy', { timeMin, timeMax, timeZone, items: [{ id: 'primary' }] });
      res.json({ busy: fb.calendars?.primary?.busy ?? [] });
    }),
  );

  // ── Event sync ────────────────────────────────────────────────
  app.post(
    '/api/calendar/sync',
    handle(async (req, res) => {
      if (!requireGoogle(res)) return;
      const g = store.get().google!;
      if (!g.calendarId) return res.status(400).json({ error: 'Choose or create a study calendar first.' });
      const { upserts = [], deleteKeys = [] } = req.body as { upserts?: (CalendarEventInput & { previousKey?: string })[]; deleteKeys?: string[] };
      const valid = upserts.filter((e) => /^(study|review):[\w:-]+$/.test(e.key) && e.summary && e.startLocal && e.endLocal && e.timeZone);
      if (valid.length !== upserts.length) return res.status(400).json({ error: 'Invalid event payload.' });
      const results = await syncEvents(google, store, g.calendarId, config.appBaseUrl, valid, deleteKeys);
      res.json({ results });
    }),
  );

  // ── AI tutor (optional) ───────────────────────────────────────
  app.post(
    '/api/tutor',
    handle(async (req, res) => {
      if (!aiConfigured(config)) return res.status(503).json({ error: 'AI tutor is not configured. The scripted mentor is still available.' });
      const body = req.body as TutorRequest;
      if (!body?.problem?.title || !Array.isArray(body.messages)) return res.status(400).json({ error: 'Invalid request' });
      const reply = await tutor(config, body);
      res.json({ reply });
    }),
  );

  // ── Static client in production ───────────────────────────────
  const dist = path.resolve('dist');
  if (process.env.NODE_ENV === 'production' && existsSync(dist)) {
    app.use(express.static(dist));
    app.get(/^(?!\/api).*/, (_req, res) => res.sendFile(path.join(dist, 'index.html')));
  }
  return app;
}
