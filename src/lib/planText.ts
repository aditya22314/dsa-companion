import syllabus from '../../shared/namasteSyllabus.json';
import type { PlanStep } from '../content/dailyPlan';
import { problemById } from '../content/problems';
import { topicById } from '../content/topics';

export const lessonInfo = (module: number, slug: string) => {
  const m = syllabus.modules.find((x) => x.order === module);
  const l = m?.lessons.find((x) => x.slug === slug);
  return { module, moduleName: m?.name ?? `Module ${module}`, title: l?.title ?? slug, url: l?.url ?? syllabus.source, key: `${module}:${slug}` };
};

export const STEP_MINUTES: Record<PlanStep['kind'], number> = { learn: 10, problem: 15, namaste: 20, own: 10 };

const HOW: Record<'try-first' | 'practice' | 'from-memory', string> = {
  'try-first': 'Try first, before the lesson',
  practice: 'Practice',
  'from-memory': 'Re-solve from memory',
};

export const HOW_DETAIL: Record<'try-first' | 'practice' | 'from-memory', string> = {
  'try-first': 'Give it 10–15 honest minutes before watching. Getting stuck is the point: the lesson will then answer your question.',
  practice: 'Solve it in the playground. Wait 5 minutes before opening a hint.',
  'from-memory': 'Clear the editor, no hints, no peeking. If you cannot, that is useful information: read the solution once, then try again tomorrow.',
};

/** A plain-text label for a step, used by both the page and the markdown doc. */
export function stepLabel(step: PlanStep): { tag: string; title: string; detail?: string; path?: string; href?: string } {
  switch (step.kind) {
    case 'learn': {
      const t = topicById(step.topic);
      return { tag: 'Warm up in the app', title: `Learn › ${t.title}`, detail: step.what, path: `/learn/${t.id}` };
    }
    case 'problem': {
      const p = problemById(step.problemId);
      return { tag: HOW[step.how], title: p?.title ?? step.problemId, detail: step.note ?? HOW_DETAIL[step.how], path: `/practice/${step.problemId}` };
    }
    case 'namaste': {
      const ls = step.slugs.map((s) => lessonInfo(step.module, s));
      return {
        tag: `Namaste DSA · ${ls[0].moduleName}`,
        title: ls.map((l) => l.title).join(' + '),
        detail: step.note,
        href: ls[0].url,
      };
    }
    case 'own':
      return { tag: 'On your own', title: step.text };
  }
}
