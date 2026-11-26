import type { Outcome } from '../../../shared/types';
import { addDays } from '../dates';

/** First reviews follow this ladder (days after learning), then intervals adapt to performance. */
export const LADDER = [1, 3, 5, 7, 14];

export interface ReviewItem {
  problemId: string;
  stage: number;
  intervalDays: number;
  ease: number;
  due: string;
  lastReviewed: string;
  lapses: number;
  history: { date: string; outcome: Outcome }[];
}

export const QUALITY: Record<Outcome, number> = {
  independent: 5,
  'small-hints': 4,
  guided: 3,
  'saw-solution': 2,
  unable: 1,
};

export const isSuccess = (o: Outcome) => QUALITY[o] >= 4;
export const isFailure = (o: Outcome) => QUALITY[o] <= 2;

/**
 * Schedules the next review after an attempt or a revision.
 * - Failure (saw solution / unable): back to day 1, ease drops, lapse recorded.
 * - Guided: same step again (the idea is not yet independent).
 * - Success: move up the ladder; after the ladder, multiply by ease.
 */
export function scheduleReview(prev: ReviewItem | undefined, problemId: string, outcome: Outcome, today: string): ReviewItem {
  const q = QUALITY[outcome];
  const history = [...(prev?.history ?? []), { date: today, outcome }];
  if (!prev) {
    // First time learning it: always start at day 1, even after an independent solve.
    return { problemId, stage: 0, intervalDays: 1, ease: q >= 4 ? 2.5 : 2.2, due: addDays(today, 1), lastReviewed: today, lapses: 0, history };
  }
  let { stage, ease, lapses } = prev;
  let interval: number;
  if (q <= 2) {
    stage = 0;
    interval = 1;
    ease = Math.max(1.3, ease - 0.2);
    lapses += 1;
  } else if (q === 3) {
    interval = LADDER[Math.min(stage, LADDER.length - 1)];
    ease = Math.max(1.3, ease - 0.05);
  } else {
    stage += 1;
    if (stage < LADDER.length) {
      interval = LADDER[stage];
      // Strong performance may skip a little ahead on the ladder, never backwards.
      if (q === 5 && prev.history.length >= 2 && prev.history.slice(-2).every((h) => h.outcome === 'independent')) {
        interval = Math.max(interval, Math.round(prev.intervalDays * 1.5));
      }
    } else {
      interval = Math.round(prev.intervalDays * (q === 5 ? ease : ease * 0.8));
      if (q === 5) ease = Math.min(3, ease + 0.1);
    }
  }
  interval = Math.min(Math.max(1, interval), 120);
  return { problemId, stage, intervalDays: interval, ease, due: addDays(today, interval), lastReviewed: today, lapses, history };
}

export const isDue = (item: ReviewItem, today: string) => item.due <= today;
