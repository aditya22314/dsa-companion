import type { Level, TopicId } from '../../shared/types';

export type VizId =
  | 'loop-trace'
  | 'array-scan'
  | 'two-pointers'
  | 'recursion-stack'
  | 'binary-search'
  | 'hash-map'
  | 'sliding-window'
  | 'complexity-growth';

export interface PredictQuestion {
  id: string;
  code: string;
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
}

export interface Topic {
  id: TopicId;
  order: number;
  title: string;
  tagline: string;
  /** Public Namaste DSA module numbers this topic supports. */
  namasteModules: number[];
  prerequisites: TopicId[];
  /** Level 0: intuition with analogies. */
  intuition: string[];
  analogy: string;
  keyIdea: string;
  /** "When you see X, think of this pattern" cues for pattern recognition. */
  recognitionCues: string[];
  visualization: VizId;
  vizInput: number[] | string;
  predict: PredictQuestion[];
  complexityNote: string;
}

export interface TestCase {
  args: unknown[];
  expected: unknown;
  /** Hidden tests run on "Run Tests" but their inputs are shown only after failure. */
  hidden?: boolean;
  /** For in-place problems: also check that argument `index` starts with `expected`. */
  argCheck?: { index: number; expected: unknown[] };
  /** Compare arrays ignoring order (e.g. grouping problems). */
  unordered?: boolean;
}

export interface MentorScript {
  /** What the inputs/outputs are, revealed when the learner asks. */
  io: string;
  edgeCases: string[];
  bruteForce: string;
  patternNudge: string;
  pseudocode: string[];
  commonMistakes: string[];
}

export interface Problem {
  id: string;
  topic: TopicId;
  title: string;
  level: Exclude<Level, 0 | 1 | 6>;
  pattern: string;
  statement: string;
  examples: { input: string; output: string; explanation?: string }[];
  constraints: string[];
  functionName: string;
  starterCode: string;
  tests: TestCase[];
  /** Progressive hints, weakest first. The full solution is separate. */
  hints: string[];
  solution: string;
  solutionExplanation: string;
  complexity: { time: string; space: string; why: string };
  /** Easier bridge exercises to try first if this feels too hard. */
  bridges: string[];
  /** A different problem using the same idea, used for transfer during revision. */
  transfer?: string;
  /** Public Namaste DSA lesson slugs this problem prepares you for (supplementary). */
  namasteLessons: string[];
  mentor: MentorScript;
  dryRun?: { viz: VizId; input: number[] | string; target?: number };
}
