import { Link } from 'react-router-dom';
import { useStore } from '../store';
import { problemById } from '../content/problems';
import { Card, Empty, PageHeader, OutcomeBadge } from '../components/ui';
import { diffDays, prettyDate } from '../lib/dates';

export default function ReviewList() {
  const s = useStore();
  const today = s.today();
  const items = Object.values(s.reviews).sort((a, b) => a.due.localeCompare(b.due));
  const due = items.filter((r) => r.due <= today);
  const later = items.filter((r) => r.due > today);
  return (
    <div className="space-y-6">
      <PageHeader title="Revise" subtitle="Active recall beats re-reading. Each review asks you to rebuild the approach from memory, explain the pattern, dry-run it, write it, and try a variation." />
      <Card>
        <h2 className="h2 mb-3">Due now {due.length > 0 && <span className="text-muted">({due.length})</span>}</h2>
        {due.length === 0 ? (
          <Empty>Nothing due. Solved problems will show up here on day 1, 3, 5, 7 and 14, then adapt to how well you remember.</Empty>
        ) : (
          <ul className="space-y-2">
            {due.slice(0, 3).map((r) => {
              const p = problemById(r.problemId)!;
              const late = diffDays(r.due, today);
              return (
                <li key={r.problemId}>
                  <Link to={`/review/${p.id}`} className="flex items-center justify-between gap-3 rounded-xl border border-line p-3 hover:bg-raised">
                    <div>
                      <div className="text-sm font-medium">{p.title}</div>
                      <div className="text-xs text-muted">
                        {p.pattern} · {late > 0 ? `due ${late} day${late > 1 ? 's' : ''} ago` : 'due today'} · review #{r.history.length}
                      </div>
                    </div>
                    <span className="btn-primary">Recall</span>
                  </Link>
                </li>
              );
            })}
            {due.length > 3 && <li className="text-xs text-muted">+{due.length - 3} more. Start with these; the rest can wait a day or two without harm.</li>}
          </ul>
        )}
      </Card>
      <Card>
        <h2 className="h2 mb-3">Coming up</h2>
        {later.length === 0 ? (
          <Empty>No upcoming reviews yet.</Empty>
        ) : (
          <ul className="divide-y divide-line">
            {later.map((r) => {
              const p = problemById(r.problemId)!;
              const last = r.history[r.history.length - 1];
              return (
                <li key={r.problemId} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <span>{p.title}</span>
                  <span className="flex items-center gap-2 text-xs text-muted">
                    {last && <OutcomeBadge outcome={last.outcome} />}
                    {prettyDate(r.due)} · every ~{r.intervalDays}d
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
