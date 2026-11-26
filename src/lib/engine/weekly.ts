import { problemById } from '../../content/problems';
import { topicById } from '../../content/topics';
import type { LearnerState, PlannedSession, ScheduleSettings, SessionKind } from '../../store/types';
import { addDays, addMinutesToTime, toMinutes, weekday } from '../dates';
import { currentTopic, recommendProblem } from './adaptive';
import { bestOutcome, topicLevel } from './mastery';
import { problemsForTopic } from '../../content/problems';

type S = Pick<LearnerState, 'profile' | 'topics' | 'attempts' | 'reviews' | 'remedials' | 'sessions'>;

export const sessionKey = (date: string) => `study:${date}`;

const KIND_ROTATION: SessionKind[] = ['new', 'practice', 'review', 'practice', 'challenge', 'practice', 'review'];

/**
 * Builds a draft plan for the next 7 days: at most one session per preferred day.
 * Reviews due on non-study days are pulled into the next study day, so the calendar never overloads.
 */
export function buildWeekPlan(state: S, settings: ScheduleSettings, startDate: string): PlannedSession[] {
  const topic = currentTopic(state);
  const t = topicById(topic);
  const level = topicLevel(state, topic);
  const rec = recommendProblem(state, topic);
  const reviews = Object.values(state.reviews);
  const missedLastWeek = state.sessions.some((s) => s.status === 'approved' && s.date < startDate && s.date >= addDays(startDate, -7));

  const studyDates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = addDays(startDate, i);
    if (settings.days.includes(weekday(d))) studyDates.push(d);
  }

  let pendingReviews: string[] = reviews.filter((r) => r.due < startDate).map((r) => r.problemId);
  // Practice queue: the adaptive recommendation first, then other unsolved problems in level order.
  const queue = [rec?.problem, ...problemsForTopic(topic).filter((p) => p.id !== rec?.problem.id && bestOutcome(state, p.id) !== 'independent')].filter(
    (p): p is NonNullable<typeof p> => !!p,
  );
  let practiceIdx = 0;
  const sessions: PlannedSession[] = [];
  studyDates.forEach((date, idx) => {
    const prevDate = idx === 0 ? addDays(startDate, -1) : studyDates[idx - 1];
    const dueHere = reviews.filter((r) => r.due > prevDate && r.due <= date).map((r) => r.problemId);
    const reviewIds = [...new Set([...pendingReviews, ...dueHere])].slice(0, settings.duration >= 45 ? 3 : settings.duration >= 25 ? 2 : 1);
    pendingReviews = [...new Set([...pendingReviews, ...dueHere])].filter((id) => !reviewIds.includes(id));

    let kind: SessionKind = KIND_ROTATION[idx % KIND_ROTATION.length];
    if (idx === 0 && level === 0) kind = 'new';
    if (reviewIds.length >= 2 && kind !== 'new') kind = 'review';
    if (kind === 'review' && reviewIds.length === 0) kind = 'practice';
    if (kind === 'new' && idx > 0) kind = 'practice';
    if (missedLastWeek && idx === studyDates.length - 1 && studyDates.length >= 3) kind = 'recovery';

    const practice = kind === 'practice' ? (queue[practiceIdx++ % Math.max(1, queue.length)] ?? rec?.problem) : rec?.problem;
    const challenge = practice?.transfer ? problemById(practice.transfer) : undefined;
    const firstReview = reviewIds[0] ? problemById(reviewIds[0]) : undefined;

    let title: string;
    let objective: string;
    let link: string;
    let prep: string;
    switch (kind) {
      case 'new':
        title = `DSA Study: ${t.title} — core idea`;
        objective = `Understand and visualise ${t.title}, then predict the output of 3 snippets.`;
        link = `/learn/${topic}`;
        prep = 'No preparation needed. Have a notebook ready for the dry-runs.';
        break;
      case 'review':
        title = `DSA Revision: ${firstReview ? firstReview.title : t.title}`;
        objective = `Recall ${reviewIds.length} problem${reviewIds.length === 1 ? '' : 's'} from memory: approach, pattern, dry-run, code.`;
        link = firstReview ? `/review/${firstReview.id}` : '/review';
        prep = 'Do not look at old solutions before the session. Struggling to recall is what makes it stick.';
        break;
      case 'challenge':
        title = `DSA Challenge: ${t.title} — ${(challenge ?? practice)?.title ?? 'independent problem'}`;
        objective = 'Solve one problem with zero hints for the first 15 minutes.';
        link = `/practice/${(challenge ?? practice)?.id ?? ''}`;
        prep = `Re-read the "${t.title}" recognition cues for 2 minutes.`;
        break;
      case 'recovery':
        title = 'DSA Recovery: gentle catch-up';
        objective = 'A short, easy session to pick up anything missed this week. Optional.';
        link = '/';
        prep = 'Pick Minimum Day mode if energy is low. Showing up is the goal.';
        break;
      default:
        title = `DSA Study: ${t.title} — ${practice?.title ?? 'practice'}`;
        objective = practice ? `Solve "${practice.title}" (${practice.pattern}). Try first, then use hints one at a time.` : `Practise ${t.title}.`;
        link = practice ? `/practice/${practice.id}` : `/learn/${topic}`;
        prep = 'Restate the problem in your own words before writing code.';
    }
    if (reviewIds.length && kind !== 'review') objective += ` Plus ${reviewIds.length} quick recall${reviewIds.length > 1 ? 's' : ''}.`;

    const existing = state.sessions.find((s) => s.key === sessionKey(date));
    sessions.push({
      key: sessionKey(date),
      date,
      time: existing?.time ?? settings.time,
      duration: kind === 'recovery' ? Math.min(15, settings.duration) : settings.duration,
      kind,
      title,
      objective,
      prep,
      link,
      reviewIds,
      status: existing?.status === 'completed' ? 'completed' : 'draft',
      synced: existing?.synced,
    });
  });
  return sessions;
}

export function sessionEnd(s: Pick<PlannedSession, 'date' | 'time' | 'duration'>) {
  const end = addMinutesToTime(s.time, s.duration);
  return { date: addDays(s.date, end.dayOffset), time: end.time };
}

/** A session is incomplete only if its end has passed and the learner never marked it done. Time passing ≠ completion. */
export function isIncomplete(s: PlannedSession, today: string, nowTime: string): boolean {
  if (s.status !== 'approved') return false;
  const end = sessionEnd(s);
  return end.date < today || (end.date === today && toMinutes(end.time) <= toMinutes(nowTime));
}

/**
 * Suggest a new slot for a missed session: later today if there is room before 22:00, otherwise the next preferred day.
 * `busy` lists blocked ranges (from Google free/busy, when connected) as [date, startHH:MM, endHH:MM].
 */
export function suggestReschedule(
  s: PlannedSession,
  settings: ScheduleSettings,
  today: string,
  nowTime: string,
  taken: string[],
  busy: [string, string, string][] = [],
): { date: string; time: string } {
  const overlaps = (date: string, time: string) =>
    busy.some(([d, a, b]) => d === date && toMinutes(time) < toMinutes(b) && toMinutes(time) + s.duration > toMinutes(a));
  const roundUp = (t: string) => {
    const m = toMinutes(t) + 30;
    const r = Math.ceil(m / 30) * 30;
    return `${String(Math.floor(r / 60)).padStart(2, '0')}:${String(r % 60).padStart(2, '0')}`;
  };
  // Later today
  let candidate = roundUp(nowTime);
  for (let i = 0; i < 8 && toMinutes(candidate) + s.duration <= 22 * 60; i++) {
    if (!taken.includes(today) && !overlaps(today, candidate)) return { date: today, time: candidate };
    candidate = addMinutesToTime(candidate, 30).time;
  }
  for (let i = 1; i <= 14; i++) {
    const d = addDays(today, i);
    if (taken.includes(d)) continue;
    if (settings.days.includes(weekday(d)) || i >= 7) {
      if (!overlaps(d, settings.time)) return { date: d, time: settings.time };
      const alt = addMinutesToTime(settings.time, 60).time;
      if (!overlaps(d, alt)) return { date: d, time: alt };
    }
  }
  return { date: addDays(today, 1), time: settings.time };
}
