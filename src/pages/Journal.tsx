import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore, MISTAKE_LABELS } from '../store';
import { PROBLEMS, problemById } from '../content/problems';
import { Card, Empty, PageHeader, cx } from '../components/ui';
import { prettyDate } from '../lib/dates';
import type { MistakeCategory } from '../store/types';

export default function Journal() {
  const s = useStore();
  const [filter, setFilter] = useState<MistakeCategory | 'all'>('all');
  const [showResolved, setShowResolved] = useState(false);
  const [problemId, setProblemId] = useState(PROBLEMS[0].id);
  const [category, setCategory] = useState<MistakeCategory>('edge-case');
  const [note, setNote] = useState('');
  const list = s.mistakes.filter((m) => (filter === 'all' || m.category === filter) && (showResolved || !m.resolved));
  const counts = s.mistakes.reduce<Record<string, number>>((a, m) => ((a[m.category] = (a[m.category] ?? 0) + 1), a), {});
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  const openRemedials = s.remedials.filter((r) => !r.done);

  return (
    <div className="space-y-6">
      <PageHeader title="Mistake journal" subtitle="Mistakes are data. Patterns in them show exactly what to practise next." />
      {top && (
        <Card className="text-sm">
          Your most common slip is <strong>{MISTAKE_LABELS[top[0] as MistakeCategory]}</strong> ({top[1]}×). Before submitting, spend 30 seconds checking for exactly that.
        </Card>
      )}

      {openRemedials.length > 0 && (
        <Card>
          <h2 className="h2 mb-2">Targeted practice waiting</h2>
          <ul className="space-y-2">
            {openRemedials.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="text-muted">{r.reason}</span>
                <Link to={`/practice/${r.practiceProblem}?from=remedial`} className="btn-soft">
                  {problemById(r.practiceProblem)?.title}
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card className="space-y-3">
        <h2 className="h2">Add an entry</h2>
        <div className="grid gap-2 sm:grid-cols-[1fr_1fr_2fr_auto]">
          <select className="input" value={problemId} onChange={(e) => setProblemId(e.target.value)} aria-label="Problem">
            {PROBLEMS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
          <select className="input" value={category} onChange={(e) => setCategory(e.target.value as MistakeCategory)} aria-label="Category">
            {Object.entries(MISTAKE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
          <input className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="What happened, and what to do next time" aria-label="Note" />
          <button
            className="btn-primary"
            disabled={!note.trim()}
            onClick={() => {
              s.addMistake({ problemId, category, note: note.trim() });
              setNote('');
            }}
          >
            Add
          </button>
        </div>
      </Card>

      <div className="flex flex-wrap items-center gap-1.5">
        {(['all', ...Object.keys(MISTAKE_LABELS)] as (MistakeCategory | 'all')[]).map((k) => (
          <button key={k} onClick={() => setFilter(k)} className={cx('rounded-full border px-3 py-1 text-xs', filter === k ? 'border-accent bg-accent/15' : 'border-line text-muted')}>
            {k === 'all' ? 'All' : MISTAKE_LABELS[k]} {k !== 'all' && counts[k] ? `(${counts[k]})` : ''}
          </button>
        ))}
        <label className="ml-auto flex items-center gap-2 text-xs text-muted">
          <input type="checkbox" checked={showResolved} onChange={(e) => setShowResolved(e.target.checked)} /> show resolved
        </label>
      </div>

      {list.length === 0 ? (
        <Empty>No entries yet. When an attempt goes badly, the app asks what was missing and logs it here.</Empty>
      ) : (
        <ul className="space-y-2">
          {list.map((m) => (
            <li key={m.id} className={cx('card flex flex-wrap items-start gap-3 p-4', m.resolved && 'opacity-60')}>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <Link to={`/practice/${m.problemId}`} className="font-medium hover:text-accent">
                    {problemById(m.problemId)?.title ?? m.problemId}
                  </Link>
                  <span className="chip">{MISTAKE_LABELS[m.category]}</span>
                  <span className="text-xs text-muted">{prettyDate(m.at)}</span>
                </div>
                {m.note && <p className="mt-1 text-sm text-muted">{m.note}</p>}
              </div>
              <button className="btn-soft text-xs" onClick={() => s.toggleMistake(m.id)}>
                {m.resolved ? 'Reopen' : 'Mark learned'}
              </button>
              <button className="btn-ghost text-xs text-muted" onClick={() => s.deleteMistake(m.id)} aria-label="Delete entry">
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
