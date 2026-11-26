import { dailyReminderIcs } from './reminder';

const st = { days: [1, 3, 5], time: '20:00', duration: 45, timeZone: 'Asia/Kolkata', reminderMinutes: [15] };

describe('daily reminder .ics', () => {
  it('creates one weekly repeating event on the chosen days', () => {
    // 2026-11-26 is a Thursday, so the first event is Friday the 27th.
    const ics = dailyReminderIcs(st, '2026-11-26', 'http://localhost:5173');
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(1);
    expect(ics).toContain('DTSTART;TZID=Asia/Kolkata:20261127T200000');
    expect(ics).toContain('RRULE:FREQ=WEEKLY;BYDAY=MO,WE,FR');
    expect(ics).toContain('DURATION:PT45M');
    expect(ics).toContain('TRIGGER:-PT15M');
    expect(ics).toContain('http://localhost:5173/plan');
  });

  it('starts today when today is a study day', () => {
    expect(dailyReminderIcs(st, '2026-11-30', 'x')).toContain(':20261130T200000');
  });
});
