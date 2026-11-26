import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useStore } from '../store';
import { api } from '../lib/api';
import { buildWeekPlan, isIncomplete, suggestReschedule } from '../lib/engine/weekly';
import { toEventInput, toIcs } from '../lib/calendarEvents';
import { prettyDate, timeIn, todayIn, WEEKDAYS, addDays } from '../lib/dates';
import { Card, PageHeader, cx } from '../components/ui';
import type { PlannedSession } from '../store/types';

type GStatus = Awaited<ReturnType<typeof api.googleStatus>>;

const KIND_TONE: Record<PlannedSession['kind'], string> = {
  new: 'text-accent border-accent/40',
  practice: 'text-ink',
  challenge: 'text-warn border-warn/40',
  review: 'text-good border-good/40',
  recovery: 'text-muted',
};

function localParts(iso: string, tz: string) {
  const d = new Date(iso);
  return { date: todayIn(tz, d), time: timeIn(tz, d) };
}

export default function Schedule() {
  const s = useStore();
  const st = s.schedule;
  const today = s.today();
  const now = timeIn(st.timeZone);
  const [params, setParams] = useSearchParams();
  const [g, setG] = useState<GStatus | null>(null);
  const [gErr, setGErr] = useState('');
  const [busyMsg, setBusyMsg] = useState('');
  const [syncMsg, setSyncMsg] = useState('');
  const [calendars, setCalendars] = useState<{ id: string; summary: string }[]>([]);

  const refresh = useCallback(() => {
    api
      .googleStatus()
      .then((x) => {
        setG(x);
        setGErr('');
        if (x.connected && x.canListCalendars) api.calendars().then((c) => setCalendars(c.items)).catch(() => {});
      })
      .catch(() => setGErr('The DSA Companion server is not running, so Google Calendar is unavailable. Local scheduling still works.'));
  }, []);
  useEffect(refresh, [refresh]);

  const flash = params.get('google');
  useEffect(() => {
    if (flash) {
      const t = setTimeout(() => setParams({}, { replace: true }), 6000);
      return () => clearTimeout(t);
    }
  }, [flash, setParams]);

  const upcoming = s.sessions.filter((x) => x.date >= today || x.status !== 'completed').filter((x) => !isIncomplete(x, today, now));
  const missed = s.sessions.filter((x) => isIncomplete(x, today, now));
  const drafts = s.sessions.filter((x) => x.status === 'draft');
  const canSync = !!g?.connected && !!g.calendarId;

  const generate = () => s.setDraftPlan(buildWeekPlan(s, st, today));

  const syncSessions = async (list: PlannedSession[], extra?: { previousKey?: string }) => {
    if (!canSync || !list.length) return;
    setBusyMsg('Syncing with Google Calendar…');
    try {
      const { results } = await api.sync(list.map((x) => ({ ...toEventInput(x, st), ...(extra ?? {}) })));
      for (const r of results) if (r.eventId && r.action !== 'failed') s.updateSession(r.key, { synced: { eventId: r.eventId, at: new Date().toISOString() } });
      const failed = results.filter((r) => r.action === 'failed');
      const counts = ['created', 'updated', 'unchanged'].map((a) => `${results.filter((r) => r.action === a).length} ${a}`).join(', ');
      setSyncMsg(failed.length ? `Synced with ${failed.length} error(s): ${failed[0].error}` : `Google Calendar up to date (${counts}).`);
    } catch (e) {
      setSyncMsg(e instanceof Error ? e.message : 'Sync failed');
    } finally {
      setBusyMsg('');
    }
  };

  const approveAndSync = async () => {
    s.approvePlan();
    const approved = useStore.getState().sessions.filter((x) => x.status === 'approved' && x.date >= today);
    await syncSessions(approved);
  };

  const remove = async (x: PlannedSession) => {
    s.removeSession(x.key);
    if (x.synced && canSync) {
      await api.sync([], [x.key]).catch(() => setSyncMsg('Could not remove the event from Google. It will be retried on the next sync.'));
    }
  };

  const reschedule = async (x: PlannedSession) => {
    let busy: [string, string, string][] = [];
    if (st.checkAvailability && g?.canCheckAvailability) {
      try {
        const fb = await api.freeBusy(new Date().toISOString(), new Date(Date.now() + 14 * 86400000).toISOString(), st.timeZone);
        busy = fb.busy.map((b) => {
          const a = localParts(b.start, st.timeZone);
          const e = localParts(b.end, st.timeZone);
          return [a.date, a.time, e.date === a.date ? e.time : '23:59'];
        });
      } catch {
        /* availability is optional */
      }
    }
    const taken = s.sessions.filter((y) => y.key !== x.key).map((y) => y.date);
    const slot = suggestReschedule(x, st, today, now, taken, busy);
    const moved = s.rescheduleSession(x.key, slot.date, slot.time);
    if (moved && x.synced) await syncSessions([moved], { previousKey: x.key });
  };

  const downloadIcs = () => {
    const list = s.sessions.filter((x) => x.status === 'approved' && x.date >= today);
    const blob = new Blob([toIcs(list, st, window.location.origin)], { type: 'text/calendar' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'dsa-companion.ics';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const authUrl = `/api/google/auth?mode=${st.calendarMode}&availability=${st.checkAvailability ? 1 : 0}`;

  return (
    <div className="space-y-6">
      <PageHeader title="Schedule" subtitle="Plan a calm week, approve it, and optionally sync it to Google Calendar. Revision reminders come from your spaced-repetition schedule." />

      {flash && (
        <div className={cx('rounded-xl border p-3 text-sm', flash === 'connected' ? 'border-good/40 text-good' : 'border-warn/40 text-warn')} role="status">
          {flash === 'connected' ? 'Google Calendar connected.' : flash === 'denied' ? 'Google access was not granted. Nothing changed.' : 'The sign-in link expired. Please try connecting again.'}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="space-y-4">
          <h2 className="h2">Study routine</h2>
          <fieldset>
            <legend className="label">Days</legend>
            <div className="flex flex-wrap gap-1.5">
              {WEEKDAYS.map((d, i) => {
                const on = st.days.includes(i);
                return (
                  <button key={d} aria-pressed={on} onClick={() => s.updateSchedule({ days: on ? st.days.filter((x) => x !== i) : [...st.days, i].sort() })} className={cx('h-9 w-11 rounded-lg border text-sm', on ? 'border-accent bg-accent/15' : 'border-line text-muted')}>
                    {d}
                  </button>
                );
              })}
            </div>
          </fieldset>
          <div className="grid grid-cols-2 gap-3">
            <label>
              <span className="label">Time</span>
              <input type="time" className="input" value={st.time} onChange={(e) => s.updateSchedule({ time: e.target.value })} />
            </label>
            <label>
              <span className="label">Duration</span>
              <select className="input" value={st.duration} onChange={(e) => s.updateSchedule({ duration: Number(e.target.value) })}>
                {[10, 25, 45, 60].map((m) => (
                  <option key={m} value={m}>
                    {m} minutes
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="label">Timezone</span>
              <input className="input" value={st.timeZone} onChange={(e) => s.updateSchedule({ timeZone: e.target.value })} list="tzs" />
              <datalist id="tzs">
                {['Asia/Kolkata', 'Asia/Dubai', 'Asia/Singapore', 'Europe/London', 'America/New_York', 'America/Los_Angeles'].map((t) => (
                  <option key={t} value={t} />
                ))}
              </datalist>
            </label>
            <label>
              <span className="label">Reminder</span>
              <select className="input" value={st.reminderMinutes[0] ?? 0} onChange={(e) => s.updateSchedule({ reminderMinutes: Number(e.target.value) ? [Number(e.target.value)] : [] })}>
                <option value={0}>No reminder</option>
                {[5, 10, 15, 30, 60].map((m) => (
                  <option key={m} value={m}>
                    {m} minutes before
                  </option>
                ))}
              </select>
            </label>
          </div>
        </Card>

        <Card className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="h2">Google Calendar</h2>
            <span className={cx('chip', g?.connected ? 'border-good/40 text-good' : '')}>{g?.connected ? 'connected' : g?.configured ? 'not connected' : 'not configured'}</span>
          </div>
          {gErr && <p className="text-sm text-muted">{gErr}</p>}
          {g && !g.configured && (
            <div className="space-y-2 text-sm text-muted">
              <p>The server has no Google OAuth credentials yet, so live sync is off. Everything else on this page works locally, and you can export approved sessions as an .ics file.</p>
              <p>
                To enable sync, follow <code className="code-inline">docs/GOOGLE_CALENDAR_SETUP.md</code> in the repository (about 10 minutes in Google Cloud Console).
              </p>
            </div>
          )}
          {g?.configured && !g.connected && (
            <div className="space-y-3 text-sm">
              <label className="flex items-start gap-2">
                <input type="radio" checked={st.calendarMode === 'dedicated'} onChange={() => s.updateSchedule({ calendarMode: 'dedicated' })} className="mt-1" />
                <span>
                  <strong>Dedicated "DSA Study" calendar</strong> (recommended). The app can only see and change calendars it creates, so your other events stay invisible to it.
                </span>
              </label>
              <label className="flex items-start gap-2">
                <input type="radio" checked={st.calendarMode === 'existing'} onChange={() => s.updateSchedule({ calendarMode: 'existing' })} className="mt-1" />
                <span>Use one of my existing calendars. Requires event access; the app still only edits events it created.</span>
              </label>
              <label className="flex items-start gap-2">
                <input type="checkbox" checked={st.checkAvailability} onChange={(e) => s.updateSchedule({ checkAvailability: e.target.checked })} className="mt-1" />
                <span>Check my free/busy time before suggesting new slots (read-only free/busy permission).</span>
              </label>
              <a href={authUrl} className="btn-primary">
                Connect Google Calendar
              </a>
            </div>
          )}
          {g?.connected && (
            <div className="space-y-3 text-sm">
              {g.calendarId ? (
                <p>
                  Syncing to <strong>{g.calendarSummary}</strong>. {g.syncedEvents} app event{g.syncedEvents === 1 ? '' : 's'} tracked.
                </p>
              ) : (
                <div className="space-y-2">
                  <p>Choose where study sessions go:</p>
                  <button className="btn-primary" onClick={() => api.chooseCalendar({ action: 'create', summary: 'DSA Study', timeZone: st.timeZone }).then(refresh).catch((e) => setSyncMsg(e.message))}>
                    Create "DSA Study" calendar
                  </button>
                  {calendars.length > 0 && (
                    <select className="input" defaultValue="" onChange={(e) => e.target.value && api.chooseCalendar({ action: 'select', calendarId: e.target.value, summary: calendars.find((c) => c.id === e.target.value)?.summary }).then(refresh)}>
                      <option value="">…or pick an existing calendar</option>
                      {calendars.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.summary}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}
              <button
                className="btn-ghost"
                onClick={async () => {
                  if (!confirm('Disconnect Google Calendar? Access will be revoked. Events already created stay in your calendar.')) return;
                  await api.disconnect();
                  s.sessions.forEach((x) => x.synced && s.updateSession(x.key, { synced: undefined }));
                  refresh();
                }}
              >
                Disconnect
              </button>
            </div>
          )}
        </Card>
      </div>

      {missed.length > 0 && (
        <Card className="border-warn/40">
          <h2 className="h2 mb-1">Sessions that didn't happen</h2>
          <p className="mb-3 text-sm text-muted">No problem. Life happens. Move them in one click; the calendar event moves too, without duplicates.</p>
          <ul className="space-y-2">
            {missed.map((x) => (
              <li key={x.key} className="flex flex-wrap items-center gap-3 rounded-xl border border-line p-3 text-sm">
                <span className="min-w-0 flex-1">
                  <span className="font-medium">{x.title}</span>
                  <span className="block text-xs text-muted">
                    Planned {prettyDate(x.date)} at {x.time}
                  </span>
                </span>
                <button className="btn-primary" onClick={() => reschedule(x)}>
                  Reschedule
                </button>
                <button className="btn-ghost" onClick={() => s.completeSession(x.key)}>
                  I did it
                </button>
                <button className="btn-ghost text-muted" onClick={() => remove(x)}>
                  Skip
                </button>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="h2">This week's plan</h2>
            <p className="text-sm text-muted">
              One session per study day at most. Reviews due on rest days are folded into the next session. {addDays(today, 6) && `Covers ${prettyDate(today)} to ${prettyDate(addDays(today, 6))}.`}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="btn-ghost" onClick={generate}>
              {s.sessions.some((x) => x.date >= today) ? 'Regenerate drafts' : 'Generate plan'}
            </button>
            {drafts.length > 0 && (
              <button className="btn-primary" onClick={approveAndSync} disabled={!!busyMsg}>
                Approve{canSync ? ' & sync' : ''} {drafts.length} session{drafts.length > 1 ? 's' : ''}
              </button>
            )}
            {canSync && drafts.length === 0 && upcoming.some((x) => x.status === 'approved') && (
              <button className="btn-soft" onClick={() => syncSessions(upcoming.filter((x) => x.status === 'approved'))} disabled={!!busyMsg}>
                Sync now
              </button>
            )}
            {!canSync && upcoming.some((x) => x.status === 'approved') && (
              <button className="btn-soft" onClick={downloadIcs}>
                Export .ics
              </button>
            )}
          </div>
        </div>
        {(busyMsg || syncMsg) && <p className="mb-3 text-sm text-muted" role="status">{busyMsg || syncMsg}</p>}
        {upcoming.length === 0 ? (
          <p className="text-sm text-muted">No sessions planned. Generate a plan, edit anything you like, then approve it.</p>
        ) : (
          <ul className="space-y-2">
            {upcoming.map((x) => (
              <li key={x.key} className={cx('rounded-xl border p-3', x.status === 'draft' ? 'border-dashed border-line' : 'border-line')}>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="w-28 text-sm font-medium">{prettyDate(x.date)}</span>
                  <input type="time" className="input w-32 py-1" value={x.time} onChange={(e) => s.updateSession(x.key, { time: e.target.value })} aria-label="Start time" />
                  <select className="input w-24 py-1" value={x.duration} onChange={(e) => s.updateSession(x.key, { duration: Number(e.target.value) })} aria-label="Duration">
                    {[10, 15, 25, 45, 60].map((m) => (
                      <option key={m} value={m}>
                        {m}m
                      </option>
                    ))}
                  </select>
                  <span className={cx('chip', KIND_TONE[x.kind])}>{x.kind}</span>
                  <span className="chip">{x.status}</span>
                  {x.synced && <span className="chip border-good/40 text-good">in Google</span>}
                  <span className="ml-auto flex gap-1">
                    {x.status !== 'completed' && x.date <= today && (
                      <button className="btn-soft py-1 text-xs" onClick={() => s.completeSession(x.key)}>
                        Mark done
                      </button>
                    )}
                    <button className="btn-ghost py-1 text-xs text-muted" onClick={() => remove(x)} aria-label={`Remove ${x.title}`}>
                      Remove
                    </button>
                  </span>
                </div>
                <input className="input mt-2 py-1 font-medium" value={x.title} onChange={(e) => s.updateSession(x.key, { title: e.target.value })} aria-label="Event title" />
                <p className="mt-1 text-sm text-muted">{x.objective}</p>
                <Link to={x.link} className="text-xs text-accent hover:underline">
                  Open activity →
                </Link>
              </li>
            ))}
          </ul>
        )}
        {drafts.some((x) => x.synced) && <p className="mt-2 text-xs text-muted">Edited sessions are updated in place in Google Calendar when you approve, never duplicated.</p>}
      </Card>
    </div>
  );
}
