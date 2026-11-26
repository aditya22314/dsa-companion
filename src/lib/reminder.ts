import type { ScheduleSettings } from '../store/types';
import { addDays, weekday } from './dates';

const BYDAY = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];

/**
 * One recurring calendar reminder for the chosen study days and time.
 * Import the file into Google Calendar, Apple Calendar or Outlook. No account connection needed.
 */
export function dailyReminderIcs(st: ScheduleSettings, today: string, appUrl: string): string {
  const days = [...st.days].sort();
  let start = today;
  for (let i = 0; i < 7 && days.length && !days.includes(weekday(start)); i++) start = addDays(start, 1);
  const dt = `${start.replace(/-/g, '')}T${st.time.replace(':', '')}00`;
  const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/;/g, '\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//DSA Companion//Daily plan//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:dsa-companion-daily-plan@local`,
    `DTSTAMP:${stamp}`,
    `DTSTART;TZID=${st.timeZone}:${dt}`,
    `DURATION:PT${st.duration}M`,
    `RRULE:FREQ=WEEKLY;BYDAY=${(days.length ? days : [1, 2, 3, 4, 5]).map((d) => BYDAY[d]).join(',')}`,
    `SUMMARY:${esc('DSA practice: today\'s plan')}`,
    `DESCRIPTION:${esc(`Open your daily plan: ${appUrl}/plan\nWarm up in the app, watch the Namaste DSA lesson, then solve on your own.`)}`,
    `URL:${appUrl}/plan`,
  ];
  for (const m of st.reminderMinutes) lines.push('BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:DSA practice', `TRIGGER:-PT${m}M`, 'END:VALARM');
  lines.push('END:VEVENT', 'END:VCALENDAR');
  return lines.join('\r\n') + '\r\n';
}
