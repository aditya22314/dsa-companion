/// <reference lib="webworker" />
// Sandboxed code runner. Runs in a dedicated Worker: no DOM, no access to app state or storage.
// The main thread terminates this worker on timeout (infinite loops) and creates a fresh one per run.
import { compileUserFunction, evaluate, formatValue } from './judge';
import type { TestCase } from '../content/types';

interface RunRequest {
  code: string;
  functionName: string;
  tests: TestCase[];
  mode: 'run' | 'test';
}

const scope = self as unknown as Record<string, unknown>;
// Remove network and import capabilities from user code.
for (const k of ['fetch', 'XMLHttpRequest', 'WebSocket', 'importScripts', 'EventSource', 'indexedDB', 'caches', 'BroadcastChannel']) {
  try {
    Object.defineProperty(scope, k, { value: undefined, configurable: false, writable: false });
  } catch {
    /* ignore */
  }
}

self.onmessage = (e: MessageEvent<RunRequest>) => {
  const { code, functionName, tests, mode } = e.data;
  const logs: string[] = [];
  const push = (...a: unknown[]) => {
    if (logs.length < 200) logs.push(a.map((x) => (typeof x === 'string' ? x : formatValue(x))).join(' '));
  };
  console.log = push;
  console.info = push;
  console.warn = push;
  console.error = push;
  const started = performance.now();
  try {
    const fn = compileUserFunction(code, functionName);
    const subset = mode === 'run' ? tests.filter((t) => !t.hidden) : tests;
    const results = evaluate(fn, subset);
    self.postMessage({ ok: true, results, logs, ms: performance.now() - started });
  } catch (err) {
    self.postMessage({ ok: false, error: err instanceof Error ? `${err.name}: ${err.message}` : String(err), logs, results: [], ms: 0 });
  }
};
