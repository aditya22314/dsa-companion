import { useRef } from 'react';
import { useStore, STORAGE_KEY } from '../store';
import { Card, PageHeader, cx } from '../components/ui';
import type { LearnerState } from '../store/types';

export default function Settings() {
  const s = useStore();
  const fileRef = useRef<HTMLInputElement>(null);

  const exportData = () => {
    const raw = localStorage.getItem(STORAGE_KEY) ?? '{}';
    const blob = new Blob([raw], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `dsa-companion-backup-${s.today()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" />
      <Card className="space-y-3">
        <h2 className="h2">Appearance</h2>
        <div className="flex gap-2" role="radiogroup" aria-label="Theme">
          {(['dark', 'light'] as const).map((t) => (
            <button key={t} role="radio" aria-checked={s.theme === t} onClick={() => s.setTheme(t)} className={cx('rounded-lg border px-4 py-2 text-sm capitalize', s.theme === t ? 'border-accent bg-accent/15' : 'border-line')}>
              {t}
            </button>
          ))}
        </div>
      </Card>

      <Card className="space-y-3">
        <h2 className="h2">Profile</h2>
        <label className="block max-w-sm">
          <span className="label">Name</span>
          <input className="input" value={s.profile.name} onChange={(e) => s.updateProfile({ name: e.target.value })} />
        </label>
        <label className="block max-w-sm">
          <span className="label">Default study mode</span>
          <select className="input" value={s.profile.defaultMode} onChange={(e) => s.updateProfile({ defaultMode: e.target.value as typeof s.profile.defaultMode })}>
            <option value="minimum">Minimum Day (10 min)</option>
            <option value="normal">Normal Day (25 min)</option>
            <option value="deep">Deep Focus (45–60 min)</option>
          </select>
        </label>
      </Card>

      <Card className="space-y-2 text-sm">
        <h2 className="h2">Where your data lives</h2>
        <p className="text-muted">Everything is stored in this browser. Nothing is sent anywhere. Export a backup now and then so you never lose your history.</p>
      </Card>

      <Card className="space-y-3">
        <h2 className="h2">Your data</h2>
        <div className="flex flex-wrap gap-2">
          <button className="btn-soft" onClick={exportData}>
            Export backup
          </button>
          <button className="btn-soft" onClick={() => fileRef.current?.click()}>
            Import backup
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              try {
                const parsed = JSON.parse(await f.text()) as { state?: LearnerState };
                if (!parsed.state?.profile) throw new Error('Not a DSA Companion backup');
                s.importAll(parsed.state);
                alert('Backup restored.');
              } catch (err) {
                alert(err instanceof Error ? err.message : 'Could not import that file');
              }
            }}
          />
          <button
            className="btn-ghost border-bad/40 text-bad"
            onClick={() => {
              if (confirm('Delete all progress on this device? Export a backup first if you might want it.')) s.resetAll();
            }}
          >
            Reset everything
          </button>
        </div>
      </Card>
    </div>
  );
}
