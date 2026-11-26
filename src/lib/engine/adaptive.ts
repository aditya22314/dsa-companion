import type { Outcome, TopicId } from '../../../shared/types';
import { PROBLEMS, problemById, problemsForTopic } from '../../content/problems';
import { TOPICS, topicById } from '../../content/topics';
import type { Problem } from '../../content/types';
import type { LearnerState } from '../../store/types';
import { QUALITY } from './srs';
import { bestOutcome, topicLevel } from './mastery';

export interface Recommendation {
  problem: Problem;
  reason: string;
  direction: 'easier' | 'same' | 'harder' | 'start';
}

type S = Pick<LearnerState, 'topics' | 'attempts' | 'reviews'>;

const weak = (o: Outcome) => QUALITY[o] <= 3;

/**
 * Suggest an outcome from evidence. The learner may pick a weaker outcome but never a stronger one,
 * so recognising or copying a solution is never recorded as mastery.
 */
export function suggestOutcome(e: { hintsUsed: number; mentorSteps: number; sawSolution: boolean; allPassed: boolean }): Outcome {
  if (e.sawSolution) return e.allPassed ? 'saw-solution' : 'unable';
  if (!e.allPassed) return 'unable';
  const support = e.hintsUsed + Math.floor(e.mentorSteps / 2);
  if (support === 0) return 'independent';
  if (support <= 2) return 'small-hints';
  return 'guided';
}

export function maxAllowedOutcome(e: Parameters<typeof suggestOutcome>[0]): Outcome {
  return suggestOutcome(e);
}

/** Pick the next problem for a topic, adapting difficulty to recent performance. */
export function recommendProblem(state: S, topic: TopicId): Recommendation | undefined {
  const probs = problemsForTopic(topic);
  if (!probs.length) return undefined;
  const recent = state.attempts.filter((a) => problemById(a.problemId)?.topic === topic).slice(-3);
  const solvedIndependently = (p: Problem) => bestOutcome(state, p.id) === 'independent';
  const unsolved = probs.filter((p) => !solvedIndependently(p));

  if (recent.length === 0) {
    return { problem: probs[0], reason: 'Start with the smallest building block for this topic.', direction: 'start' };
  }

  const last = recent[recent.length - 1];
  const lastProblem = problemById(last.problemId)!;
  const lastTwoWeak = recent.length >= 2 && recent.slice(-2).every((a) => weak(a.outcome));
  const lastTwoStrong = recent.length >= 2 && recent.slice(-2).every((a) => a.outcome === 'independent');

  if (lastTwoWeak || QUALITY[last.outcome] <= 2) {
    const bridge = lastProblem.bridges.map(problemById).find((p): p is Problem => !!p && !solvedIndependently(p));
    if (bridge) return { problem: bridge, reason: `"${lastProblem.title}" was tough. "${bridge.title}" practises the missing step first.`, direction: 'easier' };
    const easier = probs.find((p) => p.level < lastProblem.level && !solvedIndependently(p));
    if (easier) return { problem: easier, reason: 'Stepping down one level to rebuild the idea.', direction: 'easier' };
    // Retry the same problem later is fine, but suggest a solved one to rebuild confidence.
    const confidence = probs.find((p) => p.level <= lastProblem.level && p.id !== lastProblem.id);
    if (confidence) return { problem: confidence, reason: 'A familiar problem to rebuild momentum before retrying.', direction: 'easier' };
  }

  if (lastTwoStrong) {
    const harder = unsolved.find((p) => p.level > lastProblem.level);
    if (harder) return { problem: harder, reason: 'Two independent solves in a row, so the next one is a step harder.', direction: 'harder' };
  }

  const next = unsolved.find((p) => p.id !== last.problemId) ?? unsolved[0];
  if (next) return { problem: next, reason: 'Next problem at your current level.', direction: 'same' };
  return { problem: probs[probs.length - 1], reason: 'You have solved every problem here independently. Revisit the hardest one.', direction: 'same' };
}

/** Topic to focus on: the first topic in course order that is not yet at level 4, respecting the onboarding start. */
export function currentTopic(state: S & Pick<LearnerState, 'profile'>): TopicId {
  const start = topicById(state.profile.startTopic).order;
  const open = TOPICS.filter((t) => t.order >= start).find((t) => topicLevel(state, t.id) < (t.id === 'complexity' ? 1 : 4));
  return open?.id ?? TOPICS[TOPICS.length - 1].id;
}

/** When a course-level problem is too hard: missing prerequisite skills and bridge exercises. */
export function diagnosePrerequisites(state: S, problemIds: string[]) {
  const problems = problemIds.map(problemById).filter((p): p is Problem => !!p);
  const topics = new Set<TopicId>();
  for (const p of problems) {
    topics.add(p.topic);
    for (const pre of topicById(p.topic).prerequisites) topics.add(pre);
  }
  const weakTopics = [...topics].filter((t) => topicLevel(state, t) < (t === 'complexity' ? 1 : 3));
  const bridgeIds = new Set<string>();
  for (const p of problems) {
    for (const b of p.bridges) bridgeIds.add(b);
    bridgeIds.add(p.id);
  }
  const bridges = [...bridgeIds]
    .map(problemById)
    .filter((p): p is Problem => !!p && bestOutcome(state, p.id) !== 'independent')
    .sort((a, b) => a.level - b.level);
  return { weakTopics, bridges };
}

export const ALL_PROBLEM_COUNT = PROBLEMS.length;
