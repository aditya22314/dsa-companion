import { scheduleReview, LADDER } from './srs';

describe('scheduleReview', () => {
  it('first learning is due the next day', () => {
    const r = scheduleReview(undefined, 'p', 'independent', '2026-12-01');
    expect(r.due).toBe('2026-12-02');
  });

  it('follows the 1, 3, 5, 7, 14 ladder on consistent small-hint success', () => {
    let r = scheduleReview(undefined, 'p', 'small-hints', '2026-12-01');
    const intervals = [r.intervalDays];
    for (let i = 0; i < 4; i++) {
      r = scheduleReview(r, 'p', 'small-hints', r.due);
      intervals.push(r.intervalDays);
    }
    expect(intervals).toEqual(LADDER);
  });

  it('adapts beyond the ladder instead of repeating it forever', () => {
    let r = scheduleReview(undefined, 'p', 'independent', '2026-12-01');
    for (let i = 0; i < 6; i++) r = scheduleReview(r, 'p', 'independent', r.due);
    expect(r.intervalDays).toBeGreaterThan(14);
  });

  it('a failed recall resets to day 1 and records a lapse', () => {
    let r = scheduleReview(undefined, 'p', 'independent', '2026-12-01');
    r = scheduleReview(r, 'p', 'independent', r.due);
    r = scheduleReview(r, 'p', 'unable', '2026-12-05');
    expect(r.intervalDays).toBe(1);
    expect(r.due).toBe('2026-12-06');
    expect(r.lapses).toBe(1);
    expect(r.stage).toBe(0);
  });

  it('guided success repeats the same step', () => {
    let r = scheduleReview(undefined, 'p', 'guided', '2026-12-01');
    r = scheduleReview(r, 'p', 'small-hints', r.due); // stage 1 → 3 days
    const again = scheduleReview(r, 'p', 'guided', r.due);
    expect(again.stage).toBe(1);
    expect(again.intervalDays).toBe(3);
  });
});
