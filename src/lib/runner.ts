import type { TestCase } from '../content/types';
import type { TestResult } from './judge';

export interface RunResponse {
  ok: boolean;
  results: TestResult[];
  logs: string[];
  ms: number;
  error?: string;
  timedOut?: boolean;
}

/**
 * Executes learner code in an isolated Web Worker with a hard timeout.
 * A fresh worker is used for each run so state never leaks between attempts.
 */
export function runInSandbox(code: string, functionName: string, tests: TestCase[], mode: 'run' | 'test', timeoutMs = 2000): Promise<RunResponse> {
  return new Promise((resolve) => {
    const worker = new Worker(new URL('./runner.worker.ts', import.meta.url), { type: 'module' });
    const timer = setTimeout(() => {
      worker.terminate();
      resolve({
        ok: false,
        results: [],
        logs: [],
        ms: timeoutMs,
        timedOut: true,
        error: `Stopped after ${timeoutMs / 1000}s. This usually means an infinite loop: check that your loop variable moves toward the exit condition.`,
      });
    }, timeoutMs);
    worker.onmessage = (e: MessageEvent<RunResponse>) => {
      clearTimeout(timer);
      worker.terminate();
      resolve(e.data);
    };
    worker.onerror = (e) => {
      clearTimeout(timer);
      worker.terminate();
      resolve({ ok: false, results: [], logs: [], ms: 0, error: e.message || 'Your code could not be parsed.' });
    };
    worker.postMessage({ code, functionName, tests, mode });
  });
}
