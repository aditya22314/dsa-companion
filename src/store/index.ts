import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { TopicId } from '../../shared/types';
import { problemById } from '../content/problems';
import { scheduleReview, isFailure } from '../lib/engine/srs';
import { todayIn } from '../lib/dates';
import { publicSyllabusLessons } from '../lib/engine/course';
import { initialState } from './initial';
import type {
  Attempt,
  CourseLesson,
  Draft,
  LearnerState,
  MistakeCategory,
  Profile,
  Reflection,
  ScheduleSettings,
} from './types';

export const STORAGE_KEY = 'dsa-companion-v1';

const uid = () => (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2));

export interface Actions {
  today: () => string;
  completeOnboarding: (p: Partial<Profile>, schedule?: Partial<ScheduleSettings>) => void;
  updateProfile: (p: Partial<Profile>) => void;
  markTopic: (topic: TopicId, field: 'understood' | 'visualized') => void;
  answerPredict: (topic: TopicId, questionId: string, correct: boolean) => void;
  saveDraft: (problemId: string, patch: Partial<Draft>) => void;
  clearDraft: (problemId: string) => void;
  recordAttempt: (a: Omit<Attempt, 'id' | 'at' | 'date'>, extras?: { missingIdea?: MistakeCategory; note?: string }) => Attempt;
  addMistake: (m: { problemId: string; category: MistakeCategory; note: string }) => void;
  toggleMistake: (id: string) => void;
  deleteMistake: (id: string) => void;
  completeRemedial: (practiceProblem: string) => void;
  setLessonWatched: (key: string, watched: boolean) => void;
  setLessonTooHard: (key: string, tooHard: boolean) => void;
  importLessons: (lessons: CourseLesson[], mode: 'replace' | 'merge') => void;
  resetLessons: () => void;
  updateSchedule: (s: Partial<ScheduleSettings>) => void;
  togglePlanStep: (day: number, step: number) => void;
  setPlanDayDone: (day: number, done: boolean) => void;
  addReflection: (r: Omit<Reflection, 'at'>) => void;
  logMinutes: (minutes: number) => void;
  setResume: (path: string, label: string) => void;
  setTheme: (t: 'dark' | 'light') => void;
  importAll: (data: LearnerState) => void;
  resetAll: () => void;
}

export type Store = LearnerState & Actions;

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      ...initialState(),
      today: () => todayIn(get().schedule.timeZone),

      completeOnboarding: (p, schedule) =>
        set((s) => ({
          profile: { ...s.profile, ...p, onboarded: true },
          schedule: { ...s.schedule, ...schedule },
          lastActiveDate: get().today(),
        })),
      updateProfile: (p) => set((s) => ({ profile: { ...s.profile, ...p } })),

      markTopic: (topic, field) =>
        set((s) => ({
          topics: { ...s.topics, [topic]: { understood: false, visualized: false, predict: {}, ...s.topics[topic], [field]: true } },
          lastActiveDate: get().today(),
        })),
      answerPredict: (topic, qid, correct) =>
        set((s) => {
          const tp = { understood: false, visualized: false, predict: {}, ...s.topics[topic] };
          // Keep a correct answer once earned; a wrong first try can be retried.
          return { topics: { ...s.topics, [topic]: { ...tp, predict: { ...tp.predict, [qid]: tp.predict[qid] || correct } } }, lastActiveDate: get().today() };
        }),

      saveDraft: (problemId, patch) =>
        set((s) => {
          const prev = s.drafts[problemId];
          const now = new Date().toISOString();
          const base: Draft = prev ?? {
            code: problemById(problemId)?.starterCode ?? '',
            hintsRevealed: 0,
            mentorSteps: 0,
            sawSolution: false,
            startedAt: now,
            updatedAt: now,
          };
          const next: Draft = { ...base, ...patch, updatedAt: now };
          return { drafts: { ...s.drafts, [problemId]: next } };
        }),
      clearDraft: (problemId) =>
        set((s) => {
          const d = { ...s.drafts };
          delete d[problemId];
          return { drafts: d };
        }),

      recordAttempt: (a, extras) => {
        const today = get().today();
        const attempt: Attempt = { ...a, id: uid(), at: new Date().toISOString(), date: today };
        set((s) => {
          const reviews = { ...s.reviews, [a.problemId]: scheduleReview(s.reviews[a.problemId], a.problemId, a.outcome, today) };
          const remedials = [...s.remedials];
          const mistakes = [...s.mistakes];
          if (isFailure(a.outcome)) {
            const p = problemById(a.problemId);
            const bridge = p?.bridges.find((b) => b !== a.problemId) ?? p?.id;
            if (p && bridge && !remedials.some((r) => !r.done && r.forProblem === p.id)) {
              const why = extras?.missingIdea ? MISSING_IDEA_TEXT[extras.missingIdea] : 'the key step';
              remedials.push({
                id: uid(),
                forProblem: p.id,
                practiceProblem: bridge,
                reason: `Rebuilds ${why} needed for "${p.title}". You will retry "${p.title}" tomorrow.`,
                createdAt: today,
                done: false,
              });
            }
          }
          if (extras?.missingIdea) mistakes.unshift({ id: uid(), problemId: a.problemId, at: today, category: extras.missingIdea, note: extras.note ?? '', resolved: false });
          return {
            attempts: [...s.attempts, attempt],
            reviews,
            remedials,
            mistakes,
            lastActiveDate: today,
            activity: { ...s.activity, [today]: (s.activity[today] ?? 0) + Math.max(1, Math.round(a.durationSec / 60)) },
          };
        });
        if (a.outcome === 'independent' || a.outcome === 'small-hints') get().completeRemedial(a.problemId);
        return attempt;
      },

      addMistake: (m) => set((s) => ({ mistakes: [{ id: uid(), at: get().today(), resolved: false, ...m }, ...s.mistakes] })),
      toggleMistake: (id) => set((s) => ({ mistakes: s.mistakes.map((m) => (m.id === id ? { ...m, resolved: !m.resolved } : m)) })),
      deleteMistake: (id) => set((s) => ({ mistakes: s.mistakes.filter((m) => m.id !== id) })),
      completeRemedial: (practiceProblem) =>
        set((s) => ({ remedials: s.remedials.map((r) => (r.practiceProblem === practiceProblem && !r.done ? { ...r, done: true } : r)) })),

      setLessonWatched: (key, watched) =>
        set((s) => ({ lessonStatus: { ...s.lessonStatus, [key]: { ...s.lessonStatus[key], watched, watchedAt: watched ? get().today() : undefined } } })),
      setLessonTooHard: (key, tooHard) => set((s) => ({ lessonStatus: { ...s.lessonStatus, [key]: { ...(s.lessonStatus[key] ?? { watched: false }), tooHard } } })),
      importLessons: (lessons, mode) =>
        set((s) => ({
          courseLessons: mode === 'replace' ? lessons : [...new Map([...s.courseLessons, ...lessons].map((l) => [l.key, l])).values()].sort((a, b) => a.module - b.module),
        })),
      resetLessons: () => set({ courseLessons: publicSyllabusLessons() }),

      updateSchedule: (patch) => set((s) => ({ schedule: { ...s.schedule, ...patch } })),
      togglePlanStep: (day, step) =>
        set((s) => {
          const key = `${day}:${step}`;
          const planChecks = { ...s.planChecks };
          if (planChecks[key]) delete planChecks[key];
          else planChecks[key] = true;
          return { planChecks };
        }),
      setPlanDayDone: (day, done) =>
        set((s) => {
          const planDone = { ...s.planDone };
          if (done) planDone[day] = get().today();
          else delete planDone[day];
          return { planDone, lastActiveDate: done ? get().today() : s.lastActiveDate };
        }),

      addReflection: (r) => set((s) => ({ reflections: [{ ...r, at: new Date().toISOString() }, ...s.reflections.filter((x) => x.weekOf !== r.weekOf)] })),
      logMinutes: (minutes) => {
        const today = get().today();
        set((s) => ({ activity: { ...s.activity, [today]: (s.activity[today] ?? 0) + minutes }, lastActiveDate: today }));
      },
      setResume: (path, label) => set({ resume: { path, label, at: new Date().toISOString() } }),
      setTheme: (theme) => set({ theme }),
      importAll: (data) => set({ ...initialState(), ...data }),
      resetAll: () => set(initialState()),
    }),
    {
      name: STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => {
        const { courseLessons, ...rest } = s;
        // Do not bloat storage with the bundled public syllabus; only store imported lists.
        const imported = courseLessons.some((l) => l.source === 'imported');
        return Object.fromEntries(Object.entries({ ...rest, courseLessons: imported ? courseLessons : undefined }).filter(([, v]) => typeof v !== 'function')) as Partial<Store>;
      },
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<LearnerState>;
        const { sessions: _old, ...rest } = p as Partial<LearnerState> & { sessions?: unknown };
        void _old;
        return { ...current, ...rest, courseLessons: p.courseLessons?.length ? p.courseLessons : current.courseLessons, schedule: { ...current.schedule, ...p.schedule } };
      },
    },
  ),
);

export const MISSING_IDEA_TEXT: Record<MistakeCategory, string> = {
  'could-not-start': 'how to start (restating the problem and finding a brute force)',
  'wrong-pattern': 'recognising which pattern fits',
  'edge-case': 'handling edge cases',
  'off-by-one': 'loop boundaries and indexes',
  'forgot-key-idea': 'the key idea of the pattern',
  syntax: 'JavaScript details',
  other: 'the missing step',
};

export const MISTAKE_LABELS: Record<MistakeCategory, string> = {
  'could-not-start': "Couldn't start",
  'wrong-pattern': 'Wrong pattern',
  'edge-case': 'Missed edge case',
  'off-by-one': 'Off-by-one / boundaries',
  'forgot-key-idea': 'Forgot the key idea',
  syntax: 'JS syntax / API',
  other: 'Other',
};

