import { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useStore } from '../store';
import { TOPICS } from '../content/topics';
import { problemById } from '../content/problems';
import { hintDependency, independentRate, topicLevel, LEVEL_NAMES } from '../lib/engine/mastery';
import { isSuccess } from '../lib/engine/srs';
import { lessonDemonstrated, MODULES } from '../lib/engine/course';
import { addDays, prettyDate, weekday } from '../lib/dates';
import { Card, Empty, LevelDots, Meter, OutcomeBadge, PageHeader } from '../components/ui';
import { OUTCOMES } from '../../shared/types';

const OUTCOME_COLORS: Record<string, string> = {
  independent: 'rgb(var(--good))',
  'small-hints': 'rgb(var(--accent))',
  guided: 'rgb(var(--warn))',
  'saw-solution': 'rgb(var(--bad) / 0.6)',
  unable: 'rgb(var(--bad))',
};

const weekStart = (d: string) => addDays(d, -((weekday(d) + 6) % 7));

function Stat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <Card className="p-4">
      <div className="text-xs uppercase tracking-wide text-muted">{label}</div>
      <div className="mt-1 text-2xl font-semibold tabular-nums">{value}</div>
      <div className="mt-1 text-xs text-muted">{hint}</div>
    </Card>
  );
}

export default function Progress() {
  const s = useStore();
  const today = s.today();
  const practice = s.attempts.filter((a) => a.kind !== 'review');
  const reviews = s.attempts.filter((a) => a.kind === 'review');
  const retention = reviews.length ? reviews.filter((a) => isSuccess(a.outcome)).length / reviews.length : 0;
  const thisWeek = weekStart(today);

  const weekly = useMemo(() => {
    const weeks = Array.from({ length: 8 }, (_, i) => addDays(thisWeek, -7 * (7 - i)));
    return weeks.map((w) => {
      const row: Record<string, number | string> = { week: prettyDate(w).replace(/^\w+, /, '') };
      const inWeek = s.attempts.filter((a) => weekStart(a.date) === w);
      for (const o of OUTCOMES) row[o.id] = inWeek.filter((a) => a.outcome === o.id).length;
      row.hints = inWeek.length ? Number(hintDependency(inWeek).toFixed(2)) : 0;
      row.minutes = Object.entries(s.activity)
        .filter(([d]) => weekStart(d) === w)
        .reduce((x, [, m]) => x + m, 0);
      return row;
    });
  }, [s.attempts, s.activity, thisWeek]);

  const topicStats = TOPICS.map((t) => {
    const at = s.attempts.filter((a) => problemById(a.problemId)?.topic === t.id);
    return { t, level: topicLevel(s, t.id), n: at.length, rate: independentRate(at), weakness: at.length ? at.filter((a) => !isSuccess(a.outcome)).length / at.length : 0 };
  });
  const weak = topicStats.filter((x) => x.n >= 2 && x.weakness >= 0.5).sort((a, b) => b.weakness - a.weakness);

  const conf = practice.filter((a) => a.confidenceBefore && a.confidenceAfter);
  const confDelta = conf.length ? conf.reduce((x, a) => x + (a.confidenceAfter! - a.confidenceBefore!), 0) / conf.length : 0;

  return (
    <div className="space-y-6">
      <PageHeader title="Progress" subtitle="What matters is solving on your own and remembering it later. Watching, reading and copying aren't counted here." />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Independent solve rate" value={`${Math.round(independentRate(practice) * 100)}%`} hint={`${practice.filter((a) => a.outcome === 'independent').length} of ${practice.length} practice attempts`} />
        <Stat label="Hint dependency" value={hintDependency(practice).toFixed(1)} hint="Average support per attempt (hints, mentor, solution). Lower over time is the goal." />
        <Stat label="Revision retention" value={reviews.length ? `${Math.round(retention * 100)}%` : '—'} hint={`${reviews.length} recall sessions`} />
        <Stat label="Confidence change" value={conf.length ? `${confDelta > 0 ? '+' : ''}${confDelta.toFixed(1)}` : '—'} hint="Average after minus before, per problem" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="h2 mb-3">Attempts by outcome, last 8 weeks</h2>
          {s.attempts.length === 0 ? (
            <Empty>Solve a problem to see this fill in.</Empty>
          ) : (
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={weekly}>
                  <CartesianGrid stroke="rgb(var(--line))" vertical={false} />
                  <XAxis dataKey="week" tick={{ fill: 'rgb(var(--muted))', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fill: 'rgb(var(--muted))', fontSize: 11 }} axisLine={false} tickLine={false} width={24} />
                  <Tooltip contentStyle={{ background: 'rgb(var(--surface))', border: '1px solid rgb(var(--line))', borderRadius: 12, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  {OUTCOMES.map((o) => (
                    <Bar key={o.id} dataKey={o.id} name={o.short} stackId="a" fill={OUTCOME_COLORS[o.id]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
        <Card>
          <h2 className="h2 mb-3">Hint dependency and study minutes</h2>
          {s.attempts.length === 0 ? (
            <Empty>No data yet.</Empty>
          ) : (
            <div className="h-64">
              <ResponsiveContainer>
                <LineChart data={weekly}>
                  <CartesianGrid stroke="rgb(var(--line))" vertical={false} />
                  <XAxis dataKey="week" tick={{ fill: 'rgb(var(--muted))', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="h" tick={{ fill: 'rgb(var(--muted))', fontSize: 11 }} axisLine={false} tickLine={false} width={28} />
                  <YAxis yAxisId="m" orientation="right" tick={{ fill: 'rgb(var(--muted))', fontSize: 11 }} axisLine={false} tickLine={false} width={32} />
                  <Tooltip contentStyle={{ background: 'rgb(var(--surface))', border: '1px solid rgb(var(--line))', borderRadius: 12, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line yAxisId="h" dataKey="hints" name="Avg support" stroke="rgb(var(--warn))" strokeWidth={2} dot={false} />
                  <Line yAxisId="m" dataKey="minutes" name="Minutes" stroke="rgb(var(--accent))" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="h2 mb-3">Topic mastery</h2>
          <ul className="space-y-2.5">
            {topicStats.map(({ t, level, n, rate }) => (
              <li key={t.id} className="flex items-center gap-3 text-sm">
                <span className="w-44 truncate">{t.title}</span>
                <LevelDots level={level} />
                <span className="hidden text-xs text-muted sm:inline">{LEVEL_NAMES[level]}</span>
                <span className="ml-auto text-xs text-muted">{n ? `${Math.round(rate * 100)}% independent` : '—'}</span>
              </li>
            ))}
          </ul>
          {weak.length > 0 && (
            <p className="mt-4 rounded-lg border border-warn/40 bg-warn/5 p-3 text-sm">
              Weak spots: <strong>{weak.map((w) => w.t.title).join(', ')}</strong>. The daily plan steps down to bridge exercises there automatically.
            </p>
          )}
        </Card>
        <Card>
          <h2 className="h2 mb-3">Namaste DSA milestones</h2>
          <ul className="space-y-3">
            {MODULES.filter((m) => m.count > 0 && m.order <= 21).map((m) => {
              const lessons = s.courseLessons.filter((l) => l.module === m.order);
              const watched = lessons.filter((l) => s.lessonStatus[l.key]?.watched).length;
              const shown = lessons.filter((l) => lessonDemonstrated(s, l)).length;
              if (!lessons.length) return null;
              return (
                <li key={m.order} className="text-sm">
                  <div className="mb-1 flex justify-between">
                    <span>
                      {m.order}. {m.name}
                    </span>
                    <span className="text-xs text-muted">
                      {watched}/{lessons.length} watched · {shown} shown
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    <Meter value={watched} max={lessons.length} label={`${m.name} watched`} />
                    <Meter value={shown} max={lessons.length} tone="good" label={`${m.name} understanding shown`} />
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      </div>

      <Reflection />

      <Card>
        <h2 className="h2 mb-3">Learning history</h2>
        {s.attempts.length === 0 ? (
          <Empty>Your attempts will be listed here.</Empty>
        ) : (
          <ul className="divide-y divide-line text-sm">
            {[...s.attempts]
              .reverse()
              .slice(0, 30)
              .map((a) => (
                <li key={a.id} className="flex flex-wrap items-center gap-3 py-2">
                  <span className="w-24 text-xs text-muted">{prettyDate(a.date)}</span>
                  <span className="min-w-0 flex-1 truncate">{problemById(a.problemId)?.title}</span>
                  <span className="chip">{a.kind}</span>
                  <span className="text-xs text-muted">{a.hintsUsed} hints</span>
                  <OutcomeBadge outcome={a.outcome} />
                </li>
              ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function Reflection() {
  const s = useStore();
  const wk = weekStart(s.today());
  const existing = s.reflections.find((r) => r.weekOf === wk);
  const [wentWell, setWentWell] = useState(existing?.wentWell ?? '');
  const [hard, setHard] = useState(existing?.hard ?? '');
  const [nextFocus, setNextFocus] = useState(existing?.nextFocus ?? '');
  const [saved, setSaved] = useState(false);
  return (
    <Card className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="h2">Weekly reflection</h2>
        <span className="text-xs text-muted">Week of {prettyDate(wk)}</span>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <label>
          <span className="label">What went well?</span>
          <textarea className="input min-h-[80px]" value={wentWell} onChange={(e) => setWentWell(e.target.value)} />
        </label>
        <label>
          <span className="label">What felt hard?</span>
          <textarea className="input min-h-[80px]" value={hard} onChange={(e) => setHard(e.target.value)} />
        </label>
        <label>
          <span className="label">One focus for next week</span>
          <textarea className="input min-h-[80px]" value={nextFocus} onChange={(e) => setNextFocus(e.target.value)} />
        </label>
      </div>
      <div className="flex items-center gap-3">
        <button
          className="btn-primary"
          onClick={() => {
            s.addReflection({ weekOf: wk, wentWell, hard, nextFocus });
            setSaved(true);
          }}
        >
          Save reflection
        </button>
        {saved && <span className="text-sm text-good">Saved.</span>}
      </div>
      {s.reflections.filter((r) => r.weekOf !== wk).slice(0, 3).map((r) => (
        <details key={r.weekOf} className="text-sm text-muted">
          <summary className="cursor-pointer">Week of {prettyDate(r.weekOf)}</summary>
          <p className="mt-1">Went well: {r.wentWell || '—'}</p>
          <p>Hard: {r.hard || '—'}</p>
          <p>Focus: {r.nextFocus || '—'}</p>
        </details>
      ))}
    </Card>
  );
}
