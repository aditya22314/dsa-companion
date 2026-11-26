import { Link } from 'react-router-dom';
import { useStore } from '../store';
import { TOPICS } from '../content/topics';
import { problemsForTopic } from '../content/problems';
import { topicLevel, LEVEL_NAMES } from '../lib/engine/mastery';
import { currentTopic } from '../lib/engine/adaptive';
import { Card, LevelDots, PageHeader, Tag, cx } from '../components/ui';

export const SEQUENCE = ['Understand', 'Visualize', 'Predict', 'Easy practice', 'Guided practice', 'Independent', 'Course-level', 'Revision'];

export default function Learn() {
  const s = useStore();
  const current = currentTopic(s);
  return (
    <div>
      <PageHeader
        title="Learning roadmap"
        subtitle="Topics follow the public Namaste DSA order. Each one moves through the same steps, and your level only rises when you demonstrate it."
      />
      <div className="mb-6 flex flex-wrap items-center gap-1.5 text-xs text-muted">
        {SEQUENCE.map((x, i) => (
          <span key={x} className="flex items-center gap-1.5">
            <span className="chip">{x}</span>
            {i < SEQUENCE.length - 1 && <span aria-hidden>→</span>}
          </span>
        ))}
      </div>
      <ol className="grid gap-4 md:grid-cols-2">
        {TOPICS.map((t) => {
          const lvl = topicLevel(s, t.id);
          const probs = problemsForTopic(t.id);
          const locked = t.prerequisites.some((p) => topicLevel(s, p) < 2) && lvl === 0;
          return (
            <li key={t.id}>
              <Link to={`/learn/${t.id}`} className="block h-full">
                <Card className={cx('h-full transition-colors hover:border-accent/50', current === t.id && 'border-accent/60')}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-xs text-muted">Step {t.order}</div>
                      <h2 className="text-base font-semibold">{t.title}</h2>
                    </div>
                    {current === t.id ? <Tag tone="supplementary">current</Tag> : locked ? <span className="chip">prerequisites first</span> : null}
                  </div>
                  <p className="mt-1 text-sm text-muted">{t.tagline}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <LevelDots level={lvl} />
                      <span className="text-xs text-muted">{LEVEL_NAMES[lvl]}</span>
                    </div>
                    <span className="text-xs text-muted">
                      {probs.length ? `${probs.length} problems` : 'concept'} · Namaste module {t.namasteModules.join(', ')}
                    </span>
                  </div>
                </Card>
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
