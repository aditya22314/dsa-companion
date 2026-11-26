import type { TestCase } from '../content/types';

export interface TestResult {
  index: number;
  passed: boolean;
  hidden: boolean;
  input: string;
  expected: string;
  received: string;
  error?: string;
  note?: string;
}

export function deepEqual(a: unknown, b: unknown, unordered = false): boolean {
  if (Object.is(a, b)) return true;
  if (typeof a !== typeof b || a === null || b === null || typeof a !== 'object') return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    if (unordered) {
      const key = (x: unknown) => JSON.stringify(x);
      const sa = a.map(key).sort();
      const sb = b.map(key).sort();
      return sa.every((x, i) => x === sb[i]);
    }
    return a.every((x, i) => deepEqual(x, b[i]));
  }
  if (a instanceof Map && b instanceof Map) {
    if (a.size !== b.size) return false;
    for (const [k, v] of a) if (!b.has(k) || !deepEqual(v, b.get(k))) return false;
    return true;
  }
  const ka = Object.keys(a as object);
  const kb = Object.keys(b as object);
  if (ka.length !== kb.length) return false;
  return ka.every((k) => deepEqual((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k]));
}

export function formatValue(v: unknown): string {
  if (v === undefined) return 'undefined';
  if (typeof v === 'string') return JSON.stringify(v);
  if (typeof v === 'number' && !Number.isFinite(v)) return String(v);
  if (v instanceof Map) return `Map(${JSON.stringify([...v.entries()])})`;
  if (v instanceof Set) return `Set(${JSON.stringify([...v])})`;
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

export const formatArgs = (args: unknown[]) => args.map(formatValue).join(', ');

const clone = <T,>(v: T): T => (typeof structuredClone === 'function' ? structuredClone(v) : JSON.parse(JSON.stringify(v)));

/** Runs a user function against test cases. Pure: works in a Worker, in Node tests, anywhere. */
export function evaluate(fn: (...args: unknown[]) => unknown, tests: TestCase[]): TestResult[] {
  return tests.map((t, index) => {
    const args = clone(t.args);
    const base = { index, hidden: !!t.hidden, input: formatArgs(t.args), expected: formatValue(t.expected) };
    try {
      const out = fn(...args);
      let passed = deepEqual(out, t.expected, t.unordered);
      let note: string | undefined;
      if (passed && t.argCheck) {
        const arg = args[t.argCheck.index];
        const prefix = Array.isArray(arg) ? arg.slice(0, t.argCheck.expected.length) : arg;
        if (!deepEqual(prefix, t.argCheck.expected)) {
          passed = false;
          note = `The input array should be modified in place to start with ${formatValue(t.argCheck.expected)}, but it starts with ${formatValue(prefix)}.`;
        }
      }
      if (!passed && out === undefined && !note) note = 'Your function returned undefined. Did you forget a return statement?';
      return { ...base, passed, received: formatValue(out), note };
    } catch (e) {
      return { ...base, passed: false, received: '—', error: e instanceof Error ? `${e.name}: ${e.message}` : String(e) };
    }
  });
}

/** Turns source code into a callable function. Used only inside the sandbox worker and tests. */
export function compileUserFunction(code: string, functionName: string): (...args: unknown[]) => unknown {
  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  const factory = new Function(`"use strict";\n${code}\n;return typeof ${functionName} === "function" ? ${functionName} : undefined;`);
  const fn = factory();
  if (typeof fn !== 'function') throw new Error(`Define a function named ${functionName}.`);
  return fn;
}
