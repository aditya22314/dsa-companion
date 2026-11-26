import { createHash } from 'node:crypto';
import type { CalendarEventInput, SyncResult } from '../shared/types';
import type { GoogleCalendar } from './google';
import type { JsonStore } from './store';

export const APP_TAG = 'dsaCompanion';

interface GEvent {
  id: string;
  status?: string;
  extendedProperties?: { private?: Record<string, string> };
}

export function toGoogleEvent(e: CalendarEventInput, appBaseUrl: string) {
  const link = e.link.startsWith('http') ? e.link : `${appBaseUrl}${e.link}`;
  return {
    summary: e.summary,
    description: `${e.description}\n\nOpen in DSA Companion: ${link}`,
    start: { dateTime: e.startLocal, timeZone: e.timeZone },
    end: { dateTime: e.endLocal, timeZone: e.timeZone },
    source: { title: 'DSA Companion', url: link },
    reminders: { useDefault: false, overrides: e.reminderMinutes.slice(0, 5).map((m) => ({ method: 'popup', minutes: m })) },
    // Marks events as created by this app so they can be found again without duplicates.
    extendedProperties: { private: { [APP_TAG]: '1', dsaCompanionKey: e.key } },
  };
}

const hashOf = (body: unknown) => createHash('sha256').update(JSON.stringify(body)).digest('hex').slice(0, 16);

/**
 * Upserts app events by stable key. Guarantees:
 * - No duplicates: a key maps to one eventId; a lost mapping is recovered by searching the app's private property.
 * - Unrelated events are never touched: only event IDs stored in the mapping (created by this app) are patched or deleted.
 * - Unchanged events are skipped.
 */
export async function syncEvents(
  g: GoogleCalendar,
  store: JsonStore,
  calendarId: string,
  appBaseUrl: string,
  upserts: (CalendarEventInput & { previousKey?: string })[],
  deleteKeys: string[],
): Promise<SyncResult[]> {
  const results: SyncResult[] = [];
  const cal = encodeURIComponent(calendarId);

  for (const e of upserts) {
    const body = toGoogleEvent(e, appBaseUrl);
    const hash = hashOf(body);
    try {
      const events = store.get().events;
      let mapping = events[e.key];
      // A rescheduled session moves its mapping from the old key to the new one.
      if (!mapping && e.previousKey && events[e.previousKey]) {
        mapping = events[e.previousKey];
        store.update((d) => {
          d.events[e.key] = d.events[e.previousKey!];
          delete d.events[e.previousKey!];
        });
      }
      if (!mapping) {
        // Recover from a lost local mapping instead of creating a duplicate.
        const found = await g.api<{ items?: GEvent[] }>('GET', `/calendars/${cal}/events`, undefined, {
          privateExtendedProperty: `dsaCompanionKey=${e.key}`,
          maxResults: '5',
          showDeleted: 'false',
        });
        const existing = found?.items?.find((i) => i.status !== 'cancelled' && i.extendedProperties?.private?.[APP_TAG] === '1');
        if (existing) mapping = { eventId: existing.id, calendarId, hash: '', updatedAt: '' };
      }
      if (mapping && mapping.calendarId === calendarId) {
        if (mapping.hash === hash) {
          results.push({ key: e.key, action: 'unchanged', eventId: mapping.eventId });
          continue;
        }
        try {
          const updated = await g.api<GEvent>('PATCH', `/calendars/${cal}/events/${encodeURIComponent(mapping.eventId)}`, body);
          store.update((d) => (d.events[e.key] = { eventId: updated.id, calendarId, hash, updatedAt: new Date().toISOString() }));
          results.push({ key: e.key, action: 'updated', eventId: updated.id });
          continue;
        } catch (err) {
          // Event deleted by the user in Google: recreate it once below.
          if (!(err instanceof Error && 'status' in err && ((err as { status: number }).status === 404 || (err as { status: number }).status === 410))) throw err;
        }
      }
      const created = await g.api<GEvent>('POST', `/calendars/${cal}/events`, body);
      store.update((d) => (d.events[e.key] = { eventId: created.id, calendarId, hash, updatedAt: new Date().toISOString() }));
      results.push({ key: e.key, action: 'created', eventId: created.id });
    } catch (err) {
      results.push({ key: e.key, action: 'failed', error: err instanceof Error ? err.message : String(err) });
    }
  }

  for (const key of deleteKeys) {
    const mapping = store.get().events[key];
    if (!mapping) continue; // never delete anything we did not create
    try {
      await g.api('DELETE', `/calendars/${encodeURIComponent(mapping.calendarId)}/events/${encodeURIComponent(mapping.eventId)}`);
    } catch (err) {
      const status = (err as { status?: number }).status;
      if (status !== 404 && status !== 410) {
        results.push({ key, action: 'failed', error: err instanceof Error ? err.message : String(err) });
        continue;
      }
    }
    store.update((d) => delete d.events[key]);
    results.push({ key, action: 'deleted', eventId: mapping.eventId });
  }
  return results;
}
