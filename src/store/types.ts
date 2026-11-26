import type { Outcome, StudyMode, TopicId } from '../../shared/types';
import type { ReviewItem } from '../lib/engine/srs';

export interface Profile {
  name: string;
  onboarded: boolean;
  experience: 'new' | 'some' | 'rusty';
  /** Last Namaste DSA module (order number) the learner has reached in the videos. 0 = not started. */
  namasteModule: number;
  struggles: string[];
  defaultMode: StudyMode;
  startTopic: TopicId;
}

export interface TopicProgress {
  understood: boolean;
  visualized: boolean;
  predict: Record<string, boolean>;
}

export interface Attempt {
  id: string;
  problemId: string;
  at: string; // ISO timestamp
  date: string; // local YYYY-MM-DD
  kind: 'practice' | 'review' | 'transfer';
  outcome: Outcome;
  hintsUsed: number;
  mentorSteps: number;
  sawSolution: boolean;
  testsPassed: number;
  testsTotal: number;
  confidenceBefore?: number;
  confidenceAfter?: number;
  durationSec: number;
}

export interface Draft {
  code: string;
  updatedAt: string;
  hintsRevealed: number;
  mentorSteps: number;
  sawSolution: boolean;
  confidenceBefore?: number;
  startedAt: string;
}

export type MistakeCategory =
  | 'could-not-start'
  | 'wrong-pattern'
  | 'edge-case'
  | 'off-by-one'
  | 'forgot-key-idea'
  | 'syntax'
  | 'other';

export interface Mistake {
  id: string;
  problemId: string;
  at: string;
  category: MistakeCategory;
  note: string;
  resolved: boolean;
}

export interface Remedial {
  id: string;
  forProblem: string;
  practiceProblem: string;
  reason: string;
  createdAt: string;
  done: boolean;
}

export interface CourseLesson {
  key: string; // stable id: module order + slug
  module: number;
  moduleName: string;
  title: string;
  slug: string;
  url?: string;
  source: 'public-syllabus' | 'imported';
}

export interface LessonStatus {
  watched: boolean;
  watchedAt?: string;
  tooHard?: boolean;
}

export interface ScheduleSettings {
  days: number[]; // 0..6
  time: string; // HH:MM
  duration: number; // minutes
  timeZone: string;
  reminderMinutes: number[];
}

export interface Reflection {
  weekOf: string;
  wentWell: string;
  hard: string;
  nextFocus: string;
  at: string;
}

export interface LearnerState {
  profile: Profile;
  topics: Partial<Record<TopicId, TopicProgress>>;
  attempts: Attempt[];
  drafts: Record<string, Draft>;
  reviews: Record<string, ReviewItem>;
  remedials: Remedial[];
  mistakes: Mistake[];
  courseLessons: CourseLesson[];
  lessonStatus: Record<string, LessonStatus>;
  schedule: ScheduleSettings;
  /** Daily plan: day number → date it was finished. */
  planDone: Record<number, string>;
  /** Daily plan step checkboxes, keyed `day:stepIndex`. */
  planChecks: Record<string, boolean>;
  reflections: Reflection[];
  activity: Record<string, number>; // date → minutes
  lastActiveDate?: string;
  resume?: { path: string; label: string; at: string };
  theme: 'dark' | 'light';
}
