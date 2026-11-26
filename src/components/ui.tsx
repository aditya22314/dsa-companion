import clsx from 'clsx';
import type { ReactNode } from 'react';
import type { Outcome } from '../../shared/types';
import { OUTCOMES } from '../../shared/types';

export const cx = clsx;

export function Card({ className, children, as: As = 'section' }: { className?: string; children: ReactNode; as?: 'section' | 'div' | 'article' }) {
  return <As className={cx('card p-5', className)}>{children}</As>;
}

export function PageHeader({ title, subtitle, right }: { title: string; subtitle?: ReactNode; right?: ReactNode }) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="h1">{title}</h1>
        {subtitle && <p className="mt-1 max-w-2xl text-sm text-muted">{subtitle}</p>}
      </div>
      {right}
    </header>
  );
}

export function Meter({ value, max = 1, label, tone = 'accent' }: { value: number; max?: number; label?: string; tone?: 'accent' | 'good' | 'warn' }) {
  const pct = Math.max(0, Math.min(100, (value / (max || 1)) * 100));
  return (
    <div aria-label={label} role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-raised">
        <div className={cx('h-full rounded-full transition-all', tone === 'good' ? 'bg-good' : tone === 'warn' ? 'bg-warn' : 'bg-accent')} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

const OUTCOME_TONE: Record<Outcome, string> = {
  independent: 'border-good/40 text-good',
  'small-hints': 'border-accent/40 text-accent',
  guided: 'border-warn/40 text-warn',
  'saw-solution': 'border-bad/30 text-bad/90',
  unable: 'border-bad/40 text-bad',
};

export function OutcomeBadge({ outcome }: { outcome: Outcome }) {
  return <span className={cx('chip', OUTCOME_TONE[outcome])}>{OUTCOMES.find((o) => o.id === outcome)!.short}</span>;
}

export function LevelDots({ level, max = 6 }: { level: number; max?: number }) {
  return (
    <span className="inline-flex gap-1" aria-label={`Level ${level} of ${max}`}>
      {Array.from({ length: max }, (_, i) => (
        <span key={i} className={cx('h-1.5 w-3 rounded-full', i < level ? 'bg-accent' : 'bg-line')} />
      ))}
    </span>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="rounded-xl border border-dashed border-line p-6 text-center text-sm text-muted">{children}</div>;
}

export function Tag({ children, tone }: { children: ReactNode; tone?: 'verified' | 'supplementary' | 'imported' }) {
  return (
    <span
      className={cx(
        'chip',
        tone === 'verified' && 'border-good/40 text-good',
        tone === 'supplementary' && 'border-accent/40 text-accent',
        tone === 'imported' && 'border-warn/40 text-warn',
      )}
    >
      {children}
    </span>
  );
}

export function Stars({ value, onChange, label }: { value?: number; onChange: (v: number) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} of 5`}
          onClick={() => onChange(n)}
          className={cx('h-8 w-8 rounded-lg border text-sm font-medium', value && n <= value ? 'border-accent bg-accent/15 text-accent' : 'border-line text-muted hover:bg-raised')}
        >
          {n}
        </button>
      ))}
    </div>
  );
}
