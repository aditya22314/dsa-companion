import { DEFAULT_TZ } from '../lib/dates';
import { publicSyllabusLessons } from '../lib/engine/course';
import type { LearnerState } from './types';

export const initialState = (): LearnerState => ({
  profile: {
    name: '',
    onboarded: false,
    experience: 'some',
    namasteModule: 0,
    struggles: [],
    defaultMode: 'normal',
    startTopic: 'loops',
  },
  topics: {},
  attempts: [],
  drafts: {},
  reviews: {},
  remedials: [],
  mistakes: [],
  courseLessons: publicSyllabusLessons(),
  lessonStatus: {},
  schedule: {
    days: [1, 2, 3, 4, 5],
    time: '20:00',
    duration: 25,
    timeZone: DEFAULT_TZ,
    reminderMinutes: [15],
    calendarMode: 'dedicated',
    checkAvailability: false,
  },
  sessions: [],
  reflections: [],
  activity: {},
  theme: 'dark',
});
