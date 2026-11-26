import type { VizId } from '../content/types';

export interface Frame {
  cells: (number | string)[];
  pointers: Record<string, number>;
  window?: [number, number];
  active?: number[];
  done?: number[];
  dimOutside?: [number, number];
  vars: Record<string, string | number | boolean>;
  note: string;
  stack?: string[];
  map?: [string, string | number][];
  bars?: { label: string; value: number }[];
}

const arr = (input: number[] | string) => (typeof input === 'string' ? input.split('') : input);

function loopTrace(input: number[] | string): Frame[] {
  const a = arr(input);
  const frames: Frame[] = [{ cells: a, pointers: {}, vars: { total: 0 }, note: 'Start with total = 0. The loop will visit each item once.' }];
  let total = 0;
  a.forEach((x, i) => {
    total += Number(x);
    frames.push({ cells: a, pointers: { i }, active: [i], done: [...Array(i).keys()], vars: { i, 'a[i]': x, total }, note: `Step ${i + 1}: add a[${i}] = ${x}. total becomes ${total}.` });
  });
  frames.push({ cells: a, pointers: {}, done: [...a.keys()], vars: { total }, note: `Loop ends after ${a.length} steps. Return ${total}.` });
  return frames;
}

function arrayScan(input: number[] | string): Frame[] {
  const a = arr(input);
  if (typeof input === 'string') {
    const frames: Frame[] = [];
    const counts = new Map<string, number>();
    a.forEach((ch, i) => {
      counts.set(String(ch), (counts.get(String(ch)) ?? 0) + 1);
      frames.push({ cells: a, pointers: { i }, active: [i], vars: { i, ch: String(ch) }, map: [...counts.entries()], note: `Read s[${i}] = "${ch}". Strings are scanned like arrays.` });
    });
    return frames;
  }
  const nums = a as number[];
  let best = nums[0];
  let second = -Infinity;
  const frames: Frame[] = [{ cells: nums, pointers: {}, vars: { best, second: '-∞' }, note: 'Carry two trackers while walking left to right: best and second best.' }];
  nums.forEach((x, i) => {
    let note: string;
    if (x > best) {
      second = best;
      best = x;
      note = `${x} beats best, so the old best moves into second.`;
    } else if (x > second && x !== best) {
      second = x;
      note = `${x} is not the best, but beats second.`;
    } else note = `${x} changes nothing.`;
    frames.push({ cells: nums, pointers: { i }, active: [i], done: [...Array(i).keys()], vars: { i, x, best, second: Number.isFinite(second) ? second : '-∞' }, note });
  });
  frames.push({ cells: nums, pointers: {}, done: [...nums.keys()], vars: { best, second: Number.isFinite(second) ? second : '-∞' }, note: 'One pass, O(n) time, O(1) space.' });
  return frames;
}

function twoPointers(input: number[] | string, target?: number): Frame[] {
  const a = arr(input);
  const frames: Frame[] = [];
  if (typeof input === 'string') {
    let l = 0,
      r = a.length - 1;
    frames.push({ cells: a, pointers: { l, r }, vars: {}, note: 'l starts at the left end, r at the right end.' });
    while (l < r) {
      const same = a[l] === a[r];
      frames.push({ cells: a, pointers: { l, r }, active: [l, r], vars: { 's[l]': String(a[l]), 's[r]': String(a[r]), match: same }, note: same ? `"${a[l]}" = "${a[r]}". Move both inward.` : `"${a[l]}" ≠ "${a[r]}". Not a palindrome.` });
      if (!same) return frames;
      l++;
      r--;
    }
    frames.push({ cells: a, pointers: { l, r }, done: [...a.keys()], vars: {}, note: 'Pointers met: every pair matched.' });
    return frames;
  }
  const nums = [...(a as number[])];
  if (target !== undefined) {
    let l = 0,
      r = nums.length - 1;
    frames.push({ cells: nums, pointers: { l, r }, vars: { target }, note: `Sorted array, looking for a pair that sums to ${target}.` });
    while (l < r) {
      const s = nums[l] + nums[r];
      if (s === target) {
        frames.push({ cells: nums, pointers: { l, r }, active: [l, r], vars: { sum: s, target }, note: `${nums[l]} + ${nums[r]} = ${target}. Found it.` });
        return frames;
      }
      frames.push({ cells: nums, pointers: { l, r }, active: [l, r], vars: { sum: s, target }, note: s < target ? `${s} < ${target}: need bigger, so move l right.` : `${s} > ${target}: need smaller, so move r left.` });
      if (s < target) l++;
      else r--;
    }
    frames.push({ cells: nums, pointers: {}, vars: {}, note: 'No pair found.' });
    return frames;
  }
  if (nums.includes(0)) {
    let w = 0;
    frames.push({ cells: [...nums], pointers: { w: 0, r: 0 }, vars: { w }, note: 'w marks where the next non-zero goes. r reads every element.' });
    for (let r = 0; r < nums.length; r++) {
      if (nums[r] !== 0) {
        nums[w] = nums[r];
        frames.push({ cells: [...nums], pointers: { w, r }, active: [w], vars: { w: w + 1 }, note: `nums[${r}] = ${nums[r]} is non-zero: write it at index ${w}.` });
        w++;
      } else frames.push({ cells: [...nums], pointers: { w, r }, active: [r], vars: { w }, note: `nums[${r}] is 0: skip it. w stays at ${w}.` });
    }
    for (let i = w; i < nums.length; i++) nums[i] = 0;
    frames.push({ cells: [...nums], pointers: {}, done: [...nums.keys()], vars: { w }, note: 'Fill the rest with zeros. Order of non-zeros is kept.' });
    return frames;
  }
  let l = 0,
    r = nums.length - 1;
  frames.push({ cells: [...nums], pointers: { l, r }, vars: {}, note: 'Swap the ends, then move both pointers inward.' });
  while (l < r) {
    [nums[l], nums[r]] = [nums[r], nums[l]];
    frames.push({ cells: [...nums], pointers: { l, r }, active: [l, r], vars: {}, note: `Swapped indexes ${l} and ${r}.` });
    l++;
    r--;
  }
  frames.push({ cells: [...nums], pointers: {}, done: [...nums.keys()], vars: {}, note: 'Pointers met in the middle: reversed in place.' });
  return frames;
}

function binarySearch(input: number[] | string, target?: number): Frame[] {
  const a = arr(input) as number[];
  const t = target ?? a[Math.floor(a.length * 0.7)];
  let lo = 0,
    hi = a.length - 1;
  const frames: Frame[] = [{ cells: a, pointers: { lo, hi }, dimOutside: [lo, hi], vars: { target: t }, note: `Search for ${t}. The answer must be between lo and hi.` }];
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (a[mid] === t) {
      frames.push({ cells: a, pointers: { lo, mid, hi }, active: [mid], dimOutside: [lo, hi], vars: { 'a[mid]': a[mid], target: t }, note: `a[${mid}] = ${t}. Found in ${frames.length} steps.` });
      return frames;
    }
    const left = a[mid] < t;
    frames.push({ cells: a, pointers: { lo, mid, hi }, active: [mid], dimOutside: [lo, hi], vars: { 'a[mid]': a[mid], target: t }, note: left ? `${a[mid]} < ${t}: the left half is impossible. lo = mid + 1.` : `${a[mid]} > ${t}: the right half is impossible. hi = mid - 1.` });
    if (left) lo = mid + 1;
    else hi = mid - 1;
  }
  frames.push({ cells: a, pointers: { lo, hi }, vars: { target: t }, note: 'lo passed hi: not present.' });
  return frames;
}

function recursionStack(input: number[] | string): Frame[] {
  const n = Number((arr(input) as number[])[0] ?? 4);
  const frames: Frame[] = [];
  const stack: string[] = [];
  for (let k = n; k >= 0; k--) {
    stack.push(`f(${k})`);
    frames.push({ cells: [], pointers: {}, stack: [...stack], vars: { calling: `f(${k})` }, note: k === 0 ? 'f(0) is the base case: return 1 without another call.' : `f(${k}) needs f(${k - 1}) first, so it waits on the stack.` });
  }
  let acc = 1;
  for (let k = 1; k <= n; k++) {
    stack.pop();
    acc *= k;
    frames.push({ cells: [], pointers: {}, stack: [...stack], vars: { returned: acc }, note: `f(${k}) = ${k} × f(${k - 1}) = ${acc}. Pop it off the stack.` });
  }
  stack.pop();
  frames.push({ cells: [], pointers: {}, stack: [], vars: { result: acc }, note: `Stack is empty. ${n}! = ${acc}. Space used: ${n + 1} stack frames.` });
  return frames;
}

function hashMap(input: number[] | string, target?: number): Frame[] {
  const a = arr(input);
  const frames: Frame[] = [];
  if (typeof input === 'string' || target === undefined) {
    const counts = new Map<string, number>();
    a.forEach((x, i) => {
      counts.set(String(x), (counts.get(String(x)) ?? 0) + 1);
      frames.push({ cells: a, pointers: { i }, active: [i], map: [...counts.entries()], vars: { key: String(x), count: counts.get(String(x))! }, note: `counts["${x}"] is now ${counts.get(String(x))}. O(1) per update.` });
    });
    return frames;
  }
  const nums = a as number[];
  const seen = new Map<string, number>();
  for (let i = 0; i < nums.length; i++) {
    const need = target - nums[i];
    if (seen.has(String(need))) {
      frames.push({ cells: nums, pointers: { i }, active: [i, seen.get(String(need))!], map: [...seen.entries()], vars: { x: nums[i], need }, note: `Need ${need}, and the map says it was at index ${seen.get(String(need))}. Done in one pass.` });
      return frames;
    }
    seen.set(String(nums[i]), i);
    frames.push({ cells: nums, pointers: { i }, active: [i], map: [...seen.entries()], vars: { x: nums[i], need }, note: `Need ${need}: not seen yet. Remember ${nums[i]} → index ${i}.` });
  }
  return frames;
}

function slidingWindow(input: number[] | string, target?: number): Frame[] {
  const a = arr(input);
  const frames: Frame[] = [];
  if (typeof input === 'string') {
    const set = new Set<string>();
    let l = 0,
      best = 0;
    for (let r = 0; r < a.length; r++) {
      while (set.has(String(a[r]))) {
        set.delete(String(a[l]));
        frames.push({ cells: a, pointers: { l, r }, window: [l, r - 1], vars: { best }, map: [...set].map((c) => [c, '✓']), note: `"${a[r]}" is already inside. Shrink: drop "${a[l]}" from the left.` });
        l++;
      }
      set.add(String(a[r]));
      best = Math.max(best, r - l + 1);
      frames.push({ cells: a, pointers: { l, r }, window: [l, r], vars: { size: r - l + 1, best }, map: [...set].map((c) => [c, '✓']), note: `Add "${a[r]}". Window is unique, size ${r - l + 1}.` });
    }
    return frames;
  }
  const nums = a as number[];
  const k = target ?? 3;
  let sum = nums.slice(0, k).reduce((s, x) => s + x, 0);
  let best = sum;
  frames.push({ cells: nums, pointers: { l: 0, r: k - 1 }, window: [0, k - 1], vars: { sum, best }, note: `First window of size ${k}: sum = ${sum}.` });
  for (let r = k; r < nums.length; r++) {
    sum += nums[r] - nums[r - k];
    best = Math.max(best, sum);
    frames.push({ cells: nums, pointers: { l: r - k + 1, r }, window: [r - k + 1, r], vars: { sum, best }, note: `Slide: + ${nums[r]} entering, − ${nums[r - k]} leaving. sum = ${sum}.` });
  }
  return frames;
}

function complexity(input: number[] | string): Frame[] {
  const ns = arr(input) as number[];
  return ns.map((n) => ({
    cells: [],
    pointers: {},
    vars: { n },
    note: `n = ${n}: O(log n) ≈ ${Math.max(1, Math.round(Math.log2(n)))}, O(n) = ${n}, O(n log n) ≈ ${Math.round(n * Math.max(1, Math.log2(n)))}, O(n²) = ${n * n}.`,
    bars: [
      { label: 'O(1)', value: 1 },
      { label: 'O(log n)', value: Math.max(1, Math.log2(n)) },
      { label: 'O(n)', value: n },
      { label: 'O(n log n)', value: n * Math.max(1, Math.log2(n)) },
      { label: 'O(n²)', value: n * n },
    ],
  }));
}

export function buildTrace(viz: VizId, input: number[] | string, target?: number): Frame[] {
  switch (viz) {
    case 'loop-trace':
      return loopTrace(input);
    case 'array-scan':
      return arrayScan(input);
    case 'two-pointers':
      return twoPointers(input, target);
    case 'binary-search':
      return binarySearch(input, target);
    case 'recursion-stack':
      return recursionStack(input);
    case 'hash-map':
      return hashMap(input, target);
    case 'sliding-window':
      return slidingWindow(input, target);
    case 'complexity-growth':
      return complexity(input);
  }
}
