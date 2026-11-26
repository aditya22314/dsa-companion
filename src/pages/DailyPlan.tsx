import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useStore } from '../store';
import { AFTER_PLAN, DAILY_PLAN, PLAN_WEEKS, planDayByNumber, type PlanDay } from '../content/dailyPlan';
import { MODULES } from '../lib/engine/course';
import { lessonInfo, STEP_MINUTES, stepLabel } from '../lib/planText';
import { dailyReminderIcs } from '../lib/reminder';
import { WEEKDAYS, prettyDate } from '../lib/dates';
import { Card, Meter, PageHeader, cx } from '../components/ui';

export const CLOSE_STEP = 99;

export function currentPlanDay(planDone: Record<number, string>): number {
  return DAILY_PLAN.find((d) => !planDone[d.day])?.day ?? DAILY_PLAN.length + 1;
}

export function DayCard({ day, compact = false }: { day: PlanDay; compact?: boolean }) {
  const s = useStore();
  const today = s.today();
  const due = Object.values(s.reviews).filter((r) => r.due <= today).length;
  const week = PLAN_WEEKS.find((w) => w.week === day.week)!;
  const done = !!s.planDone[day.day];
  const minutes = day.steps.reduce((a, st) => a + STEP_MINUTES[st.kind], 0) + 2;
  const coreMinutes = day.steps.filter((st) => st.core).reduce((a, st) => a + STEP_MINUTES[st.kind], 0);
  const checked = (i: number) => !!s.planChecks[`${day.day}:${i}`];

  const toggle = (i: number) => {
    const st = day.steps[i];
    const next = !checked(i);
    s.togglePlanStep(day.day, i);
    if (st?.kind === 'namaste') for (const slug of st.slugs) s.setLessonWatched(lessonInfo(st.module, slug).key, next);
  };

  return (
    <Card className={cx('space-y-4', !compact && 'border-accent/40 p-6')}>
      <div>
        <div className="text-xs font-medium uppercase tracking-wide text-accent">
          Day {day.day} · Week {day.week}: {week.title}
        </div>
        <h2 className="mt-1 text-xl font-semibold">{day.title}</h2>
        <p className="mt-1 text-sm text-muted">{day.focus}</p>
        <p className="mt-1 text-xs text-muted">
          Plan for about {minutes} minutes (lesson lengths vary). Short on time? Do only the steps marked <span className="text-accent">core</span> (about {coreMinutes} minutes).
        </p>
      </div>

      {due > 0 && (
        <Link to="/review" className="block rounded-xl border border-good/40 bg-good/5 p-3 text-sm">
          <span className="font-medium text-good">
            First: {due} recall{due > 1 ? 's' : ''} due.
          </span>{' '}
          <span className="text-muted">Answer from memory (about 5 minutes). This is what stops you forgetting. →</span>
        </Link>
      )}

      <ol className="space-y-2">
        {day.steps.map((st, i) => {
          const l = stepLabel(st);
          return (
            <li key={i} className={cx('flex gap-3 rounded-xl border p-3', checked(i) ? 'border-good/30 bg-good/5' : 'border-line')}>
              <input type="checkbox" className="mt-1 h-4 w-4 shrink-0" checked={checked(i)} onChange={() => toggle(i)} aria-label={`Done: ${l.title}`} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
                  <span className="font-medium uppercase tracking-wide">
                    {i + 1}. {l.tag}
                  </span>
                  {st.core && <span className="chip border-accent/40 py-0 text-accent">core</span>}
                  <span>~{STEP_MINUTES[st.kind]} min</span>
                </div>
                <div className={cx('mt-0.5 text-sm font-medium', checked(i) && 'text-muted line-through')}>{l.title}</div>
                {l.detail && <p className="mt-0.5 text-sm text-muted">{l.detail}</p>}
                {st.kind === 'namaste' && <p className="mt-0.5 text-xs text-muted">Ticking this marks the lesson as watched. "Can do it" only comes from solving.</p>}
                <div className="mt-1.5">
                  {l.path && (
                    <Link to={l.path} className="text-sm text-accent hover:underline" onClick={() => s.setResume(l.path!, l.title)}>
                      Open in the app →
                    </Link>
                  )}
                  {l.href && (
                    <a href={l.href} target="_blank" rel="noreferrer" className="text-sm text-accent hover:underline">
                      Open Namaste DSA ↗
                    </a>
                  )}
                </div>
              </div>
            </li>
          );
        })}
        <li className={cx('flex gap-3 rounded-xl border p-3', checked(CLOSE_STEP) ? 'border-good/30 bg-good/5' : 'border-line')}>
          <input type="checkbox" className="mt-1 h-4 w-4 shrink-0" checked={checked(CLOSE_STEP)} onChange={() => toggle(CLOSE_STEP)} aria-label="Done: close the day" />
          <div className="text-sm">
            <div className="text-xs font-medium uppercase tracking-wide text-muted">{day.steps.length + 1}. Close the day · ~2 min</div>
            <div className="mt-0.5 font-medium">Without looking, write today's key idea in one sentence.</div>
            <p className="mt-0.5 text-muted">Saving a problem in the playground already schedules its recall for tomorrow, day 3, 5, 7 and 14.</p>
          </div>
        </li>
      </ol>

      <div className="flex flex-wrap items-center gap-3">
        {done ? (
          <>
            <span className="text-sm text-good">Finished on {prettyDate(s.planDone[day.day])}.</span>
            <button className="btn-ghost text-sm" onClick={() => s.setPlanDayDone(day.day, false)}>
              Undo
            </button>
          </>
        ) : (
          <button className="btn-primary px-5" onClick={() => s.setPlanDayDone(day.day, true)}>
            Finish day {day.day}
          </button>
        )}
        {!done && <span className="text-xs text-muted">You can finish a day even if you skipped a step. Moving forward matters more than perfect days.</span>}
      </div>
    </Card>
  );
}

export default function DailyPlan() {
  const s = useStore();
  const [params, setParams] = useSearchParams();
  const current = currentPlanDay(s.planDone);
  const finished = current > DAILY_PLAN.length;
  const selected = Number(params.get('day')) || (finished ? DAILY_PLAN.length : current);
  const day = planDayByNumber(selected) ?? DAILY_PLAN[0];
  const doneCount = Object.keys(s.planDone).length;
  const [openWeek, setOpenWeek] = useState<number>(day.week);
  const byWeek = useMemo(() => PLAN_WEEKS.map((w) => ({ ...w, days: DAILY_PLAN.filter((d) => d.week === w.week) })), []);
  const st = s.schedule;

  const downloadReminder = () => {
    const blob = new Blob([dailyReminderIcs(st, s.today(), window.location.origin)], { type: 'text/calendar' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'dsa-daily-reminder.ics';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Daily plan"
        subtitle="55 study days that follow the Namaste DSA order. Each day: warm up in the app, watch the lesson, then solve on your own. Every fifth day is for review."
      />

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-4">
          {finished && !params.get('day') && (
            <Card className="border-good/40">
              <h2 className="h2">You finished all 55 days.</h2>
              <p className="mt-1 text-sm text-muted">That is a real achievement. See "After Day 55" for how to continue.</p>
            </Card>
          )}
          {selected !== current && !finished && (
            <button className="text-sm text-accent hover:underline" onClick={() => setParams({})}>
              ← Back to today (Day {current})
            </button>
          )}
          <DayCard day={day} />

          <Card>
            <h2 className="h2">After Day 55</h2>
            <p className="mt-1 text-sm text-muted">{AFTER_PLAN.intro}</p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {AFTER_PLAN.modules.map((m) => {
                const mod = MODULES.find((x) => x.order === m);
                return (
                  <li key={m} className="chip">
                    {m}. {mod?.name} ({mod?.count})
                  </li>
                );
              })}
            </ul>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Progress</span>
              <span className="text-muted">
                {doneCount} / {DAILY_PLAN.length} days
              </span>
            </div>
            <div className="mt-2">
              <Meter value={doneCount} max={DAILY_PLAN.length} tone="good" />
            </div>
            <p className="mt-2 text-xs text-muted">Missed a few days? Just continue from where you are. The plan waits for you; it does not move ahead on its own.</p>
          </Card>

          <Card className="space-y-1">
            <h2 className="h2 mb-2">All days</h2>
            {byWeek.map((w) => (
              <div key={w.week} className="rounded-xl border border-line">
                <button className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm" aria-expanded={openWeek === w.week} onClick={() => setOpenWeek(openWeek === w.week ? 0 : w.week)}>
                  <span>
                    <span className="font-medium">Week {w.week}</span> <span className="text-muted">· {w.title}</span>
                  </span>
                  <span className="text-xs text-muted">
                    {w.days.filter((d) => s.planDone[d.day]).length}/{w.days.length}
                  </span>
                </button>
                {openWeek === w.week && (
                  <div className="border-t border-line px-3 py-2">
                    <p className="mb-2 text-xs text-muted">Goal: {w.goal}</p>
                    <ul className="space-y-1">
                      {w.days.map((d) => (
                        <li key={d.day}>
                          <button
                            onClick={() => setParams({ day: String(d.day) })}
                            className={cx('flex w-full items-center gap-2 rounded-lg px-2 py-1 text-left text-sm hover:bg-raised', d.day === selected && 'bg-accent/10')}
                          >
                            <span className={cx('w-5 text-center text-xs', s.planDone[d.day] ? 'text-good' : 'text-muted')}>{s.planDone[d.day] ? '✓' : d.day}</span>
                            <span className={cx('flex-1', d.review && 'text-muted')}>{d.title}</span>
                            {d.day === current && <span className="chip py-0 text-accent">today</span>}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </Card>

          <Card className="space-y-3">
            <h2 className="h2">Daily reminder</h2>
            <p className="text-sm text-muted">Pick your study days and time, then add one repeating reminder to any calendar app (Google, Apple, Outlook). No account connection is needed.</p>
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Study days">
              {WEEKDAYS.map((d, i) => {
                const on = st.days.includes(i);
                return (
                  <button key={d} aria-pressed={on} onClick={() => s.updateSchedule({ days: on ? st.days.filter((x) => x !== i) : [...st.days, i].sort() })} className={cx('h-9 w-11 rounded-lg border text-sm', on ? 'border-accent bg-accent/15' : 'border-line text-muted')}>
                    {d}
                  </button>
                );
              })}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label>
                <span className="label">Time</span>
                <input type="time" className="input" value={st.time} onChange={(e) => s.updateSchedule({ time: e.target.value })} />
              </label>
              <label>
                <span className="label">Length</span>
                <select className="input" value={st.duration} onChange={(e) => s.updateSchedule({ duration: Number(e.target.value) })}>
                  {[25, 45, 60].map((m) => (
                    <option key={m} value={m}>
                      {m} minutes
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <button className="btn-soft" onClick={downloadReminder} disabled={st.days.length === 0}>
              Download reminder (.ics)
            </button>
            <p className="text-xs text-muted">Timezone: {st.timeZone}. In Google Calendar: Settings → Import & export → Import.</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
