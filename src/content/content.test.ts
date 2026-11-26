import { PROBLEMS, problemById } from './problems';
import { TOPICS } from './topics';
import { compileUserFunction, evaluate } from '../lib/judge';
import syllabus from '../../shared/namasteSyllabus.json';

const slugs = new Set(syllabus.modules.flatMap((m) => m.lessons.map((l) => l.slug)));

describe('curated content', () => {
  it('has unique problem ids', () => {
    expect(new Set(PROBLEMS.map((p) => p.id)).size).toBe(PROBLEMS.length);
  });

  it.each(PROBLEMS.map((p) => [p.id, p] as const))('reference solution for %s passes all its tests', (_id, p) => {
    const fn = compileUserFunction(p.solution, p.functionName);
    const results = evaluate(fn, p.tests);
    expect(results.filter((r) => !r.passed)).toEqual([]);
  });

  it.each(PROBLEMS.map((p) => [p.id, p] as const))('starter code for %s fails at least one test', (_id, p) => {
    const fn = compileUserFunction(p.starterCode, p.functionName);
    expect(evaluate(fn, p.tests).some((r) => !r.passed)).toBe(true);
  });

  it('every problem has 4 progressive hints and valid references', () => {
    for (const p of PROBLEMS) {
      expect(p.hints).toHaveLength(4);
      expect(p.tests.some((t) => t.hidden)).toBe(true);
      for (const b of p.bridges) expect(problemById(b), `${p.id} bridge ${b}`).toBeDefined();
      if (p.transfer) expect(problemById(p.transfer), `${p.id} transfer`).toBeDefined();
      for (const s of p.namasteLessons) expect(slugs.has(s), `${p.id} lesson ${s}`).toBe(true);
    }
  });

  it('bridges are never harder than the problem they support', () => {
    for (const p of PROBLEMS) for (const b of p.bridges) expect(problemById(b)!.level).toBeLessThanOrEqual(p.level);
  });

  it('every topic has predict questions with valid answers', () => {
    for (const t of TOPICS) {
      expect(t.predict.length).toBeGreaterThanOrEqual(2);
      for (const q of t.predict) expect(q.options[q.answerIndex]).toBeDefined();
    }
  });
});
