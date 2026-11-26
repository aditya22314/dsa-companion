import type { Level, Outcome, TopicId } from '../../../shared/types';
import { PROBLEMS, problemById } from '../../content/problems';
import { topicById } from '../../content/topics';
import type { Attempt, LearnerState } from '../../store/types';
import { QUALITY } from './srs';

type MasteryInput = Pick<LearnerState, 'topics' | 'attempts' | 'reviews'>;

export const LEVEL_NAMES: Record<Level, string> = {
  0: 'Intuition',
  1: 'Predict & dry-run',
  2: 'Tiny exercises',
  3: 'Easy, with guidance',
  4: 'Independent',
  5: 'Course-level',
  6: 'Long-term transfer',
};

const best = (attempts: Attempt[], problemId: string): Outcome | undefined => {
  let top: Outcome | undefined;
  for (const a of attempts) if (a.problemId === problemId && (!top || QUALITY[a.outcome] > QUALITY[top])) top = a.outcome;
  return top;
};

export function bestOutcome(state: Pick<LearnerState, 'attempts'>, problemId: string) {
  return best(state.attempts, problemId);
}

/**
 * Demonstrated level for a topic. Only evidence counts: watching or reading never raises the level.
 */
export function topicLevel(state: MasteryInput, topic: TopicId): Level {
  const tp = state.topics[topic];
  const t = topicById(topic);
  const predictCorrect = tp ? Object.values(tp.predict).filter(Boolean).length : 0;
  const probs = PROBLEMS.filter((p) => p.topic === topic);
  const attempts = state.attempts.filter((a) => problemById(a.problemId)?.topic === topic);

  let level: Level = 0;
  if (predictCorrect >= Math.min(2, t.predict.length)) level = 1;
  if (probs.length === 0) return level; // concept-only topic (complexity)

  const solvedAt = (lvl: number, minQ: number) =>
    probs.some((p) => p.level === lvl && attempts.some((a) => a.problemId === p.id && QUALITY[a.outcome] >= minQ));

  if (level >= 1 && solvedAt(2, 3)) level = 2;
  if (level >= 2 && (solvedAt(3, 4) || solvedAt(4, 4))) level = 3;
  if (level >= 3 && (solvedAt(4, 5) || solvedAt(3, 5))) level = 4;
  if (level >= 4 && solvedAt(5, 5)) level = 5;
  if (level >= 4) {
    // Level 6: an independent revision at least 3 days after first learning, on any problem of the topic.
    const delayed = probs.some((p) => {
      const r = state.reviews[p.id];
      if (!r || r.history.length < 2) return false;
      const first = r.history[0].date;
      return r.history.slice(1).some((h) => h.outcome === 'independent' && daysBetween(first, h.date) >= 3);
    });
    if (delayed && level >= 5) level = 6;
  }
  return level;
}

function daysBetween(a: string, b: string) {
  return Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000);
}

export function independentRate(attempts: Attempt[]): number {
  if (!attempts.length) return 0;
  return attempts.filter((a) => a.outcome === 'independent').length / attempts.length;
}

export function hintDependency(attempts: Attempt[]): number {
  if (!attempts.length) return 0;
  return attempts.reduce((s, a) => s + a.hintsUsed + (a.sawSolution ? 2 : 0) + Math.min(a.mentorSteps, 4) * 0.5, 0) / attempts.length;
}
