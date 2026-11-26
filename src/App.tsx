import { Suspense, lazy, useEffect } from 'react';
import { NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useStore } from './store';
import { cx } from './components/ui';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import Learn from './pages/Learn';
import TopicPage from './pages/TopicPage';
import PracticeList from './pages/PracticeList';
import ReviewList from './pages/ReviewList';
import Journal from './pages/Journal';
import Settings from './pages/Settings';

const Playground = lazy(() => import('./pages/Playground'));
const ReviewSession = lazy(() => import('./pages/ReviewSession'));
const Progress = lazy(() => import('./pages/Progress'));
import DailyPlan from './pages/DailyPlan';
const Course = lazy(() => import('./pages/Course'));

const NAV = [
  { to: '/', label: 'Today', icon: '◎' },
  { to: '/plan', label: 'Daily plan', icon: '▦' },
  { to: '/learn', label: 'Learn', icon: '◇' },
  { to: '/practice', label: 'Practice', icon: '{}' },
  { to: '/review', label: 'Revise', icon: '↻' },
  { to: '/course', label: 'Namaste DSA', icon: '▤' },
  { to: '/journal', label: 'Mistakes', icon: '✎' },
  { to: '/progress', label: 'Progress', icon: '▥' },
  { to: '/settings', label: 'Settings', icon: '⚙' },
];

export default function App() {
  const onboarded = useStore((s) => s.profile.onboarded);
  const theme = useStore((s) => s.theme);
  const dueCount = useStore((s) => Object.values(s.reviews).filter((r) => r.due <= s.today()).length);
  const loc = useLocation();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  if (!onboarded && loc.pathname !== '/onboarding') return <Navigate to="/onboarding" replace />;
  if (loc.pathname === '/onboarding') return <Onboarding />;

  return (
    <div className="flex min-h-full">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-accent focus:px-3 focus:py-1 focus:text-white">
        Skip to content
      </a>
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-line bg-surface/60 p-4 backdrop-blur md:flex">
        <div className="mb-6 px-2">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent font-mono text-sm font-bold text-white">{'{}'}</span>
            <div>
              <div className="text-sm font-semibold leading-tight">DSA Companion</div>
              <div className="text-[11px] text-muted">Learn · Solve · Remember</div>
            </div>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-0.5" aria-label="Main">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.to === '/'}
              className={({ isActive }) => cx('flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors', isActive ? 'bg-accent/15 font-medium text-ink' : 'text-muted hover:bg-raised hover:text-ink')}
            >
              <span className="w-5 text-center font-mono text-xs" aria-hidden>
                {n.icon}
              </span>
              {n.label}
              {n.to === '/review' && dueCount > 0 && <span className="ml-auto rounded-full bg-accent/20 px-2 text-xs text-accent">{dueCount}</span>}
            </NavLink>
          ))}
        </nav>
        <p className="px-2 text-[11px] leading-snug text-muted">A personal companion to the Namaste DSA course. Not affiliated with NamasteDev.</p>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 pb-24 pt-6 md:px-8 md:pb-10">
          <Suspense fallback={<div className="text-sm text-muted">Loading…</div>}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/learn" element={<Learn />} />
            <Route path="/learn/:topicId" element={<TopicPage />} />
            <Route path="/practice" element={<PracticeList />} />
            <Route path="/practice/:problemId" element={<Playground />} />
            <Route path="/review" element={<ReviewList />} />
            <Route path="/review/:problemId" element={<ReviewSession />} />
            <Route path="/course" element={<Course />} />
            <Route path="/journal" element={<Journal />} />
            <Route path="/progress" element={<Progress />} />
            <Route path="/plan" element={<DailyPlan />} />
            <Route path="/schedule" element={<Navigate to="/plan" replace />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          </Suspense>
        </main>
        <nav className="fixed inset-x-0 bottom-0 z-40 flex justify-around border-t border-line bg-surface/95 px-1 py-1.5 backdrop-blur md:hidden" aria-label="Mobile">
          {NAV.filter((n) => ['/', '/plan', '/learn', '/practice', '/review'].includes(n.to)).map((n) => (
            <NavLink key={n.to} to={n.to} end={n.to === '/'} className={({ isActive }) => cx('flex flex-col items-center rounded-lg px-3 py-1 text-[11px]', isActive ? 'text-accent' : 'text-muted')}>
              <span className="font-mono text-sm" aria-hidden>
                {n.icon}
              </span>
              {n.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}
