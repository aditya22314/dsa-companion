import { decrypt, encrypt } from './crypto';
import type { JsonStore } from './store';
import type { ServerConfig } from './config';

export type FetchLike = (url: string, init?: RequestInit) => Promise<Response>;

export const SCOPES = {
  // Lets the app create its own calendar and manage events only in calendars it created.
  appCreated: 'https://www.googleapis.com/auth/calendar.app.created',
  // Read-only free/busy, used only when "check availability" is enabled.
  freeBusy: 'https://www.googleapis.com/auth/calendar.freebusy',
  // Needed only if the learner picks an existing calendar instead of a dedicated one.
  calendarList: 'https://www.googleapis.com/auth/calendar.calendarlist.readonly',
  events: 'https://www.googleapis.com/auth/calendar.events',
};

export function scopesFor(mode: 'dedicated' | 'existing', availability: boolean): string[] {
  const s = mode === 'dedicated' ? [SCOPES.appCreated] : [SCOPES.calendarList, SCOPES.events];
  if (availability) s.push(SCOPES.freeBusy);
  return s;
}

interface Tokens {
  access_token: string;
  refresh_token?: string;
  expiry: number; // epoch ms
}

export class GoogleError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

const API = 'https://www.googleapis.com/calendar/v3';
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export class GoogleCalendar {
  constructor(
    private cfg: ServerConfig,
    private store: JsonStore,
    private fetchImpl: FetchLike = fetch,
    private retryDelayMs = 400,
  ) {}

  authUrl(state: string, scopes: string[]) {
    const p = new URLSearchParams({
      client_id: this.cfg.google.clientId!,
      redirect_uri: this.cfg.google.redirectUri,
      response_type: 'code',
      access_type: 'offline',
      include_granted_scopes: 'true',
      prompt: 'consent',
      scope: scopes.join(' '),
      state,
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${p}`;
  }

  async exchangeCode(code: string): Promise<{ tokens: Tokens; scopes: string[] }> {
    const res = await this.fetchImpl('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: this.cfg.google.clientId!,
        client_secret: this.cfg.google.clientSecret!,
        redirect_uri: this.cfg.google.redirectUri,
        grant_type: 'authorization_code',
      }),
    });
    const j = (await res.json()) as { access_token?: string; refresh_token?: string; expires_in?: number; scope?: string; error_description?: string };
    if (!res.ok || !j.access_token) throw new GoogleError(j.error_description ?? 'Token exchange failed', res.status);
    return { tokens: { access_token: j.access_token, refresh_token: j.refresh_token, expiry: Date.now() + (j.expires_in ?? 3600) * 1000 }, scopes: (j.scope ?? '').split(' ').filter(Boolean) };
  }

  saveTokens(tokens: Tokens) {
    this.store.update((d) => {
      if (!d.google) throw new Error('Not connected');
      const prev = this.readTokens();
      d.google.tokens = encrypt(JSON.stringify({ ...tokens, refresh_token: tokens.refresh_token ?? prev?.refresh_token }), this.cfg.encryptionKey!);
    });
  }

  readTokens(): Tokens | undefined {
    const g = this.store.get().google;
    if (!g) return undefined;
    return JSON.parse(decrypt(g.tokens, this.cfg.encryptionKey!)) as Tokens;
  }

  private async refresh(tokens: Tokens): Promise<Tokens> {
    if (!tokens.refresh_token) throw new GoogleError('Google session expired. Please reconnect.', 401);
    const res = await this.fetchImpl('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: this.cfg.google.clientId!,
        client_secret: this.cfg.google.clientSecret!,
        refresh_token: tokens.refresh_token,
        grant_type: 'refresh_token',
      }),
    });
    const j = (await res.json()) as { access_token?: string; expires_in?: number; error?: string };
    if (!res.ok || !j.access_token) throw new GoogleError(j.error === 'invalid_grant' ? 'Google access was revoked. Please reconnect.' : 'Could not refresh Google access.', 401);
    const next = { ...tokens, access_token: j.access_token, expiry: Date.now() + (j.expires_in ?? 3600) * 1000 };
    this.saveTokens(next);
    return next;
  }

  private async accessToken(force = false): Promise<string> {
    let t = this.readTokens();
    if (!t) throw new GoogleError('Google Calendar is not connected.', 401);
    if (force || t.expiry - 60_000 < Date.now()) t = await this.refresh(t);
    return t.access_token;
  }

  /** Calls the Calendar API with token refresh on 401 and exponential backoff on 429/5xx. */
  async api<T>(method: string, path: string, body?: unknown, query?: Record<string, string>): Promise<T> {
    const url = `${API}${path}${query ? `?${new URLSearchParams(query)}` : ''}`;
    let refreshed = false;
    for (let attempt = 0; attempt < 4; attempt++) {
      const token = await this.accessToken(false);
      const res = await this.fetchImpl(url, {
        method,
        headers: { Authorization: `Bearer ${token}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
        body: body ? JSON.stringify(body) : undefined,
      });
      if (res.status === 401 && !refreshed) {
        refreshed = true;
        await this.accessToken(true);
        attempt--;
        continue;
      }
      if (res.status === 429 || res.status >= 500 || (res.status === 403 && (await peekRateLimit(res)))) {
        await sleep(this.retryDelayMs * 2 ** attempt);
        continue;
      }
      if (res.status === 204) return undefined as T;
      const text = await res.text();
      const json = text ? JSON.parse(text) : undefined;
      if (!res.ok) throw new GoogleError(json?.error?.message ?? `Google API error ${res.status}`, res.status);
      return json as T;
    }
    throw new GoogleError('Google Calendar is busy. Please try again in a minute.', 503);
  }

  async revoke() {
    const t = this.readTokens();
    const token = t?.refresh_token ?? t?.access_token;
    if (token) {
      try {
        await this.fetchImpl(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(token)}`, { method: 'POST' });
      } catch {
        /* revocation is best-effort; local tokens are deleted regardless */
      }
    }
  }
}

async function peekRateLimit(res: Response): Promise<boolean> {
  try {
    const j = (await res.clone().json()) as { error?: { errors?: { reason?: string }[] } };
    return !!j.error?.errors?.some((e) => e.reason === 'rateLimitExceeded' || e.reason === 'userRateLimitExceeded');
  } catch {
    return false;
  }
}
