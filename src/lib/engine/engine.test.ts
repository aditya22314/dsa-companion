import { buildDailyPlan } from './planner';
import { recommendProblem, suggestOutcome, diagnosePrerequisites } from './adaptive';
import { topicLevel } from './mastery';
import { buildWeekPlan, isIncomplete, suggestReschedule } from './weekly';
import { parseLessonImport, problemsForLesson, lessonDemonstrated, publicSyllabusLessons } from './course';
import { initialState } from '../../store/initial';
import type { Attempt, LearnerState } from '../../store/types';
import type { Outcome } from '../../../shared/types';

const attempt = (problemId: string, outcome: Outcome, date = '2026-12-01'): Attempt => ({
  id: Math.random().toString(36),
  problemId,
  outcome,
  at: `${date}T10:00:00Z`,
  date,
  kind: 'practice',
  hintsUsed: 0,
  mentorSteps: 0,
  sawSolution: false,
  testsPassed: 1,
  testsTotal: 1,
  durationSec: 60,
});

const base = (): LearnerState => ({ ...initialState(), profile: { ...initialState().profile, onboarded: true, name: 'A' } });

describe('outcome honesty', () => {
  it('never counts a viewed solution as independent', () => {
    expect(suggestOutcome({ hintsUsed: 0, mentorSteps: 0, sawSolution: true, allPassed: true })).toBe('saw-solution');
    expect(suggestOutcome({ hintsUsed: 0, mentorSteps: 0, sawSolution: false, allPassed: true })).toBe('independent');
    expect(suggestOutcome({ hintsUsed: 1, mentorSteps: 0, sawSolution: false, allPassed: true })).toBe('small-hints');
    expect(suggestOutcome({ hintsUsed: 4, mentorSteps: 0, sawSolution: false, allPassed: true })).toBe('guided');
  });
});

describe('mastery', () => {
  it('watching or reading alone keeps level 0', () => {
    const s = base();
    s.topics.arrays = { understood: true, visualized: true, predict: {} };
    expect(topicLevel(s, 'arrays')).toBe(0);
  });
  it('rises only with demonstrated evidence', () => {
    const s = base();
    s.topics.arrays = { understood: true, visualized: true, predict: { 'arr-p1': true, 'arr-p2': true } };
    expect(topicLevel(s, 'arrays')).toBe(1);
    s.attempts.push(attempt('find-max', 'small-hints'));
    expect(topicLevel(s, 'arrays')).toBe(2);
    s.attempts.push(attempt('second-largest', 'small-hints'));
    expect(topicLevel(s, 'arrays')).toBe(3);
    s.attempts.push(attempt('max-consecutive-ones', 'independent'));
    expect(topicLevel(s, 'arrays')).toBe(4);
  });
});

describe('adaptive difficulty', () => {
  it('suggests an easier bridge after struggling', () => {
    const s = base();
    s.attempts.push(attempt('second-largest', 'unable'));
    const r = recommendProblem(s, 'arrays')!;
    expect(r.direction).toBe('easier');
    expect(r.problem.id).toBe('find-max');
  });
  it('steps up after two independent solves', () => {
    const s = base();
    s.attempts.push(attempt('find-max', 'independent'), attempt('count-greater', 'independent'));
    const r = recommendProblem(s, 'arrays')!;
    expect(r.direction).toBe('harder');
    expect(r.problem.level).toBeGreaterThan(2);
  });
  it('diagnoses missing prerequisites for a hard course problem', () => {
    const d = diagnosePrerequisites(base(), ['best-profit']);
    expect(d.bridges.map((p) => p.id)).toContain('find-max');
    expect(d.weakTopics).toContain('arrays');
  });
});

describe('daily plan', () => {
  it('gives one primary task and respects the time budget', () => {
    const s = base();
    const plan = buildDailyPlan(s, 'minimum', '2026-12-01');
    expect(plan.primary).toBeDefined();
    expect(plan.items.reduce((a, i) => a + i.minutes, 0)).toBeLessThanOrEqual(13);
  });
  it('caps reviews so a backlog never piles up', () => {
    const s = base();
    for (const id of ['find-max', 'count-greater', 'sum-to-n', 'count-digits', 'factorial']) {
      s.reviews[id] = { problemId: id, stage: 0, intervalDays: 1, ease: 2.5, due: '2026-11-20', lastReviewed: '2026-11-19', lapses: 0, history: [] };
    }
    const plan = buildDailyPlan({ ...s, lastActiveDate: '2026-11-30' }, 'normal', '2026-12-01');
    expect(plan.items.filter((i) => i.kind === 'review')).toHaveLength(2);
    expect(plan.deferredReviewCount).toBe(3);
  });
  it('creates a gentle comeback session after missed days', () => {
    const s = { ...base(), lastActiveDate: '2026-11-20' };
    s.reviews['find-max'] = { problemId: 'find-max', stage: 0, intervalDays: 1, ease: 2.5, due: '2026-11-21', lastReviewed: '2026-11-20', lapses: 0, history: [] };
    s.reviews['sum-to-n'] = { ...s.reviews['find-max'], problemId: 'sum-to-n' };
    const plan = buildDailyPlan(s, 'deep', '2026-12-01');
    expect(plan.comeback).toBe(true);
    expect(plan.primary.kind).toBe('comeback');
    expect(plan.items.filter((i) => i.kind === 'review').length).toBeLessThanOrEqual(1);
  });
});

describe('weekly plan and missed sessions', () => {
  const settings = { days: [1, 3, 5], time: '19:00', duration: 25, timeZone: 'Asia/Kolkata', reminderMinutes: [15], calendarMode: 'dedicated' as const, checkAvailability: false };
  it('schedules at most one session per preferred day with stable keys', () => {
    const plan = buildWeekPlan(base(), settings, '2026-11-30'); // Monday
    expect(plan.map((p) => p.date)).toEqual(['2026-11-30', '2026-12-02', '2026-12-04']);
    expect(new Set(plan.map((p) => p.key)).size).toBe(plan.length);
    expect(plan[0].title).toMatch(/^DSA Study: /);
  });
  it('pulls reviews into study days instead of adding extra events', () => {
    const s = base();
    s.reviews['find-max'] = { problemId: 'find-max', stage: 0, intervalDays: 1, ease: 2.5, due: '2026-12-01', lastReviewed: '2026-11-30', lapses: 0, history: [] };
    const plan = buildWeekPlan(s, settings, '2026-11-30');
    expect(plan.find((p) => p.date === '2026-12-02')!.reviewIds).toContain('find-max');
  });
  it('does not treat a passed session as completed', () => {
    const [first] = buildWeekPlan(base(), settings, '2026-11-30');
    const approved = { ...first, status: 'approved' as const };
    expect(isIncomplete(approved, '2026-11-30', '20:00')).toBe(true);
    expect(isIncomplete({ ...approved, status: 'completed' }, '2026-12-01', '10:00')).toBe(false);
    const slot = suggestReschedule(approved, settings, '2026-11-30', '20:00', ['2026-11-30']);
    expect(slot.date > '2026-11-30').toBe(true);
  });
});

describe('Namaste course companion', () => {
  it('loads the public syllabus', () => {
    const ls = publicSyllabusLessons();
    expect(ls.length).toBeGreaterThan(200);
    expect(ls.every((l) => l.source === 'public-syllabus')).toBe(true);
  });
  it('imports a pasted lesson list', () => {
    const ls = parseLessonImport('# Warm Up\nSecond Largest\nCount Digit\nArrays - Easy/Medium > Move Zeros');
    expect(ls.map((l) => l.title)).toEqual(['Second Largest', 'Count Digit', 'Move Zeros']);
    expect(ls[0].module).toBe(2);
    expect(ls[2].module).toBe(4);
  });
  it('links lessons to practice and separates watched from demonstrated', () => {
    const lesson = publicSyllabusLessons().find((l) => l.slug === 'second-largest')!;
    expect(problemsForLesson(lesson).map((p) => p.id)).toContain('second-largest');
    const s = base();
    s.lessonStatus[lesson.key] = { watched: true };
    expect(lessonDemonstrated(s, lesson)).toBe(false);
    s.attempts.push(attempt('second-largest', 'independent'));
    expect(lessonDemonstrated(s, lesson)).toBe(true);
  });
});
