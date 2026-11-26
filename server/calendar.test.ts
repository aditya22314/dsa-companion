// @vitest-environment node
import request from 'supertest';
import { createApp } from './app';
import { loadConfig } from './config';
import { JsonStore } from './store';
import type { CalendarEventInput } from '../shared/types';

/** In-memory fake of the Google OAuth + Calendar REST API. */
function fakeGoogle() {
  const events = new Map<string, Record<string, unknown> & { id: string; calendarId: string }>();
  let n = 0;
  const calls: string[] = [];
  let access = 'access-1';
  let failNext429 = 0;
  const revoked: string[] = [];
  // An unrelated event that exists in the user's calendar before the app is connected.
  events.set('personal-1', { id: 'personal-1', calendarId: 'cal-app', summary: 'Dentist', start: { dateTime: '2026-12-02T19:00:00' } });

  const json = (status: number, body?: unknown) => new Response(body === undefined ? null : JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
  const fetchImpl = async (url: string, init: RequestInit = {}) => {
    const method = init.method ?? 'GET';
    calls.push(`${method} ${url.replace('https://www.googleapis.com/calendar/v3', '')}`);
    if (url.startsWith('https://oauth2.googleapis.com/token')) {
      const body = new URLSearchParams(String(init.body));
      if (body.get('grant_type') === 'authorization_code') return json(200, { access_token: access, refresh_token: 'refresh-1', expires_in: 3600, scope: 'https://www.googleapis.com/auth/calendar.app.created' });
      access = `access-${++n}`;
      return json(200, { access_token: access, expires_in: 3600 });
    }
    if (url.startsWith('https://oauth2.googleapis.com/revoke')) {
      revoked.push(new URL(url).searchParams.get('token')!);
      return json(200, {});
    }
    const auth = (init.headers as Record<string, string>)?.Authorization;
    if (auth !== `Bearer ${access}`) return json(401, { error: { message: 'expired' } });
    if (failNext429 > 0) {
      failNext429--;
      return json(429, { error: { message: 'slow down' } });
    }
    const u = new URL(url);
    const p = u.pathname.replace('/calendar/v3', '');
    if (method === 'POST' && p === '/calendars') return json(200, { id: 'cal-app', summary: JSON.parse(String(init.body)).summary });
    const m = p.match(/^\/calendars\/([^/]+)\/events(?:\/([^/]+))?$/);
    if (m) {
      const cal = decodeURIComponent(m[1]);
      const id = m[2] && decodeURIComponent(m[2]);
      if (method === 'GET' && !id) {
        const prop = u.searchParams.get('privateExtendedProperty');
        const [k, v] = (prop ?? '').split('=');
        const items = [...events.values()].filter((e) => e.calendarId === cal && (e.extendedProperties as { private?: Record<string, string> })?.private?.[k] === v);
        return json(200, { items });
      }
      if (method === 'POST') {
        const ev = { ...JSON.parse(String(init.body)), id: `ev-${++n}`, calendarId: cal };
        events.set(ev.id, ev);
        return json(200, ev);
      }
      if (!id || !events.has(id)) return json(404, { error: { message: 'Not Found' } });
      if (method === 'PATCH') {
        const ev = { ...events.get(id)!, ...JSON.parse(String(init.body)) };
        events.set(id, ev);
        return json(200, ev);
      }
      if (method === 'DELETE') {
        events.delete(id);
        return new Response(null, { status: 204 });
      }
    }
    return json(404, { error: { message: `unhandled ${method} ${p}` } });
  };
  return {
    fetchImpl,
    events,
    calls,
    revoked,
    expireAccess: () => (access = `rotated-${++n}`),
    throttle: (k: number) => (failNext429 = k),
  };
}

const env = { GOOGLE_CLIENT_ID: 'cid', GOOGLE_CLIENT_SECRET: 'secret', TOKEN_ENCRYPTION_KEY: 'test-key-123', APP_BASE_URL: 'http://localhost:5173' } as NodeJS.ProcessEnv;

async function connected() {
  const g = fakeGoogle();
  const store = new JsonStore(null);
  const app = createApp({ config: loadConfig(env), store, fetchImpl: g.fetchImpl as never, retryDelayMs: 1 });
  const auth = await request(app).get('/api/google/auth?mode=dedicated');
  expect(auth.status).toBe(302);
  const loc = new URL(auth.headers.location);
  expect(loc.searchParams.get('scope')).toBe('https://www.googleapis.com/auth/calendar.app.created');
  const state = loc.searchParams.get('state');
  const cb = await request(app).get(`/api/google/callback?code=abc&state=${state}`);
  expect(cb.headers.location).toBe('http://localhost:5173/schedule?google=connected');
  await request(app).post('/api/google/calendar').send({ action: 'create', summary: 'DSA Study' }).expect(200);
  return { app, g, store };
}

const ev = (key: string, title: string, start = '2026-12-01T20:00:00'): CalendarEventInput => ({
  key,
  summary: title,
  description: 'Objective: practise two pointers.',
  startLocal: start,
  endLocal: start.replace('20:00', '20:25'),
  timeZone: 'Asia/Kolkata',
  reminderMinutes: [15],
  link: '/practice/pair-sum-sorted',
});

describe('Google Calendar integration', () => {
  it('reports not configured without credentials', async () => {
    const app = createApp({ config: loadConfig({} as NodeJS.ProcessEnv), store: new JsonStore(null) });
    const res = await request(app).get('/api/google/status');
    expect(res.body).toMatchObject({ configured: false, connected: false });
    await request(app).post('/api/calendar/sync').send({ upserts: [] }).expect(503);
  });

  it('rejects an OAuth callback with a wrong state', async () => {
    const g = fakeGoogle();
    const app = createApp({ config: loadConfig(env), store: new JsonStore(null), fetchImpl: g.fetchImpl as never });
    await request(app).get('/api/google/auth');
    const cb = await request(app).get('/api/google/callback?code=abc&state=forged');
    expect(cb.headers.location).toContain('state-mismatch');
  });

  it('stores tokens encrypted', async () => {
    const { store } = await connected();
    const raw = JSON.stringify(store.get());
    expect(raw).not.toContain('refresh-1');
    expect(raw).not.toContain('access-1');
  });

  it('creates events with topic, time, reminder and deep link', async () => {
    const { app, g } = await connected();
    const res = await request(app).post('/api/calendar/sync').send({ upserts: [ev('study:2026-12-01', 'DSA Study: Two Pointers — Pair With Target')] });
    expect(res.body.results[0].action).toBe('created');
    const created = [...g.events.values()].find((e) => e.summary === 'DSA Study: Two Pointers — Pair With Target')!;
    expect(created.start).toEqual({ dateTime: '2026-12-01T20:00:00', timeZone: 'Asia/Kolkata' });
    expect(String(created.description)).toContain('http://localhost:5173/practice/pair-sum-sorted');
    expect(created.reminders).toEqual({ useDefault: false, overrides: [{ method: 'popup', minutes: 15 }] });
  });

  it('updates in place, skips unchanged and never duplicates', async () => {
    const { app, g } = await connected();
    await request(app).post('/api/calendar/sync').send({ upserts: [ev('study:2026-12-01', 'A')] });
    const again = await request(app).post('/api/calendar/sync').send({ upserts: [ev('study:2026-12-01', 'A')] });
    expect(again.body.results[0].action).toBe('unchanged');
    const changed = await request(app).post('/api/calendar/sync').send({ upserts: [ev('study:2026-12-01', 'B')] });
    expect(changed.body.results[0].action).toBe('updated');
    const appEvents = [...g.events.values()].filter((e) => e.id !== 'personal-1');
    expect(appEvents).toHaveLength(1);
    expect(appEvents[0].summary).toBe('B');
  });

  it('recovers a lost local mapping instead of duplicating', async () => {
    const { app, g, store } = await connected();
    await request(app).post('/api/calendar/sync').send({ upserts: [ev('study:2026-12-01', 'A')] });
    store.update((d) => (d.events = {}));
    const res = await request(app).post('/api/calendar/sync').send({ upserts: [ev('study:2026-12-01', 'A2')] });
    expect(res.body.results[0].action).toBe('updated');
    expect([...g.events.values()].filter((e) => e.id !== 'personal-1')).toHaveLength(1);
  });

  it('moves a rescheduled session with one-click reschedule (same event, no duplicate)', async () => {
    const { app, g } = await connected();
    const first = await request(app).post('/api/calendar/sync').send({ upserts: [ev('study:2026-12-01', 'A')] });
    const id = first.body.results[0].eventId;
    const moved = await request(app)
      .post('/api/calendar/sync')
      .send({ upserts: [{ ...ev('study:2026-12-02', 'A', '2026-12-02T20:00:00'), previousKey: 'study:2026-12-01' }] });
    expect(moved.body.results[0]).toMatchObject({ action: 'updated', eventId: id });
    expect([...g.events.values()].filter((e) => e.id !== 'personal-1')).toHaveLength(1);
  });

  it('never modifies or deletes unrelated events', async () => {
    const { app, g } = await connected();
    await request(app).post('/api/calendar/sync').send({ upserts: [ev('study:2026-12-01', 'A')] });
    const res = await request(app).post('/api/calendar/sync').send({ deleteKeys: ['study:2026-12-01', 'study:unknown'] });
    expect(res.body.results).toEqual([{ key: 'study:2026-12-01', action: 'deleted', eventId: expect.any(String) }]);
    expect(g.events.get('personal-1')).toMatchObject({ summary: 'Dentist' });
    expect(g.calls.filter((c) => c.includes('personal-1'))).toEqual([]);
  });

  it('refreshes expired tokens and retries rate limits', async () => {
    const { app, g } = await connected();
    g.expireAccess();
    g.throttle(2);
    const res = await request(app).post('/api/calendar/sync').send({ upserts: [ev('study:2026-12-03', 'C')] });
    expect(res.body.results[0].action).toBe('created');
    expect(g.calls.some((c) => c.startsWith('POST https://oauth2.googleapis.com/token'))).toBe(true);
  });

  it('disconnect revokes access and removes tokens', async () => {
    const { app, g, store } = await connected();
    await request(app).post('/api/google/disconnect').send({}).expect(200);
    expect(g.revoked).toEqual(['refresh-1']);
    expect(store.get().google).toBeUndefined();
    const st = await request(app).get('/api/google/status');
    expect(st.body.connected).toBe(false);
  });
});

describe('AI tutor endpoint', () => {
  it('is optional and reports when not configured', async () => {
    const app = createApp({ config: loadConfig({} as NodeJS.ProcessEnv), store: new JsonStore(null) });
    const h = await request(app).get('/api/health');
    expect(h.body.aiConfigured).toBe(false);
    await request(app).post('/api/tutor').send({}).expect(503);
  });
  it('proxies to the tutor server-side when configured', async () => {
    const tutor = vi.fn(async () => 'What does the function receive as input?');
    const app = createApp({ config: loadConfig({ ANTHROPIC_API_KEY: 'k' } as NodeJS.ProcessEnv), store: new JsonStore(null), tutor });
    const res = await request(app)
      .post('/api/tutor')
      .send({ problem: { title: 'T', statement: 's', pattern: 'p', constraints: [] }, code: '', hintsUsed: 0, allowSolution: false, messages: [{ role: 'user', content: 'help' }] });
    expect(res.body.reply).toMatch(/input/);
  });
});
