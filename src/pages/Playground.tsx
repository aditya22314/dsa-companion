import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useStore, MISTAKE_LABELS } from '../store';
import { problemById, problemsForTopic } from '../content/problems';
import { topicById } from '../content/topics';
import { runInSandbox, type RunResponse } from '../lib/runner';
import { suggestOutcome, recommendProblem } from '../lib/engine/adaptive';
import { QUALITY } from '../lib/engine/srs';
import { bestOutcome } from '../lib/engine/mastery';
import { CodeEditor } from '../components/CodeEditor';
import { Mentor } from '../components/Mentor';
import { VizPlayer } from '../viz/VizPlayer';
import { Card, OutcomeBadge, Stars, Tag, cx } from '../components/ui';
import { Md } from '../lib/md';
import { prettyDate } from '../lib/dates';
import { OUTCOMES, type Outcome } from '../../shared/types';
import type { Attempt, MistakeCategory } from '../store/types';

type Tab = 'problem' | 'hints' | 'mentor' | 'visual' | 'solution';

export default function Playground() {
  const { problemId = '' } = useParams();
  const [params] = useSearchParams();
  const p = problemById(problemId);
  const nav = useNavigate();
  const s = useStore();
  const draft = s.drafts[problemId];
  const [code, setCode] = useState(draft?.code ?? p?.starterCode ?? '');
  const [tab, setTab] = useState<Tab>('problem');
  const [result, setResult] = useState<(RunResponse & { mode: 'run' | 'test' }) | null>(null);
  const [running, setRunning] = useState(false);
  const [finish, setFinish] = useState<null | 'passed' | 'giveup'>(null);
  const [saved, setSaved] = useState<Attempt | null>(null);
  const started = useRef(Date.now());
  const saveDraft = s.saveDraft;
  const setResume = s.setResume;

  useEffect(() => {
    if (!p) return;
    setResume(`/practice/${p.id}`, `Practising: ${p.title}`);
  }, [p, setResume]);

  // Debounced autosave of the code.
  useEffect(() => {
    if (!p) return;
    const t = setTimeout(() => saveDraft(p.id, { code }), 400);
    return () => clearTimeout(t);
  }, [code, p, saveDraft]);

  if (!p) {
    return (
      <div className="text-sm">
        Problem not found. <Link to="/practice" className="text-accent">Back to practice</Link>
      </div>
    );
  }

  const hints = draft?.hintsRevealed ?? 0;
  const mentorSteps = draft?.mentorSteps ?? 0;
  const sawSolution = draft?.sawSolution ?? false;
  const topic = topicById(p.topic);
  const kind: Attempt['kind'] = params.get('from') === 'review' ? 'transfer' : 'practice';

  const run = async (mode: 'run' | 'test') => {
    setRunning(true);
    const r = await runInSandbox(code, p.functionName, p.tests, mode);
    setResult({ ...r, mode });
    setRunning(false);
    if (mode === 'test' && r.ok && r.results.length && r.results.every((x) => x.passed)) setFinish('passed');
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: 'problem', label: 'Problem' },
    { id: 'hints', label: `Hints ${hints}/${p.hints.length}` },
    { id: 'mentor', label: 'Mentor' },
    ...(p.dryRun ? [{ id: 'visual' as Tab, label: 'Dry run' }] : []),
    { id: 'solution', label: 'Solution' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <Link to={`/learn/${p.topic}`} className="text-sm text-muted hover:text-ink">
            ← {topic.title}
          </Link>
          <h1 className="h1 mt-1">{p.title}</h1>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="chip">Level {p.level}</span>
            <span className="chip">{p.pattern}</span>
            <Tag tone="supplementary">Original practice</Tag>
            {bestOutcome(s, p.id) && <OutcomeBadge outcome={bestOutcome(s, p.id)!} />}
          </div>
        </div>
        {draft?.confidenceBefore === undefined && (
          <div className="card flex items-center gap-3 p-3">
            <span className="text-sm text-muted">Before starting, how confident are you?</span>
            <Stars label="Confidence before" value={draft?.confidenceBefore} onChange={(v) => saveDraft(p.id, { confidenceBefore: v })} />
          </div>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <Card className="p-0">
          <div className="flex gap-1 overflow-x-auto border-b border-line p-2" role="tablist">
            {tabs.map((t) => (
              <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)} className={cx('whitespace-nowrap rounded-lg px-3 py-1.5 text-sm', tab === t.id ? 'bg-raised font-medium' : 'text-muted hover:text-ink')}>
                {t.label}
              </button>
            ))}
          </div>
          <div className="max-h-[70vh] overflow-y-auto p-5" role="tabpanel">
            {tab === 'problem' && (
              <div className="space-y-4 text-[15px]">
                <p className="leading-relaxed">
                  <Md text={p.statement} />
                </p>
                {p.examples.map((e, i) => (
                  <div key={i} className="rounded-xl bg-raised p-3 font-mono text-sm">
                    <div>
                      <span className="text-muted">Input:</span> {e.input}
                    </div>
                    <div>
                      <span className="text-muted">Output:</span> {e.output}
                    </div>
                    {e.explanation && <div className="mt-1 font-sans text-xs text-muted">{e.explanation}</div>}
                  </div>
                ))}
                <div>
                  <div className="label">Constraints</div>
                  <ul className="text-sm text-muted">
                    {p.constraints.map((c) => (
                      <li key={c}>• {c}</li>
                    ))}
                  </ul>
                </div>
                <p className="text-xs text-muted">
                  Write a function named <code className="code-inline">{p.functionName}</code>. Stuck for more than 5 minutes? Open the Mentor tab before reaching for hints.
                </p>
              </div>
            )}

            {tab === 'hints' && (
              <div className="space-y-3">
                <p className="text-sm text-muted">Hints get stronger one at a time. Using one is fine; it is recorded so revision can focus on what you needed.</p>
                {p.hints.slice(0, hints).map((h, i) => (
                  <div key={i} className="animate-pop rounded-xl border border-line bg-raised/60 p-3 text-sm">
                    <div className="mb-1 text-xs font-medium text-accent">Hint {i + 1}</div>
                    {h}
                  </div>
                ))}
                {hints < p.hints.length ? (
                  <button className="btn-soft" onClick={() => saveDraft(p.id, { hintsRevealed: hints + 1 })}>
                    {hints === 0 ? 'Show the first, gentle hint' : 'Show a stronger hint'}
                  </button>
                ) : (
                  <p className="text-sm text-muted">That's every hint. Try writing the pseudocode as code, line by line.</p>
                )}
              </div>
            )}

            {tab === 'mentor' && <Mentor problem={p} code={code} hintsUsed={hints} revealed={mentorSteps} onReveal={(n) => saveDraft(p.id, { mentorSteps: n })} />}

            {tab === 'visual' && p.dryRun && (
              <div className="space-y-3">
                <p className="text-sm text-muted">Step through the idea on a small input. Predict each step before pressing →.</p>
                <VizPlayer viz={p.dryRun.viz} input={p.dryRun.input} target={p.dryRun.target} />
              </div>
            )}

            {tab === 'solution' &&
              (sawSolution ? (
                <div className="space-y-3">
                  <pre className="overflow-x-auto rounded-xl bg-raised p-3 font-mono text-[13px]">{p.solution}</pre>
                  <p className="text-sm">{p.solutionExplanation}</p>
                  <p className="text-sm text-muted">
                    <strong className="text-ink">Complexity:</strong> {p.complexity.time} time, {p.complexity.space} space. {p.complexity.why}
                  </p>
                  <p className="rounded-lg border border-warn/40 bg-warn/5 p-3 text-xs">Close this tab and rewrite it from memory in the editor. Copying it won't count as solving; it will be scheduled for an early review instead.</p>
                </div>
              ) : (
                <div className="space-y-3 text-sm">
                  <p>Seeing the full solution is allowed. It will be recorded as "understood after seeing the solution", and the problem will come back for review tomorrow.</p>
                  <p className="text-muted">Have you tried the mentor steps and at least the first two hints?</p>
                  <button className="btn-ghost border-warn/50 text-warn" onClick={() => saveDraft(p.id, { sawSolution: true })}>
                    Yes, show me the full solution
                  </button>
                </div>
              ))}
          </div>
        </Card>

        <div className="space-y-3">
          <CodeEditor value={code} onChange={setCode} label="JavaScript editor" />
          <div className="flex flex-wrap items-center gap-2">
            <button className="btn-soft" onClick={() => run('run')} disabled={running}>
              ▶ Run code
            </button>
            <button className="btn-primary" onClick={() => run('test')} disabled={running}>
              {running ? 'Running…' : 'Run tests'}
            </button>
            <button className="btn-ghost ml-auto text-muted" onClick={() => setFinish('giveup')}>
              I'm stuck, stop here
            </button>
            <button
              className="btn-ghost text-muted"
              onClick={() => {
                if (confirm('Reset the editor to the starter code?')) setCode(p.starterCode);
              }}
            >
              Reset
            </button>
          </div>

          {result && <Results r={result} />}

          {finish && !saved && (
            <FinishPanel
              mode={finish}
              evidence={{ hintsUsed: hints, mentorSteps, sawSolution, allPassed: finish === 'passed' }}
              testsPassed={result?.results.filter((r) => r.passed).length ?? 0}
              testsTotal={p.tests.length}
              onCancel={() => setFinish(null)}
              onSave={(outcome, confidenceAfter, missingIdea, note) => {
                const a = s.recordAttempt(
                  {
                    problemId: p.id,
                    kind,
                    outcome,
                    hintsUsed: hints,
                    mentorSteps,
                    sawSolution,
                    testsPassed: result?.results.filter((r) => r.passed).length ?? 0,
                    testsTotal: p.tests.length,
                    confidenceBefore: draft?.confidenceBefore,
                    confidenceAfter,
                    durationSec: Math.round((Date.now() - started.current) / 1000),
                  },
                  missingIdea ? { missingIdea, note } : undefined,
                );
                s.clearDraft(p.id);
                setSaved(a);
              }}
            />
          )}
          {saved && <AfterSave attempt={saved} onNext={(id) => nav(`/practice/${id}`)} />}
        </div>
      </div>
    </div>
  );
}

function Results({ r }: { r: RunResponse & { mode: 'run' | 'test' } }) {
  const passed = r.results.filter((x) => x.passed).length;
  return (
    <Card className="space-y-3 p-4" as="div">
      {r.error ? (
        <div className="rounded-lg border border-bad/40 bg-bad/5 p-3 font-mono text-sm text-bad">{r.error}</div>
      ) : (
        <div className="flex items-center justify-between text-sm">
          <span className={passed === r.results.length ? 'font-medium text-good' : 'font-medium text-warn'}>
            {passed}/{r.results.length} {r.mode === 'run' ? 'example tests' : 'tests'} passed
          </span>
          <span className="text-xs text-muted">{r.ms.toFixed(1)} ms · sandboxed worker</span>
        </div>
      )}
      <ul className="space-y-1.5">
        {r.results.map((t) => (
          <li key={t.index} className={cx('rounded-lg border p-2 font-mono text-xs', t.passed ? 'border-good/30' : 'border-bad/40 bg-bad/5')}>
            <div className="flex items-center gap-2">
              <span className={t.passed ? 'text-good' : 'text-bad'}>{t.passed ? '✓' : '✗'}</span>
              <span className="truncate">{t.hidden && t.passed ? `Hidden test ${t.index + 1}` : `(${t.input})`}</span>
            </div>
            {!t.passed && (
              <div className="mt-1 pl-5 text-muted">
                expected <span className="text-ink">{t.expected}</span>, got <span className="text-ink">{t.received}</span>
                {t.error && <div className="text-bad">{t.error}</div>}
                {t.note && <div className="font-sans text-warn">{t.note}</div>}
              </div>
            )}
          </li>
        ))}
      </ul>
      {r.logs.length > 0 && (
        <div>
          <div className="label">Console</div>
          <pre className="max-h-40 overflow-auto rounded-lg bg-raised p-2 font-mono text-xs">{r.logs.join('\n')}</pre>
        </div>
      )}
    </Card>
  );
}

function FinishPanel({
  mode,
  evidence,
  testsPassed,
  testsTotal,
  onSave,
  onCancel,
}: {
  mode: 'passed' | 'giveup';
  evidence: Parameters<typeof suggestOutcome>[0];
  testsPassed: number;
  testsTotal: number;
  onSave: (o: Outcome, confidenceAfter: number | undefined, missing?: MistakeCategory, note?: string) => void;
  onCancel: () => void;
}) {
  const max = suggestOutcome(evidence);
  const allowed = OUTCOMES.filter((o) => QUALITY[o.id] <= QUALITY[max]);
  const [outcome, setOutcome] = useState<Outcome>(max);
  const [conf, setConf] = useState<number>();
  const [missing, setMissing] = useState<MistakeCategory | ''>('');
  const [note, setNote] = useState('');
  const weak = QUALITY[outcome] <= 3;
  return (
    <Card className="animate-pop space-y-4 border-accent/50" as="div">
      <div>
        <h3 className="h2">{mode === 'passed' ? 'All tests passed. How did it really go?' : "Let's capture what got in the way"}</h3>
        <p className="text-sm text-muted">
          {mode === 'passed'
            ? `Based on what you used (${evidence.hintsUsed} hints${evidence.mentorSteps ? `, ${evidence.mentorSteps} mentor steps` : ''}${evidence.sawSolution ? ', viewed solution' : ''}), the strongest honest rating is "${OUTCOMES.find((o) => o.id === max)!.label}".`
            : `${testsPassed}/${testsTotal} tests passing. Stopping is fine; this becomes targeted practice instead of a dead end.`}
        </p>
      </div>
      <fieldset>
        <legend className="label">Outcome</legend>
        <div className="flex flex-wrap gap-2">
          {allowed.map((o) => (
            <button key={o.id} aria-pressed={outcome === o.id} onClick={() => setOutcome(o.id)} className={cx('rounded-lg border px-3 py-1.5 text-sm', outcome === o.id ? 'border-accent bg-accent/15' : 'border-line text-muted')}>
              {o.label}
            </button>
          ))}
        </div>
      </fieldset>
      {weak && (
        <label className="block">
          <span className="label">What was the missing idea?</span>
          <select className="input" value={missing} onChange={(e) => setMissing(e.target.value as MistakeCategory)}>
            <option value="">Choose one (adds to your mistake journal)</option>
            {Object.entries(MISTAKE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
          <input className="input mt-2" value={note} onChange={(e) => setNote(e.target.value)} placeholder="A note to future you (optional)" />
        </label>
      )}
      <div>
        <span className="label">Confidence now</span>
        <Stars label="Confidence after" value={conf} onChange={setConf} />
      </div>
      <div className="flex gap-2">
        <button className="btn-primary" onClick={() => onSave(outcome, conf, missing || undefined, note)}>
          Save attempt
        </button>
        <button className="btn-ghost" onClick={onCancel}>
          Keep working
        </button>
      </div>
    </Card>
  );
}

function AfterSave({ attempt, onNext }: { attempt: Attempt; onNext: (id: string) => void }) {
  const s = useStore();
  const p = problemById(attempt.problemId)!;
  const review = s.reviews[p.id];
  const rec = useMemo(() => recommendProblem(s, p.topic), [s, p.topic]);
  const remedial = s.remedials.find((r) => r.forProblem === p.id && !r.done);
  const solvedAll = problemsForTopic(p.topic).every((x) => bestOutcome(s, x.id) === 'independent');
  return (
    <Card className="animate-pop space-y-3 border-good/40" as="div">
      <div className="flex items-center gap-2">
        <OutcomeBadge outcome={attempt.outcome} />
        <span className="text-sm">Saved.</span>
      </div>
      <p className="text-sm">
        <strong>Complexity:</strong> {p.complexity.time} time, {p.complexity.space} space. <span className="text-muted">{p.complexity.why}</span>
      </p>
      {review && (
        <p className="text-sm text-muted">
          First recall is on <strong className="text-ink">{prettyDate(review.due)}</strong>. You will be asked to explain the approach from memory, not to retype code.
        </p>
      )}
      {remedial && <p className="rounded-lg border border-warn/40 bg-warn/5 p-3 text-sm">{remedial.reason}</p>}
      <div className="flex flex-wrap gap-2">
        {remedial ? (
          <button className="btn-primary" onClick={() => onNext(remedial.practiceProblem)}>
            Do the targeted practice
          </button>
        ) : rec && rec.problem.id !== p.id ? (
          <button className="btn-primary" onClick={() => onNext(rec.problem.id)}>
            Next: {rec.problem.title}
          </button>
        ) : null}
        <Link to="/" className="btn-ghost">
          Back to Today
        </Link>
      </div>
      {solvedAll && <p className="text-xs text-good">Every problem in this topic has been solved independently. Time to move on in the course.</p>}
    </Card>
  );
}
