import type { CalendarEventInput, SyncResult } from '../../shared/types';

export interface Health {
  ok: boolean;
  googleConfigured: boolean;
  aiConfigured: boolean;
  aiModel: string | null;
}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, { ...init, headers: { 'Content-Type': 'application/json', ...init?.headers } });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((body as { error?: string }).error ?? `Request failed (${res.status})`);
  return body as T;
}

export const api = {
  health: () => call<Health>('/api/health'),
  googleStatus: () =>
    call<{ configured: boolean; connected: boolean; calendarId: string | null; calendarSummary: string | null; canCheckAvailability: boolean; canListCalendars: boolean; syncedEvents: number }>(
      '/api/google/status',
    ),
  calendars: () => call<{ items: { id: string; summary: string; primary?: boolean }[] }>('/api/google/calendars'),
  chooseCalendar: (body: { action: 'create' | 'select'; calendarId?: string; summary?: string; timeZone?: string }) =>
    call<{ calendarId: string; summary: string }>('/api/google/calendar', { method: 'POST', body: JSON.stringify(body) }),
  freeBusy: (timeMin: string, timeMax: string, timeZone: string) =>
    call<{ busy: { start: string; end: string }[] }>('/api/google/freebusy', { method: 'POST', body: JSON.stringify({ timeMin, timeMax, timeZone }) }),
  sync: (upserts: (CalendarEventInput & { previousKey?: string })[], deleteKeys: string[] = []) =>
    call<{ results: SyncResult[] }>('/api/calendar/sync', { method: 'POST', body: JSON.stringify({ upserts, deleteKeys }) }),
  disconnect: () => call<{ ok: true }>('/api/google/disconnect', { method: 'POST', body: '{}' }),
  tutor: (body: unknown) => call<{ reply: string }>('/api/tutor', { method: 'POST', body: JSON.stringify(body) }),
};
