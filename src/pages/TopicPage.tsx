import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { useStore } from '../store';
import { TOPICS, topicById } from '../content/topics';
import { problemsForTopic } from '../content/problems';
import { topicLevel, bestOutcome, LEVEL_NAMES } from '../lib/engine/mastery';
import { recommendProblem } from '../lib/engine/adaptive';
import { VizPlayer } from '../viz/VizPlayer';
import { Card, LevelDots, OutcomeBadge, Tag, cx } from '../components/ui';
import { Md } from '../lib/md';
import type { TopicId } from '../../shared/types';
import type { PredictQuestion } from '../content/types';

const LADDER_LABEL: Record<number, string> = { 2: 'Easy practice · tiny exercises', 3: 'Guided practice · hints welcome', 4: 'Independent practice', 5: 'Course-level challenge' };

function Predict({ q, topic }: { q: PredictQuestion; topic: TopicId }) {
  const answer = useStore((s) => s.answerPredict);
  const earned = useStore((s) => s.topics[topic]?.predict[q.id]);
  const [picked, setPicked] = useState<number | null>(null);
  const done = picked !== null;
  return (
    <div className="rounded-xl border border-line p-4">
      <pre className="overflow-x-auto rounded-lg bg-raised p-3 font-mono text-[13px] leading-relaxed">{q.code}</pre>
      <p className="mt-3 text-sm font-medium">{q.question}</p>
      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {q.options.map((o, i) => (
          <button
            key={i}
            disabled={done}
            onClick={() => {
              setPicked(i);
              answer(topic, q.id, i === q.answerIndex);
            }}
            className={cx(
              'rounded-lg border px-3 py-2 font-mono text-sm',
              done && i === q.answerIndex && 'border-good bg-good/10',
              done && i === picked && i !== q.answerIndex && 'border-bad bg-bad/10',
              !done && 'border-line hover:bg-raised',
            )}
          >
            {o}
          </button>
        ))}
      </div>
      {done && (
        <div className="mt-3 text-sm" role="status">
          <span className={picked === q.answerIndex ? 'text-good' : 'text-bad'}>{picked === q.answerIndex ? 'Correct.' : 'Not quite.'}</span> <span className="text-muted">{q.explanation}</span>
          {picked !== q.answerIndex && (
            <button className="ml-2 text-accent underline" onClick={() => setPicked(null)}>
              Try again
            </button>
          )}
        </div>
      )}
      {!done && earned && <div className="mt-2 text-xs text-good">You got this one before.</div>}
    </div>
  );
}

export default function TopicPage() {
  const { topicId } = useParams();
  const loc = useLocation();
  const s = useStore();
  const valid = TOPICS.some((t) => t.id === topicId);
  const t = topicById((valid ? topicId : 'loops') as TopicId);
  const tp = s.topics[t.id];
  const level = topicLevel(s, t.id);
  const probs = problemsForTopic(t.id);
  const rec = recommendProblem(s, t.id);
  const markTopic = s.markTopic;
  const setResume = s.setResume;

  useEffect(() => {
    setResume(`/learn/${t.id}`, `Learning: ${t.title}`);
    if (loc.hash) document.getElementById(loc.hash.slice(1))?.scrollIntoView();
  }, [t.id, t.title, loc.hash, setResume]);

  const byLevel = [2, 3, 4, 5].map((lvl) => ({ lvl, items: probs.filter((p) => p.level === lvl) })).filter((g) => g.items.length);
  const predictDone = Object.values(tp?.predict ?? {}).filter(Boolean).length;

  return (
    <div className="space-y-6">
      <div>
        <Link to="/learn" className="text-sm text-muted hover:text-ink">
          ← Roadmap
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="h1">{t.title}</h1>
          <Tag tone="supplementary">Supplementary · original explanations</Tag>
        </div>
        <p className="mt-1 text-muted">{t.tagline}</p>
        <div className="mt-3 flex items-center gap-2">
          <LevelDots level={level} />
          <span className="text-sm text-muted">
            Level {level}: {LEVEL_NAMES[level]}
          </span>
        </div>
      </div>

      <Card>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="h2">1 · Understand</h2>
          {tp?.understood && <span className="chip border-good/40 text-good">read</span>}
        </div>
        <div className="prose-tight space-y-3 text-[15px]">
          {t.intuition.map((p, i) => (
            <p key={i}>
              <Md text={p} />
            </p>
          ))}
          <div className="rounded-xl border border-accent/30 bg-accent/5 p-4 text-sm">
            <div className="mb-1 text-xs font-medium uppercase tracking-wide text-accent">Analogy</div>
            {t.analogy}
          </div>
          <p className="text-sm">
            <strong>Key idea:</strong> {t.keyIdea}
          </p>
          <div>
            <div className="label">How to recognise it</div>
            <ul className="space-y-1 text-sm text-muted">
              {t.recognitionCues.map((c) => (
                <li key={c}>• {c}</li>
              ))}
            </ul>
          </div>
        </div>
        {!tp?.understood && (
          <button className="btn-soft mt-4" onClick={() => markTopic(t.id, 'understood')}>
            I've read this. Next: see it move
          </button>
        )}
      </Card>

      <Card>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="h2">2 · Visualize</h2>
          {tp?.visualized && <span className="chip border-good/40 text-good">watched</span>}
        </div>
        <VizPlayer viz={t.visualization} input={t.vizInput} onComplete={() => !tp?.visualized && markTopic(t.id, 'visualized')} />
        <p className="mt-3 text-xs text-muted">{t.complexityNote}</p>
      </Card>

      <Card>
        <div id="predict" className="mb-3 flex items-center justify-between">
          <h2 className="h2">3 · Predict & dry-run</h2>
          <span className="text-xs text-muted">
            {predictDone}/{t.predict.length} correct
          </span>
        </div>
        <p className="mb-3 text-sm text-muted">Trace each snippet on paper before choosing. Guessing teaches nothing; slow tracing teaches a lot.</p>
        <div className="space-y-3">
          {t.predict.map((q) => (
            <Predict key={q.id} q={q} topic={t.id} />
          ))}
        </div>
      </Card>

      {probs.length > 0 && (
        <Card>
          <h2 className="h2 mb-1">4 · Practice ladder</h2>
          {rec && (
            <p className="mb-4 text-sm text-muted">
              Suggested next:{' '}
              <Link className="text-accent hover:underline" to={`/practice/${rec.problem.id}`}>
                {rec.problem.title}
              </Link>
              . {rec.reason}
            </p>
          )}
          <div className="space-y-4">
            {byLevel.map((g) => (
              <div key={g.lvl}>
                <div className="label">
                  Level {g.lvl} · {LADDER_LABEL[g.lvl]}
                </div>
                <ul className="grid gap-2 sm:grid-cols-2">
                  {g.items.map((p) => {
                    const b = bestOutcome(s, p.id);
                    return (
                      <li key={p.id}>
                        <Link to={`/practice/${p.id}`} className="flex items-center justify-between gap-2 rounded-xl border border-line p-3 hover:bg-raised">
                          <div>
                            <div className="text-sm font-medium">{p.title}</div>
                            <div className="text-xs text-muted">{p.pattern}</div>
                          </div>
                          {b ? <OutcomeBadge outcome={b} /> : <span className="chip">new</span>}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card>
        <h2 className="h2 mb-2">5 · Revision</h2>
        <p className="text-sm text-muted">
          Every problem you solve gets recall sessions on roughly day 1, 3, 5, 7 and 14, then adapts to how well you remember. Due ones appear on your{' '}
          <Link to="/" className="text-accent hover:underline">
            Today
          </Link>{' '}
          page and in{' '}
          <Link to="/review" className="text-accent hover:underline">
            Revise
          </Link>
          .
        </p>
      </Card>
    </div>
  );
}
