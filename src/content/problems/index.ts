import type { Problem } from '../types';
import type { TopicId } from '../../../shared/types';
import { FOUNDATION_PROBLEMS } from './foundations';
import { PATTERN_PROBLEMS } from './patterns';
import { LOOKUP_PROBLEMS } from './lookup';

export const PROBLEMS: Problem[] = [...FOUNDATION_PROBLEMS, ...PATTERN_PROBLEMS, ...LOOKUP_PROBLEMS];

const byId = new Map(PROBLEMS.map((p) => [p.id, p]));

export const problemById = (id: string): Problem | undefined => byId.get(id);

export const problemsForTopic = (topic: TopicId): Problem[] =>
  PROBLEMS.filter((p) => p.topic === topic).sort((a, b) => a.level - b.level);
