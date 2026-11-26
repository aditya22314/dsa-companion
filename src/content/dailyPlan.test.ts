import syllabus from '../../shared/namasteSyllabus.json';
import { DAILY_PLAN, PLAN_WEEKS } from './dailyPlan';
import { problemById } from './problems';
import { topicById } from './topics';

const lessonsIn = (module: number) => syllabus.modules.find((m) => m.order === module)?.lessons.map((l) => l.slug) ?? [];

describe('daily plan', () => {
  it('numbers days 1..N in order with valid weeks', () => {
    DAILY_PLAN.forEach((d, i) => {
      expect(d.day).toBe(i + 1);
      expect(PLAN_WEEKS.some((w) => w.week === d.week)).toBe(true);
    });
  });

  it('gives every day at least one core step', () => {
    for (const d of DAILY_PLAN) expect(d.steps.some((s) => s.core)).toBe(true);
  });

  it('only references real problems, topics and public lessons', () => {
    for (const d of DAILY_PLAN)
      for (const s of d.steps) {
        if (s.kind === 'problem') expect(problemById(s.problemId), `${d.day} ${s.problemId}`).toBeTruthy();
        if (s.kind === 'learn') expect(topicById(s.topic)).toBeTruthy();
        if (s.kind === 'namaste') for (const slug of s.slugs) expect(lessonsIn(s.module), `day ${d.day}: ${slug}`).toContain(slug);
      }
  });

  it('puts a "try first" attempt before the matching lesson on the same day', () => {
    for (const d of DAILY_PLAN) {
      const tryIdx = d.steps.findIndex((s) => s.kind === 'problem' && s.how === 'try-first');
      if (tryIdx < 0) continue;
      const lessonIdx = d.steps.findIndex((s) => s.kind === 'namaste' && s.core);
      expect(tryIdx, `day ${d.day}`).toBeLessThan(lessonIdx);
    }
  });

  it('covers every lesson of Namaste modules 1-6 and 8, and the binary search module', () => {
    const planned = new Set(DAILY_PLAN.flatMap((d) => d.steps.flatMap((s) => (s.kind === 'namaste' ? s.slugs.map((x) => `${s.module}:${x}`) : []))));
    for (const m of [1, 2, 3, 4, 5, 6, 8, 10]) for (const slug of lessonsIn(m)) expect(planned, `${m}:${slug}`).toContain(`${m}:${slug}`);
  });

  it('schedules a review day every fifth day', () => {
    for (const d of DAILY_PLAN) expect(!!d.review).toBe(d.day % 5 === 0);
  });
});
