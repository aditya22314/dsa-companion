import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useStore, MISTAKE_LABELS } from '../store';
import { PROBLEMS, problemById } from '../content/problems';
import { CodeEditor } from '../components/CodeEditor';
import { Card, Stars, cx } from '../components/ui';
import { runInSandbox } from '../lib/runner';
import { formatArgs, formatValue } from '../lib/judge';
import { QUALITY } from '../lib/engine/srs';
import { prettyDate } from '../lib/dates';
import { OUTCOMES, type Outcome } from '../../shared/types';
import type { MistakeCategory } from '../store/types';

const STEP_TITLES = ['Recall the approach', 'Name the pattern', 'Dry-run a small example', 'Write it in JavaScript', 'Transfer to a new problem'];

const norm = (s: string) => s.replace(/\s+/g, '').replace(/'/g, '"').toLowerCase();

export default function ReviewSession() {
  const { problemId = '' } = useParams();
  const p = problemById(problemId);
  const s = useStore();
  const nav = useNavigate();
  const [step, setStep] = useState(0);
  const [recall, setRecall] = useState('');
  const [recallGrade, setRecallGrade] = useState<'yes' | 'partly' | 'no' | null>(null);
  const [patternPick, setPatternPick] = useState<string | null>(null);
  const [dry, setDry] = useState('');
  const [dryChecked, setDryChecked] = useState<boolean | null>(null);
  const [code, setCode] = useState(p?.starterCode ?? '');
  const [codeResult, setCodeResult] = useState<{ passed: number; total: number; error?: string } | null>(null);
  const [peeked, setPeeked] = useState(false);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [missing, setMissing] = useState<MistakeCategory | ''>('');
  const [conf, setConf] = useState<number>();
  const [done, setDone] = useState(false);
  const started = useRef(Date.now());
  const setResume = s.setResume;

  useEffect(() => {
    if (p) setResume(`/review/${p.id}`, `Revising: ${p.title}`);
  }, [p, setResume]);

  const options = useMemo(() => {
    if (!p) return [];
    const others = [...new Set(PROBLEMS.filter((x) => x.pattern !== p.pattern).map((x) => x.pattern))];
    const seed = p.id.length;
    const picks = [others[seed % others.length], others[(seed * 7) % others.length], others[(seed * 13 + 3) % others.length]];
    const uniq = [...new Set(picks)].slice(0, 3);
    const all = [...uniq, p.pattern];
    return all.sort((a, b) => (a.length * 31) % 7 - (b.length * 31) % 7);
  }, [p]);

  if (!p) return <div>Not found.</div>;
  const dryCase = p.tests.find((t) => !t.hidden && t !== p.tests[0]) ?? p.tests[0];
  const transfer = p.transfer ? problemById(p.transfer) : undefined;

  const patternOk = patternPick === p.pattern;
  const codeOk = !!codeResult && codeResult.passed === codeResult.total && !codeResult.error;

  const computed: Outcome = (() => {
    if (!codeOk) return peeked ? 'saw-solution' : 'unable';
    if (peeked) return 'saw-solution';
    const slips = (recallGrade === 'yes' ? 0 : recallGrade === 'partly' ? 1 : 2) + (patternOk ? 0 : 1) + (dryChecked ? 0 : 1);
    if (slips === 0) return 'independent';
    if (slips <= 2) return 'small-hints';
    return 'guided';
  })();
  const finalOutcome = outcome && QUALITY[outcome] <= QUALITY[computed] ? outcome : computed;

  const runCode = async () => {
    const r = await runInSandbox(code, p.functionName, p.tests, 'test');
    setCodeResult({ passed: r.results.filter((x) => x.passed).length, total: p.tests.length, error: r.error });
  };

  const save = () => {
    s.recordAttempt(
      {
        problemId: p.id,
        kind: 'review',
        outcome: finalOutcome,
        hintsUsed: 0,
        mentorSteps: 0,
        sawSolution: peeked,
        testsPassed: codeResult?.passed ?? 0,
        testsTotal: p.tests.length,
        confidenceAfter: conf,
        durationSec: Math.round((Date.now() - started.current) / 1000),
      },
      missing ? { missingIdea: missing, note: recall.slice(0, 200) } : undefined,
    );
    setDone(true);
  };

  if (done) {
    const r = useStore.getState().reviews[p.id];
    const remedial = useStore.getState().remedials.find((x) => x.forProblem === p.id && !x.done);
    return (
      <Card className="mx-auto max-w-xl space-y-3">
        <h1 className="h2">Review saved</h1>
        <p className="text-sm">
          Next recall: <strong>{prettyDate(r.due)}</strong> (in {r.intervalDays} day{r.intervalDays > 1 ? 's' : ''}).
        </p>
        {remedial && (
          <div className="rounded-lg border border-warn/40 bg-warn/5 p-3 text-sm">
            {remedial.reason}
            <div className="mt-2">
              <Link to={`/practice/${remedial.practiceProblem}?from=remedial`} className="btn-primary">
                Start targeted practice
              </Link>
            </div>
          </div>
        )}
        <div className="flex gap-2">
          <button className="btn-ghost" onClick={() => nav('/review')}>
            More reviews
          </button>
          <Link to="/" className="btn-ghost">
            Today
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <Link to="/review" className="text-sm text-muted hover:text-ink">
          ← Revise
        </Link>
        <h1 className="h1 mt-1">Recall: {p.title}</h1>
        <p className="mt-1 text-sm text-muted">Don't look anything up. Struggling to remember is the part that makes it stick.</p>
      </div>
      <ol className="flex gap-1.5" aria-label="Review steps">
        {STEP_TITLES.map((t, i) => (
          <li key={t} className="flex-1">
            <button onClick={() => i <= step && setStep(i)} className={cx('h-1.5 w-full rounded-full', i < step ? 'bg-good' : i === step ? 'bg-accent' : 'bg-line')} aria-label={t} />
          </li>
        ))}
      </ol>

      <Card>
        <div className="mb-3 text-xs uppercase tracking-wide text-muted">
          Step {step + 1} of 5 · {STEP_TITLES[step]}
        </div>

        {step === 0 && (
          <div className="space-y-3">
            <p className="text-sm">
              <strong>The problem:</strong> {p.statement.replace(/\*\*/g, '').replace(/`/g, '')}
            </p>
            <label className="block">
              <span className="label">Without looking: how do you solve it, and why does that work?</span>
              <textarea className="input min-h-[110px]" value={recall} onChange={(e) => setRecall(e.target.value)} placeholder="E.g. walk once, keep track of…" />
            </label>
            {recallGrade === null && recall.trim().length >= 15 && (
              <div className="space-y-2 rounded-xl bg-raised p-3 text-sm">
                <div className="font-medium">Compare with the reference idea:</div>
                <p>{p.solutionExplanation}</p>
                <div className="flex flex-wrap gap-2 pt-1">
                  {(
                    [
                      ['yes', 'I had it'],
                      ['partly', 'Partly'],
                      ['no', "I'd forgotten"],
                    ] as const
                  ).map(([v, l]) => (
                    <button key={v} className="btn-soft" onClick={() => (setRecallGrade(v), setStep(1))}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {recall.trim().length < 15 && <p className="text-xs text-muted">Write at least a sentence to unlock the comparison.</p>}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-3">
            <p className="text-sm">Which pattern does this problem use?</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {options.map((o) => (
                <button
                  key={o}
                  disabled={patternPick !== null}
                  onClick={() => setPatternPick(o)}
                  className={cx('rounded-lg border p-3 text-left text-sm', patternPick && o === p.pattern && 'border-good bg-good/10', patternPick === o && o !== p.pattern && 'border-bad bg-bad/10', !patternPick && 'border-line hover:bg-raised')}
                >
                  {o}
                </button>
              ))}
            </div>
            {patternPick && (
              <div className="text-sm">
                <span className={patternOk ? 'text-good' : 'text-bad'}>{patternOk ? 'Right.' : `It's "${p.pattern}".`}</span>{' '}
                <span className="text-muted">Explain to yourself in one sentence why this pattern fits before moving on.</span>
                <div className="mt-2">
                  <button className="btn-primary" onClick={() => setStep(2)}>
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <p className="text-sm">
              Trace the algorithm by hand. What does <code className="code-inline">{p.functionName}({formatArgs(dryCase.args)})</code> return?
            </p>
            <input className="input font-mono" value={dry} onChange={(e) => setDry(e.target.value)} placeholder="Your answer" disabled={dryChecked !== null} />
            {dryChecked === null ? (
              <button className="btn-primary" disabled={!dry.trim()} onClick={() => setDryChecked(norm(dry) === norm(formatValue(dryCase.expected)) || norm(dry) === norm(String(dryCase.expected)))}>
                Check
              </button>
            ) : (
              <div className="text-sm">
                <span className={dryChecked ? 'text-good' : 'text-bad'}>{dryChecked ? 'Correct.' : `Expected ${formatValue(dryCase.expected)}.`}</span>
                <div className="mt-2">
                  <button className="btn-primary" onClick={() => setStep(3)}>
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3">
            <p className="text-sm">Write the algorithm from scratch. It doesn't need to match any earlier code, only pass the tests.</p>
            <CodeEditor value={code} onChange={setCode} height="260px" label="Review editor" />
            <div className="flex flex-wrap items-center gap-2">
              <button className="btn-primary" onClick={runCode}>
                Run tests
              </button>
              {codeResult && (
                <span className={cx('text-sm', codeOk ? 'text-good' : 'text-warn')}>
                  {codeResult.error ?? `${codeResult.passed}/${codeResult.total} passed`}
                </span>
              )}
              {!codeOk && !peeked && (
                <button className="btn-ghost ml-auto text-muted" onClick={() => setPeeked(true)}>
                  I can't, show the reference
                </button>
              )}
            </div>
            {peeked && <pre className="overflow-x-auto rounded-xl bg-raised p-3 font-mono text-[13px]">{p.solution}</pre>}
            {(codeOk || peeked) && (
              <button className="btn-primary" onClick={() => setStep(4)}>
                Next
              </button>
            )}
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            {transfer ? (
              <div className="rounded-xl border border-line p-3 text-sm">
                <div className="font-medium">Same idea, different problem: {transfer.title}</div>
                <p className="text-muted">Solving an unfamiliar variation is the real test of understanding. You can do it now or later; it opens in a new practice tab.</p>
                <Link to={`/practice/${transfer.id}?from=review`} target="_blank" className="mt-2 inline-block text-accent hover:underline">
                  Open {transfer.title} →
                </Link>
              </div>
            ) : (
              <p className="text-sm text-muted">No variation for this one yet. Try explaining the pattern out loud as if teaching it.</p>
            )}
            <fieldset>
              <legend className="label">How did this review go?</legend>
              <div className="flex flex-wrap gap-2">
                {OUTCOMES.filter((o) => QUALITY[o.id] <= QUALITY[computed]).map((o) => (
                  <button key={o.id} aria-pressed={finalOutcome === o.id} onClick={() => setOutcome(o.id)} className={cx('rounded-lg border px-3 py-1.5 text-sm', finalOutcome === o.id ? 'border-accent bg-accent/15' : 'border-line text-muted')}>
                    {o.label}
                  </button>
                ))}
              </div>
              <p className="mt-1 text-xs text-muted">Suggested from your recall, pattern, dry-run and code. You can only rate lower, never higher.</p>
            </fieldset>
            {QUALITY[finalOutcome] <= 3 && (
              <label className="block">
                <span className="label">What was missing? (creates targeted practice)</span>
                <select className="input" value={missing} onChange={(e) => setMissing(e.target.value as MistakeCategory)}>
                  <option value="">Choose one</option>
                  {Object.entries(MISTAKE_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <div>
              <span className="label">Confidence now</span>
              <Stars label="Confidence after review" value={conf} onChange={setConf} />
            </div>
            <button className="btn-primary" onClick={save}>
              Save review
            </button>
          </div>
        )}
      </Card>
    </div>
  );
}
