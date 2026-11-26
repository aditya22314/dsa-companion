// Timezone-aware date helpers. Dates are handled as local YYYY-MM-DD strings in the learner's timezone.

export const DEFAULT_TZ = 'Asia/Kolkata';

function parts(d: Date, timeZone: string) {
  const f = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const p = Object.fromEntries(f.formatToParts(d).map((x) => [x.type, x.value]));
  return { date: `${p.year}-${p.month}-${p.day}`, time: `${p.hour === '24' ? '00' : p.hour}:${p.minute}` };
}

export const todayIn = (timeZone: string, now: Date = new Date()) => parts(now, timeZone).date;
export const timeIn = (timeZone: string, now: Date = new Date()) => parts(now, timeZone).time;

export function addDays(date: string, days: number): string {
  const [y, m, d] = date.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return dt.toISOString().slice(0, 10);
}

export function diffDays(from: string, to: string): number {
  const a = Date.UTC(...(from.split('-').map(Number).map((v, i) => (i === 1 ? v - 1 : v)) as [number, number, number]));
  const b = Date.UTC(...(to.split('-').map(Number).map((v, i) => (i === 1 ? v - 1 : v)) as [number, number, number]));
  return Math.round((b - a) / 86_400_000);
}

/** 0 = Sunday … 6 = Saturday */
export function weekday(date: string): number {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

export function addMinutesToTime(time: string, minutes: number): { time: string; dayOffset: number } {
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m + minutes;
  const dayOffset = Math.floor(total / 1440);
  const t = ((total % 1440) + 1440) % 1440;
  return { time: `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`, dayOffset };
}

export const toMinutes = (time: string) => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};

export const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function prettyDate(date: string): string {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });
}
