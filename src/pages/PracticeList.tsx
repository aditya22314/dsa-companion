import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useStore } from '../store';
import { PROBLEMS } from '../content/problems';
import { TOPICS } from '../content/topics';
import { bestOutcome } from '../lib/engine/mastery';
import { Card, OutcomeBadge, PageHeader, cx } from '../components/ui';
import type { TopicId } from '../../shared/types';

export default function PracticeList() {
  const s = useStore();
  const [topic, setTopic] = useState<TopicId | 'all'>('all');
  const list = PROBLEMS.filter((p) => topic === 'all' || p.topic === topic);
  return (
    <div>
      <PageHeader title="Practice" subtitle={`${PROBLEMS.length} original, beginner-friendly problems with real tests, progressive hints and dry runs. Quality over quantity.`} />
      <div className="mb-4 flex flex-wrap gap-1.5">
        {[{ id: 'all', title: 'All' }, ...TOPICS.filter((t) => PROBLEMS.some((p) => p.topic === t.id))].map((t) => (
          <button key={t.id} onClick={() => setTopic(t.id as TopicId | 'all')} className={cx('rounded-full border px-3 py-1 text-sm', topic === t.id ? 'border-accent bg-accent/15' : 'border-line text-muted')}>
            {t.title}
          </button>
        ))}
      </div>
      <Card className="p-0">
        <ul className="divide-y divide-line">
          {list.map((p) => {
            const b = bestOutcome(s, p.id);
            const draft = s.drafts[p.id];
            return (
              <li key={p.id}>
                <Link to={`/practice/${p.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-raised/60">
                  <span className="w-14 shrink-0 text-xs text-muted">Level {p.level}</span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium">{p.title}</div>
                    <div className="truncate text-xs text-muted">
                      {TOPICS.find((t) => t.id === p.topic)!.title} · {p.pattern}
                    </div>
                  </div>
                  {draft && !b && <span className="chip">in progress</span>}
                  {b ? <OutcomeBadge outcome={b} /> : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </Card>
    </div>
  );
}
