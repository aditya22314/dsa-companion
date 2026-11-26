import { useState } from 'react';
import type { Problem } from '../content/types';
import { topicById } from '../content/topics';
import { api } from '../lib/api';
import { useHealth } from '../lib/useHealth';
import { cx } from './ui';

const STEPS = [
  { id: 'restate', title: 'Explain the problem in your own words', prompt: 'Without looking at the examples, what is this problem asking for? One or two sentences.' },
  { id: 'io', title: 'Inputs, outputs and constraints', prompt: 'What exactly comes in, what should come out, and what limits matter?' },
  { id: 'examples', title: 'Small examples and edge cases', prompt: 'Write a tiny example of your own and its answer. Then list one input that might break a naive solution.' },
  { id: 'brute', title: 'Brute force first', prompt: 'Forget efficiency. How would you solve it by hand, or by trying everything?' },
  { id: 'pattern', title: 'Which pattern fits?', prompt: 'What does the brute force repeat or waste? Which pattern could avoid that?' },
  { id: 'pseudo', title: 'Pseudocode', prompt: 'Write the steps in plain words before any JavaScript.' },
  { id: 'implement', title: 'Implement it yourself', prompt: 'Translate your pseudocode line by line. Run it on your small example.' },
  { id: 'review', title: 'Mistakes and complexity', prompt: 'If tests fail, which case? What is the time and space complexity of your solution?' },
] as const;

function guidance(p: Problem, id: (typeof STEPS)[number]['id']): string[] {
  const m = p.mentor;
  const t = topicById(p.topic);
  switch (id) {
    case 'restate':
      return ['Compare with yours: ' + p.statement.replace(/\*\*/g, '').replace(/`/g, '')];
    case 'io':
      return [m.io, ...p.constraints.map((c) => `Constraint: ${c}`)];
    case 'examples':
      return ['Edge cases worth testing:', ...m.edgeCases.map((e) => `• ${e}`)];
    case 'brute':
      return [m.bruteForce];
    case 'pattern':
      return [m.patternNudge, 'Recognition cues for this topic:', ...t.recognitionCues.map((c) => `• ${c}`)];
    case 'pseudo':
      return m.pseudocode.map((l, i) => `${i + 1}. ${l}`);
    case 'implement':
      return ['Write it in the editor. If a test fails, read the failing input and trace your code by hand on exactly that input.'];
    case 'review':
      return [`Expected complexity: ${p.complexity.time} time, ${p.complexity.space} space. ${p.complexity.why}`, 'Common mistakes:', ...m.commonMistakes.map((c) => `• ${c}`)];
  }
}

export function Mentor({ problem, code, hintsUsed, revealed, onReveal }: { problem: Problem; code: string; hintsUsed: number; revealed: number; onReveal: (n: number) => void }) {
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [open, setOpen] = useState<number>(Math.min(revealed, STEPS.length - 1));
  const health = useHealth();
  const [chat, setChat] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const send = async (allowSolution = false) => {
    if (!msg.trim() && !allowSolution) return;
    const content = allowSolution ? 'I would like to see the complete solution now, with an explanation.' : msg.trim();
    const next = [...chat, { role: 'user' as const, content }];
    setChat(next);
    setMsg('');
    setBusy(true);
    setErr('');
    onReveal(revealed + 1);
    try {
      const r = await api.tutor({
        problem: { title: problem.title, statement: problem.statement, pattern: problem.pattern, constraints: problem.constraints },
        code,
        hintsUsed,
        allowSolution,
        messages: next,
      });
      setChat([...next, { role: 'assistant', content: r.reply }]);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'The tutor is unavailable.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted">Work through these in order. Write your own answer first, then compare. Each comparison you open counts as guidance, which keeps your progress honest.</p>
      <ol className="space-y-2">
        {STEPS.map((st, i) => {
          const isOpen = open === i;
          const shown = i < revealed;
          return (
            <li key={st.id} className={cx('rounded-xl border', isOpen ? 'border-accent/50' : 'border-line')}>
              <button className="flex w-full items-center gap-3 p-3 text-left" onClick={() => setOpen(isOpen ? -1 : i)} aria-expanded={isOpen}>
                <span className={cx('flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs', shown ? 'bg-accent text-white' : 'bg-raised text-muted')}>{i + 1}</span>
                <span className="text-sm font-medium">{st.title}</span>
              </button>
              {isOpen && (
                <div className="space-y-2 px-3 pb-3">
                  <p className="text-sm">{st.prompt}</p>
                  <textarea className="input min-h-[64px]" value={notes[st.id] ?? ''} onChange={(e) => setNotes({ ...notes, [st.id]: e.target.value })} placeholder="Your thinking…" aria-label={st.title} />
                  {shown ? (
                    <div className="rounded-lg bg-raised p-3 text-sm">
                      {guidance(problem, st.id).map((l, k) => (
                        <p key={k} className="leading-relaxed">
                          {l}
                        </p>
                      ))}
                    </div>
                  ) : (
                    <button
                      className="btn-soft"
                      onClick={() => {
                        onReveal(Math.max(revealed, i + 1));
                      }}
                    >
                      Compare with the mentor
                    </button>
                  )}
                  {shown && i < STEPS.length - 1 && (
                    <button className="text-sm text-accent hover:underline" onClick={() => setOpen(i + 1)}>
                      Next step →
                    </button>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ol>

      <div className="rounded-xl border border-line p-3">
        <div className="mb-2 flex items-center justify-between">
          <div className="text-sm font-medium">Talk it through</div>
          <span className="chip">{health.aiConfigured ? `AI tutor · ${health.aiModel}` : 'AI tutor not connected'}</span>
        </div>
        {!health.aiConfigured ? (
          <p className="text-xs text-muted">The scripted mentor above works without any API. To enable conversational tutoring, set ANTHROPIC_API_KEY on the server (see the README). The key stays on the server.</p>
        ) : (
          <>
            <div className="max-h-72 space-y-2 overflow-y-auto">
              {chat.map((c, i) => (
                <div key={i} className={cx('whitespace-pre-wrap rounded-lg p-2 text-sm', c.role === 'user' ? 'ml-6 bg-accent/10' : 'mr-6 bg-raised')}>
                  {c.content}
                </div>
              ))}
              {busy && <div className="text-xs text-muted">Thinking…</div>}
              {err && <div className="text-xs text-bad">{err}</div>}
            </div>
            <div className="mt-2 flex gap-2">
              <input className="input" value={msg} onChange={(e) => setMsg(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} placeholder="Explain where you're stuck…" aria-label="Message the tutor" />
              <button className="btn-primary" onClick={() => send()} disabled={busy || !msg.trim()}>
                Send
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
