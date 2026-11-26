import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { TOPICS, topicById } from '../content/topics';
import { MODULES } from '../lib/engine/course';
import { MODE_INFO } from '../lib/engine/planner';
import { WEEKDAYS } from '../lib/dates';
import { cx } from '../components/ui';
import type { StudyMode, TopicId } from '../../shared/types';
import type { Profile } from '../store/types';

const STRUGGLES = [
  { id: 'start', label: "I don't know how to start a problem" },
  { id: 'forget', label: 'I forget approaches after a few days' },
  { id: 'too-hard', label: 'Course questions feel too hard' },
  { id: 'consistency', label: 'I struggle to stay consistent' },
  { id: 'patterns', label: "I can't recognise which pattern to use" },
];

export function recommendStart(experience: Profile['experience'], module: number): TopicId {
  if (experience === 'new' || experience === 'rusty' || module <= 2) return 'loops';
  if (module <= 4) return 'arrays';
  if (module <= 6) return 'two-pointers';
  if (module <= 8) return 'strings';
  return 'hashing';
}

export default function Onboarding() {
  const complete = useStore((s) => s.completeOnboarding);
  const nav = useNavigate();
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [experience, setExperience] = useState<Profile['experience']>('some');
  const [module, setModule] = useState(2);
  const [struggles, setStruggles] = useState<string[]>(['start', 'forget']);
  const [mode, setMode] = useState<StudyMode>('normal');
  const [days, setDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [time, setTime] = useState('20:00');
  const suggested = recommendStart(experience, module);
  const [startTopic, setStartTopic] = useState<TopicId | null>(null);
  const topic = startTopic ?? suggested;

  const finish = () => {
    complete(
      { name: name.trim(), experience, namasteModule: module, struggles, defaultMode: mode, startTopic: topic },
      { days, time, duration: MODE_INFO[mode].minutes },
    );
    nav('/');
  };

  const steps = [
    <div key="0" className="space-y-5">
      <div>
        <h1 className="h1">Learn, solve, remember.</h1>
        <p className="mt-2 text-muted">
          DSA Companion turns your Namaste DSA course into small daily steps: understand an idea, see it move, predict it, solve tiny problems, and revise before you forget. It measures what you can solve on your own, not what you have watched.
        </p>
      </div>
      <label className="block">
        <span className="label">What should I call you?</span>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your first name (optional)" autoFocus />
      </label>
    </div>,

    <div key="1" className="space-y-5">
      <h2 className="h2">Where are you starting from?</h2>
      <fieldset>
        <legend className="label">Algorithmic problem solving</legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {(
            [
              ['new', 'New to DSA', 'I know JavaScript but not algorithms.'],
              ['rusty', 'Started before, rusty', 'I have tried a few times and stopped.'],
              ['some', 'Some practice', 'I can solve easy problems sometimes.'],
            ] as const
          ).map(([id, t, d]) => (
            <button key={id} type="button" aria-pressed={experience === id} onClick={() => setExperience(id)} className={cx('rounded-xl border p-3 text-left', experience === id ? 'border-accent bg-accent/10' : 'border-line hover:bg-raised')}>
              <div className="text-sm font-medium">{t}</div>
              <div className="text-xs text-muted">{d}</div>
            </button>
          ))}
        </div>
      </fieldset>
      <label className="block">
        <span className="label">How far have you watched in Namaste DSA?</span>
        <select className="input" value={module} onChange={(e) => setModule(Number(e.target.value))}>
          <option value={0}>Not started yet</option>
          {MODULES.filter((m) => m.count > 0).map((m) => (
            <option key={m.order} value={m.order}>
              Module {m.order}: {m.name}
            </option>
          ))}
        </select>
        <span className="mt-1 block text-xs text-muted">Watching is tracked separately from what you can actually solve. We will check understanding with practice.</span>
      </label>
      <fieldset>
        <legend className="label">What gets in your way? (pick any)</legend>
        <div className="flex flex-wrap gap-2">
          {STRUGGLES.map((s) => {
            const on = struggles.includes(s.id);
            return (
              <button key={s.id} type="button" aria-pressed={on} onClick={() => setStruggles(on ? struggles.filter((x) => x !== s.id) : [...struggles, s.id])} className={cx('rounded-full border px-3 py-1.5 text-sm', on ? 'border-accent bg-accent/10' : 'border-line text-muted hover:bg-raised')}>
                {s.label}
              </button>
            );
          })}
        </div>
      </fieldset>
    </div>,

    <div key="2" className="space-y-5">
      <h2 className="h2">How much time on a normal day?</h2>
      <div className="grid gap-2 sm:grid-cols-3">
        {(Object.keys(MODE_INFO) as StudyMode[]).map((m) => (
          <button key={m} type="button" aria-pressed={mode === m} onClick={() => setMode(m)} className={cx('rounded-xl border p-3 text-left', mode === m ? 'border-accent bg-accent/10' : 'border-line hover:bg-raised')}>
            <div className="text-sm font-medium">{MODE_INFO[m].label}</div>
            <div className="text-xs text-muted">
              {MODE_INFO[m].minutes} min · {MODE_INFO[m].blurb}
            </div>
          </button>
        ))}
      </div>
      <p className="text-xs text-muted">You can switch modes every day. A 10-minute day still counts.</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <fieldset>
          <legend className="label">Study days</legend>
          <div className="flex flex-wrap gap-1.5">
            {WEEKDAYS.map((d, i) => {
              const on = days.includes(i);
              return (
                <button key={d} type="button" aria-pressed={on} onClick={() => setDays(on ? days.filter((x) => x !== i) : [...days, i].sort())} className={cx('h-9 w-11 rounded-lg border text-sm', on ? 'border-accent bg-accent/15' : 'border-line text-muted')}>
                  {d}
                </button>
              );
            })}
          </div>
        </fieldset>
        <label className="block">
          <span className="label">Preferred time (Asia/Kolkata)</span>
          <input type="time" className="input" value={time} onChange={(e) => setTime(e.target.value)} />
        </label>
      </div>
    </div>,

    <div key="3" className="space-y-5">
      <h2 className="h2">Your starting point</h2>
      <p className="text-sm text-muted">
        Based on your answers, start with <strong className="text-ink">{topicById(suggested).title}</strong>. Starting a little easier than feels necessary builds the independent-solving habit fastest.
      </p>
      <div className="grid gap-2 sm:grid-cols-3">
        {TOPICS.filter((t) => t.id !== 'complexity').map((t) => (
          <button key={t.id} type="button" aria-pressed={topic === t.id} onClick={() => setStartTopic(t.id)} className={cx('rounded-xl border p-3 text-left', topic === t.id ? 'border-accent bg-accent/10' : 'border-line hover:bg-raised')}>
            <div className="text-sm font-medium">
              {t.title} {t.id === suggested && <span className="chip ml-1 border-accent/40 text-accent">suggested</span>}
            </div>
            <div className="text-xs text-muted">{t.tagline}</div>
          </button>
        ))}
      </div>
    </div>,
  ];

  return (
    <div className="flex min-h-full items-center justify-center px-4 py-10">
      <div className="card w-full max-w-2xl p-6 md:p-8">
        <div className="mb-6 flex gap-1.5" aria-label={`Step ${step + 1} of ${steps.length}`}>
          {steps.map((_, i) => (
            <span key={i} className={cx('h-1 flex-1 rounded-full', i <= step ? 'bg-accent' : 'bg-line')} />
          ))}
        </div>
        {steps[step]}
        <div className="mt-8 flex justify-between">
          <button className="btn-ghost" onClick={() => setStep((s) => s - 1)} disabled={step === 0}>
            Back
          </button>
          {step < steps.length - 1 ? (
            <button className="btn-primary" onClick={() => setStep((s) => s + 1)} disabled={step === 2 && days.length === 0}>
              Continue
            </button>
          ) : (
            <button className="btn-primary" onClick={finish}>
              Start learning
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
