import type { StudyMode, TopicId } from '../../../shared/types';
import { problemById } from '../../content/problems';
import { topicById } from '../../content/topics';
import type { LearnerState } from '../../store/types';
import { diffDays } from '../dates';
import { currentTopic, recommendProblem } from './adaptive';
import { topicLevel } from './mastery';

export interface SessionItem {
  id: string;
  kind: 'review' | 'concept' | 'predict' | 'practice' | 'challenge' | 'remedial' | 'comeback';
  title: string;
  detail: string;
  minutes: number;
  path: string;
}

export interface DailyPlan {
  mode: StudyMode;
  minutes: number;
  comeback: boolean;
  greeting: string;
  primary: SessionItem;
  items: SessionItem[];
  dueReviewCount: number;
  deferredReviewCount: number;
  topic: TopicId;
}

export const MODE_INFO: Record<StudyMode, { label: string; minutes: number; blurb: string; reviewCap: number }> = {
  minimum: { label: 'Minimum Day', minutes: 10, blurb: 'One small win. Keeps the habit alive.', reviewCap: 1 },
  normal: { label: 'Normal Day', minutes: 25, blurb: 'Revise, learn a bit, solve one problem.', reviewCap: 2 },
  deep: { label: 'Deep Focus', minutes: 50, blurb: 'Revise, learn, practise and stretch yourself.', reviewCap: 3 },
};

type S = Pick<LearnerState, 'profile' | 'topics' | 'attempts' | 'reviews' | 'remedials' | 'lastActiveDate'>;

/** Builds "what should I do today?" with one clear primary task. */
export function buildDailyPlan(state: S, mode: StudyMode, today: string): DailyPlan {
  const info = MODE_INFO[mode];
  const gap = state.lastActiveDate ? diffDays(state.lastActiveDate, today) : 0;
  const comeback = gap >= 3;
  const topic = currentTopic(state);
  const t = topicById(topic);
  const level = topicLevel(state, topic);
  const items: SessionItem[] = [];

  // Reviews: most overdue first, capped so a backlog never becomes a wall.
  const due = Object.values(state.reviews)
    .filter((r) => r.due <= today)
    .sort((a, b) => a.due.localeCompare(b.due) || b.lapses - a.lapses);
  const cap = comeback ? 1 : info.reviewCap;
  for (const r of due.slice(0, cap)) {
    const p = problemById(r.problemId);
    if (!p) continue;
    const overdue = diffDays(r.due, today);
    items.push({
      id: `review:${p.id}`,
      kind: 'review',
      title: `Recall: ${p.title}`,
      detail: overdue > 0 ? `Pattern: ${p.pattern}. Due ${overdue} day${overdue > 1 ? 's' : ''} ago, no stress.` : `Pattern: ${p.pattern}. Recall it before you forget.`,
      minutes: mode === 'minimum' ? 8 : 6,
      path: `/review/${p.id}`,
    });
  }

  const remedial = state.remedials.find((r) => !r.done);
  if (remedial && items.length < cap + 1) {
    const p = problemById(remedial.practiceProblem);
    if (p)
      items.push({
        id: `remedial:${remedial.id}`,
        kind: 'remedial',
        title: `Targeted practice: ${p.title}`,
        detail: remedial.reason,
        minutes: 8,
        path: `/practice/${p.id}?from=remedial`,
      });
  }

  const rec = recommendProblem(state, topic);
  if (comeback) {
    // Gentle restart: a short concept refresher, then an easy, familiar problem.
    items.unshift({
      id: 'comeback',
      kind: 'comeback',
      title: `Welcome back: 5-minute refresher on ${t.title}`,
      detail: 'Re-read the key idea and replay the visual. Nothing is overdue in a scary way; we will spread old reviews out.',
      minutes: 5,
      path: `/learn/${topic}`,
    });
  } else if (level === 0) {
    items.push({ id: 'concept', kind: 'concept', title: `Understand: ${t.title}`, detail: t.tagline, minutes: mode === 'minimum' ? 6 : 8, path: `/learn/${topic}` });
  }
  if (!comeback && Object.values(state.topics[topic]?.predict ?? {}).filter(Boolean).length < 2 && level === 0 && mode !== 'minimum') {
    items.push({ id: 'predict', kind: 'predict', title: `Predict the output: ${t.title}`, detail: 'Dry-run three tiny snippets.', minutes: 5, path: `/learn/${topic}#predict` });
  }

  if (rec) {
    const p = rec.problem;
    const isChallenge = p.level >= 5;
    items.push({
      id: `practice:${p.id}`,
      kind: isChallenge ? 'challenge' : 'practice',
      title: `${isChallenge ? 'Challenge' : 'Practice'}: ${p.title}`,
      detail: rec.reason,
      minutes: mode === 'minimum' ? 10 : 15,
      path: `/practice/${p.id}`,
    });
  } else if (topic === 'complexity' && level < 1) {
    items.push({ id: 'predict', kind: 'predict', title: 'Predict the complexity', detail: 'Three short snippets.', minutes: 6, path: `/learn/complexity#predict` });
  }

  if (mode === 'deep' && !comeback) {
    const challengeId = rec?.problem.transfer;
    const ch = challengeId ? problemById(challengeId) : undefined;
    if (ch && !items.some((i) => i.id === `practice:${ch.id}`))
      items.push({ id: `challenge:${ch.id}`, kind: 'challenge', title: `Stretch: ${ch.title}`, detail: 'Same idea in a new shape. Try it with zero hints first.', minutes: 15, path: `/practice/${ch.id}` });
  }

  // Fit to the time budget, always keeping at least one item.
  const fitted: SessionItem[] = [];
  let used = 0;
  for (const it of items) {
    if (fitted.length === 0 || used + it.minutes <= info.minutes + 3) {
      fitted.push(it);
      used += it.minutes;
    }
  }
  if (fitted.length === 0) {
    fitted.push({ id: 'concept', kind: 'concept', title: `Explore ${t.title}`, detail: t.tagline, minutes: 5, path: `/learn/${topic}` });
  }

  const name = state.profile.name ? `, ${state.profile.name}` : '';
  return {
    mode,
    minutes: info.minutes,
    comeback,
    greeting: comeback ? `Good to see you again${name}. Let's restart gently.` : `Here is today's plan${name}.`,
    primary: fitted[0],
    items: fitted,
    dueReviewCount: due.length,
    deferredReviewCount: Math.max(0, due.length - fitted.filter((i) => i.kind === 'review').length),
    topic,
  };
}
