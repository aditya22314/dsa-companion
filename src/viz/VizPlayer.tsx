import { useEffect, useMemo, useState } from 'react';
import type { VizId } from '../content/types';
import { cx } from '../components/ui';
import { buildTrace } from './traces';

const POINTER_COLORS: Record<string, string> = { l: 'text-accent', r: 'text-warn', i: 'text-accent', w: 'text-good', lo: 'text-accent', hi: 'text-warn', mid: 'text-good' };

export function VizPlayer({ viz, input, target, onComplete, title }: { viz: VizId; input: number[] | string; target?: number; onComplete?: () => void; title?: string }) {
  const frames = useMemo(() => buildTrace(viz, input, target), [viz, input, target]);
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(false);
  const f = frames[Math.min(i, frames.length - 1)];

  useEffect(() => {
    if (!playing) return;
    if (i >= frames.length - 1) {
      setPlaying(false);
      return;
    }
    const t = setTimeout(() => setI((x) => x + 1), 1100);
    return () => clearTimeout(t);
  }, [playing, i, frames.length]);

  useEffect(() => {
    if (i === frames.length - 1) onComplete?.();
  }, [i, frames.length, onComplete]);

  const maxBar = f.bars ? Math.max(...f.bars.map((b) => b.value)) : 1;

  return (
    <div className="rounded-2xl border border-line bg-raised/40 p-4">
      {title && <div className="mb-3 text-xs font-medium uppercase tracking-wide text-muted">{title}</div>}

      {f.cells.length > 0 && (
        <div className="overflow-x-auto pb-2">
          <div className="flex min-w-max gap-1.5">
            {f.cells.map((c, idx) => {
              const inWindow = f.window && idx >= f.window[0] && idx <= f.window[1];
              const dim = f.dimOutside && (idx < f.dimOutside[0] || idx > f.dimOutside[1]);
              const labels = Object.entries(f.pointers).filter(([, v]) => v === idx).map(([k]) => k);
              return (
                <div key={idx} className="flex flex-col items-center">
                  <div className="mb-1 h-4 text-[10px] text-muted">{idx}</div>
                  <div
                    className={cx(
                      'flex h-11 w-11 items-center justify-center rounded-lg border font-mono text-sm transition-all',
                      f.active?.includes(idx) ? 'animate-pop border-accent bg-accent/20 text-ink' : 'border-line bg-surface',
                      inWindow && 'ring-2 ring-warn/60',
                      f.done?.includes(idx) && !f.active?.includes(idx) && 'border-good/40',
                      dim && 'opacity-25',
                    )}
                  >
                    {String(c)}
                  </div>
                  <div className="mt-1 flex h-4 gap-1 font-mono text-[11px] font-semibold">
                    {labels.map((l) => (
                      <span key={l} className={POINTER_COLORS[l] ?? 'text-accent'}>
                        {l}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {f.stack && (
        <div className="flex min-h-[9rem] flex-col-reverse items-start gap-1">
          {f.stack.length === 0 && <div className="text-sm text-muted">(empty call stack)</div>}
          {f.stack.map((s, idx) => (
            <div key={idx} className={cx('rounded-md border px-3 py-1 font-mono text-sm', idx === f.stack!.length - 1 ? 'border-accent bg-accent/15' : 'border-line bg-surface')}>
              {s}
            </div>
          ))}
        </div>
      )}

      {f.bars && (
        <div className="space-y-1.5">
          {f.bars.map((b) => (
            <div key={b.label} className="flex items-center gap-2 text-xs">
              <span className="w-20 font-mono text-muted">{b.label}</span>
              <div className="h-3 flex-1 rounded bg-surface">
                <div className="h-3 rounded bg-accent/70 transition-all" style={{ width: `${Math.max(1, (b.value / maxBar) * 100)}%` }} />
              </div>
              <span className="w-14 text-right font-mono">{Math.round(b.value)}</span>
            </div>
          ))}
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-2 font-mono text-xs">
        {Object.entries(f.vars).map(([k, v]) => (
          <span key={k} className="rounded-md bg-surface px-2 py-1">
            <span className="text-muted">{k}</span> = {String(v)}
          </span>
        ))}
        {f.map && f.map.length > 0 && (
          <span className="rounded-md bg-surface px-2 py-1">
            <span className="text-muted">map</span> {'{ '}
            {f.map.map(([k, v]) => `${k}: ${v}`).join(', ')}
            {' }'}
          </span>
        )}
      </div>

      <p className="mt-3 min-h-[2.5rem] text-sm" aria-live="polite">
        {f.note}
      </p>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button className="btn-soft px-3 py-1.5" onClick={() => setI(0)} aria-label="Restart">
          ⟲
        </button>
        <button className="btn-soft px-3 py-1.5" onClick={() => setI((x) => Math.max(0, x - 1))} disabled={i === 0} aria-label="Previous step">
          ←
        </button>
        <button className="btn-primary px-3 py-1.5" onClick={() => (i >= frames.length - 1 ? (setI(0), setPlaying(true)) : setPlaying((p) => !p))}>
          {playing ? 'Pause' : i >= frames.length - 1 ? 'Replay' : 'Play'}
        </button>
        <button className="btn-soft px-3 py-1.5" onClick={() => setI((x) => Math.min(frames.length - 1, x + 1))} disabled={i >= frames.length - 1} aria-label="Next step">
          →
        </button>
        <span className="ml-auto text-xs text-muted">
          Step {i + 1} / {frames.length}
        </span>
      </div>
    </div>
  );
}
