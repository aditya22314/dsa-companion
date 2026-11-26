import { useState } from 'react';
import type { Problem } from '../content/types';
import { topicById } from '../content/topics';
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

export function Mentor({ problem, revealed, onReveal }: { problem: Problem; code?: string; hintsUsed?: number; revealed: number; onReveal: (n: number) => void }) {
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [open, setOpen] = useState<number>(Math.min(revealed, STEPS.length - 1));

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

    </div>
  );
}
