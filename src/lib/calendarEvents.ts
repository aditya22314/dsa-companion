import type { CalendarEventInput } from '../../shared/types';
import { problemById } from '../content/problems';
import type { PlannedSession, ScheduleSettings } from '../store/types';
import { sessionEnd } from './engine/weekly';

export function toEventInput(s: PlannedSession, settings: ScheduleSettings): CalendarEventInput {
  const end = sessionEnd(s);
  const reviews = s.reviewIds.map((id) => problemById(id)?.title).filter(Boolean);
  const description = [
    `Learning objective: ${s.objective}`,
    `Duration: ${s.duration} minutes`,
    reviews.length ? `Recall from memory: ${reviews.join(', ')}` : '',
    `Before you start: ${s.prep}`,
    '',
    'Mark the session done in DSA Companion when you finish. A session is not counted as complete just because its time passed.',
  ]
    .filter((l) => l !== '')
    .join('\n');
  return {
    key: s.key,
    summary: s.title,
    description,
    startLocal: `${s.date}T${s.time}:00`,
    endLocal: `${end.date}T${end.time}:00`,
    timeZone: settings.timeZone,
    reminderMinutes: settings.reminderMinutes,
    link: s.link,
  };
}

/** Minimal iCalendar export so the plan is usable without Google credentials. */
export function toIcs(sessions: PlannedSession[], settings: ScheduleSettings, baseUrl: string): string {
  const esc = (t: string) => t.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\;');
  const dt = (local: string) => local.replace(/[-:]/g, '').slice(0, 15);
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//DSA Companion//EN', 'CALSCALE:GREGORIAN'];
  for (const s of sessions) {
    const e = toEventInput(s, settings);
    lines.push(
      'BEGIN:VEVENT',
      `UID:${e.key}@dsa-companion`,
      `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').slice(0, 15)}Z`,
      `DTSTART;TZID=${e.timeZone}:${dt(e.startLocal)}`,
      `DTEND;TZID=${e.timeZone}:${dt(e.endLocal)}`,
      `SUMMARY:${esc(e.summary)}`,
      `DESCRIPTION:${esc(`${e.description}\n\nOpen: ${baseUrl}${e.link}`)}`,
      `URL:${baseUrl}${e.link}`,
      ...e.reminderMinutes.flatMap((m) => ['BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:DSA study', `TRIGGER:-PT${m}M`, 'END:VALARM']),
      'END:VEVENT',
    );
  }
  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}
