// Shared domain types for DSA Companion (client + server).

export type TopicId =
  | 'loops'
  | 'complexity'
  | 'arrays'
  | 'two-pointers'
  | 'recursion'
  | 'binary-search'
  | 'strings'
  | 'hashing'
  | 'sliding-window';

/** How a problem attempt or revision went. Ordered from strongest to weakest. */
export type Outcome = 'independent' | 'small-hints' | 'guided' | 'saw-solution' | 'unable';

export const OUTCOMES: { id: Outcome; label: string; short: string }[] = [
  { id: 'independent', label: 'Solved independently', short: 'Independent' },
  { id: 'small-hints', label: 'Solved with small hints', short: 'Small hints' },
  { id: 'guided', label: 'Solved with substantial guidance', short: 'Guided' },
  { id: 'saw-solution', label: 'Understood after seeing the solution', short: 'Saw solution' },
  { id: 'unable', label: 'Unable to solve', short: 'Unable' },
];

/**
 * Learning levels from the spec.
 * 0 intuition, 1 predict/dry-run, 2 tiny exercises, 3 easy with guidance,
 * 4 related problems independently, 5 course-level challenge, 6 unfamiliar variation after days.
 */
export type Level = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type StudyMode = 'minimum' | 'normal' | 'deep';
