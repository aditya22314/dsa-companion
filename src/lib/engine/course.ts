import syllabus from '../../../shared/namasteSyllabus.json';
import { PROBLEMS } from '../../content/problems';
import { TOPICS } from '../../content/topics';
import type { Problem } from '../../content/types';
import type { TopicId } from '../../../shared/types';
import type { CourseLesson, LearnerState } from '../../store/types';
import { bestOutcome, topicLevel } from './mastery';
import { QUALITY } from './srs';

export const SYLLABUS_SOURCE = { url: syllabus.source, retrievedOn: syllabus.retrievedOn, note: syllabus.note };

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export function publicSyllabusLessons(): CourseLesson[] {
  return syllabus.modules.flatMap((m) =>
    m.lessons.map((l) => ({
      key: `${m.order}:${l.slug}`,
      module: m.order,
      moduleName: m.name,
      title: l.title,
      slug: l.slug,
      url: l.url,
      source: 'public-syllabus' as const,
    })),
  );
}

export const MODULES = syllabus.modules.map((m) => ({ order: m.order, name: m.name, count: m.lessons.length }));

/**
 * Parses a pasted lesson list. Accepted formats:
 *  - "Module name" header lines starting with "#" or ending with ":" followed by lesson lines
 *  - "Module name > Lesson title" or "Module name | Lesson title" per line
 *  - a JSON array of {module, title} or {moduleName, title}
 */
export function parseLessonImport(text: string): CourseLesson[] {
  const trimmed = text.trim();
  if (!trimmed) return [];
  const known = new Map(syllabus.modules.map((m) => [m.name.toLowerCase(), m.order]));
  const moduleOrder = (name: string, fallback: number) => known.get(name.toLowerCase()) ?? fallback;
  const out: CourseLesson[] = [];
  const add = (moduleName: string, title: string, idx: number) => {
    const order = moduleOrder(moduleName, 100 + idx);
    const slug = slugify(title);
    if (!slug) return;
    out.push({ key: `${order}:${slug}`, module: order, moduleName, title: title.trim(), slug, source: 'imported' });
  };
  if (trimmed.startsWith('[')) {
    const arr = JSON.parse(trimmed) as { module?: string; moduleName?: string; title: string }[];
    const names: string[] = [];
    for (const r of arr) {
      const name = (r.moduleName ?? r.module ?? 'Imported').trim();
      if (!names.includes(name)) names.push(name);
      add(name, r.title, names.indexOf(name));
    }
    return dedupe(out);
  }
  let current = 'Imported';
  const names: string[] = [];
  for (const raw of trimmed.split(/\r?\n/)) {
    const line = raw.replace(/^\s*[-*\d.)]+\s*/, '').trim();
    if (!line) continue;
    const pair = line.split(/\s*(?:>|\|)\s*/);
    if (pair.length === 2) {
      if (!names.includes(pair[0])) names.push(pair[0]);
      add(pair[0], pair[1], names.indexOf(pair[0]));
      continue;
    }
    if (raw.trim().startsWith('#') || line.endsWith(':')) {
      current = line.replace(/^#+\s*/, '').replace(/:$/, '').replace(/^\d+\s*/, '').trim();
      if (!names.includes(current)) names.push(current);
      continue;
    }
    add(current, line, names.indexOf(current));
  }
  return dedupe(out);
}

const dedupe = (ls: CourseLesson[]) => [...new Map(ls.map((l) => [l.key, l])).values()];

/** Topics in this app that support a Namaste module. */
export function topicsForModule(module: number): TopicId[] {
  return TOPICS.filter((t) => t.namasteModules.includes(module)).map((t) => t.id);
}

/** Supplementary practice problems related to a lesson: exact slug links first, then fuzzy title match. */
export function problemsForLesson(lesson: Pick<CourseLesson, 'slug' | 'title'>): Problem[] {
  const exact = PROBLEMS.filter((p) => p.namasteLessons.includes(lesson.slug));
  if (exact.length) return exact.sort((a, b) => a.level - b.level);
  const words = slugify(lesson.title).split('-').filter((w) => w.length > 3);
  return PROBLEMS.filter((p) => p.namasteLessons.some((s) => words.some((w) => s.includes(w)))).slice(0, 3);
}

/**
 * Demonstrated understanding of a lesson, separate from "watched".
 * A lesson counts as demonstrated when a linked problem was solved with at most small hints,
 * or (for lessons without linked practice) the related topic reached level 3.
 */
export function lessonDemonstrated(state: Pick<LearnerState, 'attempts' | 'topics' | 'reviews'>, lesson: CourseLesson): boolean {
  const probs = problemsForLesson(lesson);
  if (probs.length) return probs.some((p) => {
    const b = bestOutcome(state, p.id);
    return !!b && QUALITY[b] >= 4;
  });
  const topics = topicsForModule(lesson.module);
  return topics.length > 0 && topics.every((t) => topicLevel(state, t) >= 3);
}
