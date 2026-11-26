import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../store';
import { lessonDemonstrated, parseLessonImport, problemsForLesson, SYLLABUS_SOURCE, topicsForModule } from '../lib/engine/course';
import { diagnosePrerequisites } from '../lib/engine/adaptive';
import { bestOutcome } from '../lib/engine/mastery';
import { topicById } from '../content/topics';
import { Card, Meter, OutcomeBadge, PageHeader, Tag, cx } from '../components/ui';
import type { CourseLesson } from '../store/types';

export default function Course() {
  const s = useStore();
  const [open, setOpen] = useState<number | null>(s.profile.namasteModule || 2);
  const [importing, setImporting] = useState(false);
  const [text, setText] = useState('');
  const [mode, setMode] = useState<'replace' | 'merge'>('merge');
  const [importErr, setImportErr] = useState('');
  const [hard, setHard] = useState<string | null>(null);

  const modules = useMemo(() => {
    const m = new Map<number, { order: number; name: string; lessons: CourseLesson[] }>();
    for (const l of s.courseLessons) {
      if (!m.has(l.module)) m.set(l.module, { order: l.module, name: l.moduleName, lessons: [] });
      m.get(l.module)!.lessons.push(l);
    }
    return [...m.values()].sort((a, b) => a.order - b.order);
  }, [s.courseLessons]);

  const imported = s.courseLessons.some((l) => l.source === 'imported');
  const preview = useMemo(() => {
    try {
      return parseLessonImport(text);
    } catch {
      return [];
    }
  }, [text]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Namaste DSA companion"
        subtitle="Track the lessons you've watched separately from what you've shown you can solve. Practice here is supplementary and original; it prepares you for the course problems rather than replacing them."
        right={
          <button className="btn-ghost" onClick={() => setImporting((v) => !v)}>
            {importing ? 'Close import' : 'Import my lesson list'}
          </button>
        }
      />

      <Card className="text-sm">
        <div className="flex flex-wrap items-center gap-2">
          <Tag tone="verified">Verified public syllabus</Tag>
          <span className="text-muted">
            Lesson titles and order from the public course page (
            <a href={SYLLABUS_SOURCE.url} target="_blank" rel="noreferrer" className="text-accent hover:underline">
              namastedev.com
            </a>
            , retrieved {SYLLABUS_SOURCE.retrievedOn}). No paid content is included.
          </span>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Tag tone="supplementary">Supplementary</Tag>
          <span className="text-muted">Practice problems, explanations and bridges written for this app.</span>
          {imported && (
            <>
              <Tag tone="imported">Imported</Tag>
              <span className="text-muted">Lessons you pasted from your purchased course.</span>
            </>
          )}
        </div>
      </Card>

      {importing && (
        <Card className="space-y-3">
          <h2 className="h2">Import your lesson list</h2>
          <p className="text-sm text-muted">
            Paste the lesson titles from your course dashboard. Use a heading line per module (<code className="code-inline"># Warm Up</code> or <code className="code-inline">Warm Up:</code>) followed by one lesson per line, or{' '}
            <code className="code-inline">Module &gt; Lesson</code> per line, or JSON <code className="code-inline">[{'{"module":"…","title":"…"}'}]</code>. Only titles are stored, locally on this device.
          </p>
          <textarea className="input min-h-[160px] font-mono" value={text} onChange={(e) => setText(e.target.value)} placeholder={'# Warm Up\nSecond Largest\nCount Digit\n\n# Arrays - Easy/Medium\nRemove Duplicates'} />
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <label className="flex items-center gap-2">
              <input type="radio" checked={mode === 'merge'} onChange={() => setMode('merge')} /> Merge with the public list
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" checked={mode === 'replace'} onChange={() => setMode('replace')} /> Replace it
            </label>
            <span className="text-muted">{preview.length} lessons detected</span>
          </div>
          {importErr && <p className="text-sm text-bad">{importErr}</p>}
          <div className="flex gap-2">
            <button
              className="btn-primary"
              disabled={!preview.length}
              onClick={() => {
                try {
                  s.importLessons(parseLessonImport(text), mode);
                  setImporting(false);
                  setText('');
                } catch (e) {
                  setImportErr(e instanceof Error ? e.message : 'Could not parse that list.');
                }
              }}
            >
              Import {preview.length} lessons
            </button>
            {imported && (
              <button className="btn-ghost" onClick={() => s.resetLessons()}>
                Reset to public syllabus
              </button>
            )}
          </div>
        </Card>
      )}

      <div className="space-y-3">
        {modules
          .filter((m) => m.lessons.length > 0)
          .map((m) => {
            const watched = m.lessons.filter((l) => s.lessonStatus[l.key]?.watched).length;
            const demo = m.lessons.filter((l) => lessonDemonstrated(s, l)).length;
            const topics = topicsForModule(m.order);
            const isOpen = open === m.order;
            return (
              <Card key={m.order} className="p-0">
                <button className="flex w-full flex-wrap items-center gap-3 p-4 text-left" onClick={() => setOpen(isOpen ? null : m.order)} aria-expanded={isOpen}>
                  <span className="w-8 font-mono text-xs text-muted">{m.order < 100 ? String(m.order).padStart(2, '0') : '—'}</span>
                  <span className="min-w-0 flex-1 font-medium">{m.name}</span>
                  <span className="w-40">
                    <span className="mb-1 flex justify-between text-[11px] text-muted">
                      <span>watched {watched}/{m.lessons.length}</span>
                      <span>shown {demo}</span>
                    </span>
                    <Meter value={watched} max={m.lessons.length} />
                  </span>
                  <span className="text-muted" aria-hidden>
                    {isOpen ? '−' : '+'}
                  </span>
                </button>
                {isOpen && (
                  <div className="border-t border-line">
                    {topics.length > 0 && (
                      <div className="flex flex-wrap items-center gap-2 px-4 pt-3 text-xs text-muted">
                        Prepare with:
                        {topics.map((t) => (
                          <Link key={t} to={`/learn/${t}`} className="chip hover:border-accent hover:text-accent">
                            {topicById(t).title}
                          </Link>
                        ))}
                      </div>
                    )}
                    <ul className="divide-y divide-line">
                      {m.lessons.map((l) => {
                        const st = s.lessonStatus[l.key];
                        const probs = problemsForLesson(l);
                        const shown = lessonDemonstrated(s, l);
                        return (
                          <li key={l.key} className="px-4 py-3">
                            <div className="flex flex-wrap items-center gap-3">
                              <label className="flex items-center gap-2 text-sm">
                                <input type="checkbox" checked={!!st?.watched} onChange={(e) => s.setLessonWatched(l.key, e.target.checked)} aria-label={`Watched ${l.title}`} />
                                <span className={cx(st?.watched && 'text-muted')}>{l.title}</span>
                              </label>
                              {l.source === 'imported' && <Tag tone="imported">imported</Tag>}
                              {shown ? <span className="chip border-good/40 text-good">understanding shown</span> : st?.watched ? <span className="chip">watched, not yet shown</span> : null}
                              <span className="ml-auto flex items-center gap-2">
                                {l.url && (
                                  <a href={l.url} target="_blank" rel="noreferrer" className="text-xs text-accent hover:underline">
                                    Open lesson ↗
                                  </a>
                                )}
                                <button className="text-xs text-muted hover:text-warn" onClick={() => setHard(hard === l.key ? null : l.key)}>
                                  Too hard?
                                </button>
                              </span>
                            </div>
                            {probs.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-2 pl-6">
                                {probs.map((p) => {
                                  const b = bestOutcome(s, p.id);
                                  return (
                                    <Link key={p.id} to={`/practice/${p.id}`} className="flex items-center gap-1.5 rounded-lg border border-line px-2 py-1 text-xs hover:bg-raised">
                                      <span className="text-accent">practice</span> {p.title} {b && <OutcomeBadge outcome={b} />}
                                    </Link>
                                  );
                                })}
                              </div>
                            )}
                            {hard === l.key && <TooHard lesson={l} />}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </Card>
            );
          })}
      </div>
    </div>
  );
}

function TooHard({ lesson }: { lesson: CourseLesson }) {
  const s = useStore();
  const probs = problemsForLesson(lesson);
  const topics = topicsForModule(lesson.module);
  const fallback = topics;
  const d = diagnosePrerequisites(s, probs.length ? probs.map((p) => p.id) : []);
  const weak = probs.length ? d.weakTopics : fallback;
  return (
    <div className="mt-3 space-y-2 rounded-xl border border-warn/40 bg-warn/5 p-3 text-sm">
      <p>
        That's useful information, not a failure. Course problems often assume a few smaller skills. Build those first, then come back to <strong>{lesson.title}</strong>.
      </p>
      {weak.length > 0 && (
        <div>
          <span className="label">Skills to strengthen</span>
          <div className="flex flex-wrap gap-2">
            {weak.map((t) => (
              <Link key={t} to={`/learn/${t}`} className="chip hover:border-accent hover:text-accent">
                {topicById(t).title}
              </Link>
            ))}
          </div>
        </div>
      )}
      {d.bridges.length > 0 && (
        <div>
          <span className="label">Bridge exercises, easiest first</span>
          <ol className="space-y-1">
            {d.bridges.map((p) => (
              <li key={p.id}>
                <Link to={`/practice/${p.id}`} className="text-accent hover:underline">
                  Level {p.level}: {p.title}
                </Link>{' '}
                <span className="text-xs text-muted">({p.pattern})</span>
              </li>
            ))}
          </ol>
        </div>
      )}
      {!d.bridges.length && !weak.length && <p className="text-muted">No bridge exercises are mapped to this lesson yet. Try the recognition cues of the related topic, then re-watch with a notebook and pause before each solution.</p>}
    </div>
  );
}
