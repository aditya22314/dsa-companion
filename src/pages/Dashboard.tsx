import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../store';
import { buildDailyPlan, MODE_INFO, type SessionItem } from '../lib/engine/planner';
import { topicLevel, LEVEL_NAMES } from '../lib/engine/mastery';
import { isIncomplete } from '../lib/engine/weekly';
import { addDays, timeIn, weekday } from '../lib/dates';
import { topicById } from '../content/topics';
import { Card, LevelDots, Meter, cx } from '../components/ui';
import type { StudyMode } from '../../shared/types';

const KIND_LABEL: Record<SessionItem['kind'], string> = {
  review: 'Revision',
  concept: 'New concept',
  predict: 'Predict',
  practice: 'Practice',
  challenge: 'Independent challenge',
  remedial: 'Targeted practice',
  comeback: 'Gentle restart',
};

export default function Dashboard() {
  const s = useStore();
  const today = s.today();
  const [mode, setMode] = useState<StudyMode>(s.profile.defaultMode);
  const plan = useMemo(() => buildDailyPlan(s, mode, today), [s, mode, today]);
  const topic = topicById(plan.topic);
  const level = topicLevel(s, plan.topic);
  const minutesToday = s.activity[today] ?? 0;
  const now = timeIn(s.schedule.timeZone);
  const missed = s.sessions.filter((x) => isIncomplete(x, today, now));

  // Gentle habit view: this week's study days, no streak counter.
  const startOfWeek = addDays(today, -((weekday(today) + 6) % 7));
  const week = Array.from({ length: 7 }, (_, i) => addDays(startOfWeek, i));
  const daysThisWeek = week.filter((d) => (s.activity[d] ?? 0) > 0).length;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', timeZone: s.schedule.timeZone })}</p>
          <h1 className="h1 mt-1">{plan.greeting}</h1>
        </div>
        <div className="flex rounded-xl border border-line bg-surface p-1" role="radiogroup" aria-label="Study mode">
          {(Object.keys(MODE_INFO) as StudyMode[]).map((m) => (
            <button key={m} role="radio" aria-checked={mode === m} onClick={() => setMode(m)} className={cx('rounded-lg px-3 py-1.5 text-sm', mode === m ? 'bg-accent text-white' : 'text-muted hover:text-ink')}>
              {MODE_INFO[m].label.split(' ')[0]} <span className="opacity-70">{MODE_INFO[m].minutes}m</span>
            </button>
          ))}
        </div>
      </header>

      {s.resume && s.resume.path !== '/' && (
        <Link to={s.resume.path} className="card flex items-center justify-between gap-3 p-4 hover:border-accent/50">
          <div>
            <div className="text-xs uppercase tracking-wide text-muted">Pick up where you left off</div>
            <div className="text-sm font-medium">{s.resume.label}</div>
          </div>
          <span className="btn-soft">Resume →</span>
        </Link>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-4">
          <Card className="relative overflow-hidden border-accent/40 p-6">
            <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-accent/20 blur-3xl" />
            <div className="text-xs font-medium uppercase tracking-wide text-accent">Today's main task · {KIND_LABEL[plan.primary.kind]}</div>
            <h2 className="mt-2 text-xl font-semibold">{plan.primary.title}</h2>
            <p className="mt-1 text-sm text-muted">{plan.primary.detail}</p>
            <div className="mt-5 flex items-center gap-3">
              <Link to={plan.primary.path} className="btn-primary px-5 py-2.5" onClick={() => s.setResume(plan.primary.path, plan.primary.title)}>
                Start · {plan.primary.minutes} min
              </Link>
              <span className="text-xs text-muted">That is enough for a {MODE_INFO[mode].label.toLowerCase()}. Everything below is optional.</span>
            </div>
          </Card>

          {plan.items.length > 1 && (
            <Card>
              <h3 className="h2 mb-3">Then, if you have time</h3>
              <ol className="space-y-2">
                {plan.items.slice(1).map((it, idx) => (
                  <li key={it.id}>
                    <Link to={it.path} className="flex items-center gap-3 rounded-xl border border-line p-3 hover:bg-raised" onClick={() => s.setResume(it.path, it.title)}>
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-raised text-xs text-muted">{idx + 2}</span>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium">{it.title}</div>
                        <div className="truncate text-xs text-muted">{it.detail}</div>
                      </div>
                      <span className="chip">{KIND_LABEL[it.kind]}</span>
                      <span className="text-xs text-muted">{it.minutes}m</span>
                    </Link>
                  </li>
                ))}
              </ol>
            </Card>
          )}

          {plan.deferredReviewCount > 0 && (
            <p className="rounded-xl border border-line bg-surface/60 p-3 text-sm text-muted">
              {plan.deferredReviewCount} more review{plan.deferredReviewCount > 1 ? 's are' : ' is'} waiting. They will come up over the next few days, a couple at a time. No need to clear them today.
            </p>
          )}

          {missed.length > 0 && (
            <Link to="/schedule" className="block rounded-xl border border-warn/40 bg-warn/5 p-3 text-sm">
              <span className="font-medium text-warn">A planned session didn't happen.</span> <span className="text-muted">That's fine. Pick a new time in one click →</span>
            </Link>
          )}
        </div>

        <div className="space-y-4">
          <Card>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Today</h3>
              <span className="text-xs text-muted">
                {minutesToday} / {MODE_INFO[mode].minutes} min
              </span>
            </div>
            <div className="mt-2">
              <Meter value={minutesToday} max={MODE_INFO[mode].minutes} tone={minutesToday >= MODE_INFO[mode].minutes ? 'good' : 'accent'} />
            </div>
            <div className="mt-4 flex justify-between" aria-label={`Studied ${daysThisWeek} days this week`}>
              {week.map((d) => (
                <div key={d} className="flex flex-col items-center gap-1">
                  <span className={cx('h-6 w-6 rounded-md', (s.activity[d] ?? 0) > 0 ? 'bg-good/70' : d === today ? 'border border-accent' : 'bg-raised')} />
                  <span className="text-[10px] text-muted">{['M', 'T', 'W', 'T', 'F', 'S', 'S'][week.indexOf(d)]}</span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted">{daysThisWeek === 0 ? 'A fresh week. One small session is a great start.' : `You studied on ${daysThisWeek} day${daysThisWeek > 1 ? 's' : ''} this week.`}</p>
          </Card>

          <Card>
            <div className="text-xs uppercase tracking-wide text-muted">Current topic</div>
            <Link to={`/learn/${topic.id}`} className="mt-1 block text-base font-semibold hover:text-accent">
              {topic.title}
            </Link>
            <div className="mt-2 flex items-center gap-2">
              <LevelDots level={level} />
              <span className="text-xs text-muted">
                Level {level}: {LEVEL_NAMES[level]}
              </span>
            </div>
            <p className="mt-3 text-sm text-muted">{topic.keyIdea}</p>
            {topic.namasteModules.length > 0 && (
              <Link to="/course" className="mt-3 inline-block text-xs text-accent hover:underline">
                Supports Namaste DSA module {topic.namasteModules.join(', ')} →
              </Link>
            )}
          </Card>

          <div className="grid grid-cols-2 gap-3 md:hidden">
            {[
              ['/course', 'Namaste DSA'],
              ['/journal', 'Mistakes'],
              ['/schedule', 'Schedule'],
              ['/settings', 'Settings'],
            ].map(([to, l]) => (
              <Link key={to} to={to} className="btn-ghost">
                {l}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
