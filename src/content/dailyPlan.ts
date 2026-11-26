import type { TopicId } from '../../shared/types';

/**
 * A day-by-day path that pairs the app's own warm-ups and original practice problems
 * with the public Namaste DSA lesson order. Only public lesson titles are referenced.
 *
 * The rhythm for each day:
 *   1. Warm up in the app (concept, visual, or a bridge problem)  ~10 min
 *   2. Namaste DSA lesson(s)                                      ~15-20 min
 *   3. Solve on your own in the app                               ~15 min
 *   4. Close: write the approach in one sentence from memory      ~2 min
 * "Try first" means: attempt the app's matching problem for 10-15 minutes BEFORE
 * watching the lesson, so the video answers a question you already have.
 */

export type PlanStep =
  | { kind: 'learn'; topic: TopicId; what: string; core?: boolean }
  | { kind: 'problem'; problemId: string; how: 'try-first' | 'practice' | 'from-memory'; core?: boolean; note?: string }
  | { kind: 'namaste'; module: number; slugs: string[]; note?: string; core?: boolean }
  | { kind: 'own'; text: string; core?: boolean };

export interface PlanDay {
  day: number;
  week: number;
  title: string;
  /** Why this day matters, in one line. */
  focus: string;
  review?: boolean;
  steps: PlanStep[];
}

export interface PlanWeek {
  week: number;
  title: string;
  goal: string;
}

export const PLAN_WEEKS: PlanWeek[] = [
  { week: 1, title: 'Loops and number logic', goal: 'Write simple loops without looking anything up.' },
  { week: 2, title: 'Patterns and digit tricks', goal: 'Break a number into digits with % and Math.floor.' },
  { week: 3, title: 'Complexity and first array problems', goal: 'Say the Big-O of any loop you write, and use two pointers.' },
  { week: 4, title: 'More arrays, then recursion begins', goal: 'Solve easy array problems on your own.' },
  { week: 5, title: 'Recursion and searching', goal: 'Trust the recursive call, and halve a search space.' },
  { week: 6, title: 'Sorting, then strings begin', goal: 'Write bubble, selection and insertion sort from memory.' },
  { week: 7, title: 'Strings and counting with objects', goal: 'Count things with an object or Map in one pass.' },
  { week: 8, title: 'Palindromes, anagrams, prefixes', goal: 'Pick between two pointers and a frequency map.' },
  { week: 9, title: 'Binary search, properly', goal: 'Write binary search with correct boundaries every time.' },
  { week: 10, title: 'Two pointers and lookups', goal: 'Spot when a sorted array means "use two pointers".' },
  { week: 11, title: 'Sliding window', goal: 'Grow and shrink a window instead of re-scanning.' },
];

const reviewDay = (day: number, week: number, extra: PlanStep[] = []): PlanDay => ({
  day,
  week,
  title: 'Review and catch-up day',
  focus: 'No new lessons. Remembering is the skill you are building today.',
  review: true,
  steps: [
    { kind: 'own', text: 'Do every recall waiting in Revise (it shows the due ones). Answer from memory before peeking.', core: true },
    ...extra,
    { kind: 'own', text: 'Open Mistakes. Re-read this week\'s mistakes and write one sentence per mistake: "Next time I will…".' },
    { kind: 'own', text: 'Behind on the plan? Use today to finish any unchecked step from this week instead. That is exactly what this day is for.' },
  ],
});

export const DAILY_PLAN: PlanDay[] = [
  // Week 1
  {
    day: 1,
    week: 1,
    title: 'Start: how loops think',
    focus: 'See a loop as "repeat this step, change one thing each time".',
    steps: [
      { kind: 'learn', topic: 'loops', what: 'Read Understand and play the Visualize trace once.', core: true },
      { kind: 'namaste', module: 1, slugs: ['introduction', 'which-language'] },
      { kind: 'namaste', module: 2, slugs: ['warm-up-introduction', 'programming-101'], core: true },
      { kind: 'problem', problemId: 'sum-to-n', how: 'practice', note: 'Use the mentor steps if you get stuck. That is normal on day 1.' },
    ],
  },
  {
    day: 2,
    week: 1,
    title: 'Functions, conditions, first loops',
    focus: 'Combine if/else with a loop to count things.',
    steps: [
      { kind: 'learn', topic: 'loops', what: 'Answer the Predict questions without running code.' },
      { kind: 'namaste', module: 2, slugs: ['function-if-else', 'loops-01'], core: true },
      { kind: 'problem', problemId: 'count-greater', how: 'practice', core: true },
    ],
  },
  {
    day: 3,
    week: 1,
    title: 'Loops over arrays',
    focus: 'Keep a "best so far" variable while you scan.',
    steps: [
      { kind: 'problem', problemId: 'sum-to-n', how: 'from-memory', note: 'Blank editor, no hints. Two days later is when forgetting starts.' },
      { kind: 'namaste', module: 2, slugs: ['loops-02'], core: true },
      { kind: 'problem', problemId: 'find-max', how: 'practice', core: true },
    ],
  },
  {
    day: 4,
    week: 1,
    title: 'Second largest: your first "real" problem',
    focus: 'Track two values at once and handle duplicates.',
    steps: [
      { kind: 'problem', problemId: 'find-max', how: 'from-memory' },
      { kind: 'problem', problemId: 'second-largest', how: 'try-first', core: true, note: 'Give it 15 honest minutes before the video, even if you get stuck.' },
      { kind: 'namaste', module: 2, slugs: ['second-largest'], core: true, note: 'Watch how the approach differs from yours.' },
    ],
  },
  reviewDay(5, 1),

  // Week 2
  {
    day: 6,
    week: 2,
    title: 'Loop inside a loop',
    focus: 'The outer loop picks a row, the inner loop fills it.',
    steps: [
      { kind: 'namaste', module: 2, slugs: ['loop-in-loop', 'star-pattern'], core: true },
      { kind: 'own', text: 'In the browser console, print a right triangle of 5 rows, then an upside-down one. Change one number at a time and predict the output before you run it.', core: true },
    ],
  },
  {
    day: 7,
    week: 2,
    title: 'Counting digits',
    focus: 'n % 10 gives the last digit; Math.floor(n / 10) removes it.',
    steps: [
      { kind: 'problem', problemId: 'count-digits', how: 'try-first', core: true },
      { kind: 'namaste', module: 2, slugs: ['count-digit'], core: true },
    ],
  },
  {
    day: 8,
    week: 2,
    title: 'Reversing a number',
    focus: 'Build a new number digit by digit: rev = rev * 10 + digit.',
    steps: [
      { kind: 'problem', problemId: 'count-digits', how: 'from-memory' },
      { kind: 'problem', problemId: 'reverse-number', how: 'try-first', core: true },
      { kind: 'namaste', module: 2, slugs: ['reverse-integer'], core: true },
    ],
  },
  {
    day: 9,
    week: 2,
    title: 'Palindrome numbers',
    focus: 'Reuse yesterday\'s idea to solve a new problem.',
    steps: [
      { kind: 'problem', problemId: 'number-palindrome', how: 'try-first', core: true, note: 'Hint to yourself: you already know how to reverse a number.' },
      { kind: 'namaste', module: 2, slugs: ['palindrome'], core: true },
    ],
  },
  reviewDay(10, 2, [{ kind: 'problem', problemId: 'reverse-number', how: 'from-memory' }]),

  // Week 3
  {
    day: 11,
    week: 3,
    title: 'Time and space complexity',
    focus: 'Count how many times the innermost line runs.',
    steps: [
      { kind: 'learn', topic: 'complexity', what: 'Read Understand, watch the growth chart, answer Predict.', core: true },
      { kind: 'namaste', module: 3, slugs: ['time-space-complexity'], core: true },
      { kind: 'own', text: 'For three problems you solved this month, write their time and space complexity in one line each, in Mistakes as a note.' },
    ],
  },
  {
    day: 12,
    week: 3,
    title: 'Two pointers: remove duplicates',
    focus: 'One pointer reads, one pointer writes.',
    steps: [
      { kind: 'learn', topic: 'two-pointers', what: 'Read Understand and play the Visualize trace.', core: true },
      { kind: 'problem', problemId: 'reverse-in-place', how: 'practice', note: 'Bridge: the simplest two-pointer problem.' },
      { kind: 'namaste', module: 4, slugs: ['remove-duplicates'], core: true },
      { kind: 'problem', problemId: 'remove-duplicates-sorted', how: 'practice', core: true },
    ],
  },
  {
    day: 13,
    week: 3,
    title: 'Remove element, reverse string',
    focus: 'Same read/write pointer idea, new problems.',
    steps: [
      { kind: 'problem', problemId: 'reverse-in-place', how: 'from-memory' },
      { kind: 'namaste', module: 4, slugs: ['remove-element', 'reverse-string'], core: true },
      { kind: 'problem', problemId: 'move-zeros', how: 'practice', core: true, note: 'Close cousin of Remove Element.' },
    ],
  },
  {
    day: 14,
    week: 3,
    title: 'Best time to buy and sell',
    focus: 'Remember the cheapest price seen so far.',
    steps: [
      { kind: 'learn', topic: 'arrays', what: 'Answer the Predict questions.' },
      { kind: 'problem', problemId: 'best-profit', how: 'try-first', core: true },
      { kind: 'namaste', module: 4, slugs: ['best-time-to-buy-and-sell-stocks'], core: true },
    ],
  },
  reviewDay(15, 3, [{ kind: 'problem', problemId: 'remove-duplicates-sorted', how: 'from-memory' }]),

  // Week 4
  {
    day: 16,
    week: 4,
    title: 'Merge sorted arrays',
    focus: 'Compare the fronts, take the smaller, move that pointer.',
    steps: [
      { kind: 'problem', problemId: 'merge-sorted', how: 'try-first', core: true },
      { kind: 'namaste', module: 4, slugs: ['merge-sorted-arrays'], core: true },
    ],
  },
  {
    day: 17,
    week: 4,
    title: 'Move zeros, max consecutive ones',
    focus: 'Reset a counter when the streak breaks.',
    steps: [
      { kind: 'problem', problemId: 'max-consecutive-ones', how: 'try-first', core: true },
      { kind: 'namaste', module: 4, slugs: ['move-zeros', 'max-consecutive-ones'], core: true },
      { kind: 'problem', problemId: 'move-zeros', how: 'from-memory' },
    ],
  },
  {
    day: 18,
    week: 4,
    title: 'Missing number, single number',
    focus: 'Sometimes maths (expected sum minus actual sum) beats searching.',
    steps: [
      { kind: 'problem', problemId: 'missing-number', how: 'try-first', core: true },
      { kind: 'namaste', module: 4, slugs: ['missing-number', 'single-number'], core: true },
    ],
  },
  {
    day: 19,
    week: 4,
    title: 'Recursion 101',
    focus: 'A function that solves a smaller copy of the same problem.',
    steps: [
      { kind: 'learn', topic: 'recursion', what: 'Read Understand and step through the call-stack visual slowly.', core: true },
      { kind: 'namaste', module: 5, slugs: ['recursion-101', 'sum-of-first-n-numbers'], core: true },
      { kind: 'problem', problemId: 'factorial', how: 'practice', core: true },
    ],
  },
  reviewDay(20, 4, [{ kind: 'problem', problemId: 'best-profit', how: 'from-memory' }]),

  // Week 5
  {
    day: 21,
    week: 5,
    title: 'Recursion on arrays',
    focus: 'First element + the answer for the rest.',
    steps: [
      { kind: 'learn', topic: 'recursion', what: 'Answer the Predict questions.' },
      { kind: 'namaste', module: 5, slugs: ['sum-of-all-numbers-in-array', 'factorial-of-n'], core: true },
      { kind: 'problem', problemId: 'sum-array-recursive', how: 'practice', core: true },
    ],
  },
  {
    day: 22,
    week: 5,
    title: 'Power of two',
    focus: 'Decide the base case before the recursive case.',
    steps: [
      { kind: 'problem', problemId: 'factorial', how: 'from-memory' },
      { kind: 'problem', problemId: 'power-of-two', how: 'try-first', core: true },
      { kind: 'namaste', module: 5, slugs: ['power-of-two'], core: true },
    ],
  },
  {
    day: 23,
    week: 5,
    title: 'Recursion masterclass',
    focus: 'A longer lesson. Pause often and trace on paper.',
    steps: [
      { kind: 'namaste', module: 5, slugs: ['recursion-masterclass'], core: true, note: 'Split it across two sittings if you need to.' },
      { kind: 'own', text: 'Draw the call stack for factorial(4) on paper, including what each call returns.' },
    ],
  },
  {
    day: 24,
    week: 5,
    title: 'Linear and binary search',
    focus: 'Sorted data lets you throw away half each step.',
    steps: [
      { kind: 'learn', topic: 'binary-search', what: 'Read Understand and play the Visualize trace.', core: true },
      { kind: 'namaste', module: 6, slugs: ['linear-search', 'binary-search'], core: true },
      { kind: 'problem', problemId: 'binary-search', how: 'practice', core: true },
    ],
  },
  reviewDay(25, 5, [{ kind: 'problem', problemId: 'sum-array-recursive', how: 'from-memory' }]),

  // Week 6
  {
    day: 26,
    week: 6,
    title: 'Bubble and selection sort',
    focus: 'Know what is guaranteed sorted after each pass.',
    steps: [
      { kind: 'namaste', module: 6, slugs: ['bubble-sort', 'selection-sort'], core: true },
      { kind: 'own', text: 'Write bubble sort in the console without the video. Test it on [5, 1, 4, 2, 8] and on [] and [1].', core: true },
    ],
  },
  {
    day: 27,
    week: 6,
    title: 'Insertion sort',
    focus: 'Like sorting playing cards in your hand.',
    steps: [
      { kind: 'own', text: 'Write selection sort from memory first (5 minutes).' },
      { kind: 'namaste', module: 6, slugs: ['insertion-sort'], core: true },
      { kind: 'own', text: 'Write insertion sort yourself and test it on the same three inputs.', core: true },
    ],
  },
  {
    day: 28,
    week: 6,
    title: 'Merge sort',
    focus: 'Split until trivial, then merge. You already know merging.',
    steps: [
      { kind: 'problem', problemId: 'merge-sorted', how: 'from-memory', note: 'The merge step is the heart of merge sort.' },
      { kind: 'namaste', module: 6, slugs: ['merge-sort'], core: true },
    ],
  },
  {
    day: 29,
    week: 6,
    title: 'Strings begin',
    focus: 'A string is an array of characters you cannot change in place.',
    steps: [
      { kind: 'learn', topic: 'strings', what: 'Read Understand and play the Visualize trace.', core: true },
      { kind: 'problem', problemId: 'count-vowels', how: 'practice', note: 'Bridge exercise.' },
      { kind: 'namaste', module: 8, slugs: ['length-of-last-word-approach-1-two-loops', 'length-of-last-word-approach-2-one-loop'], core: true },
    ],
  },
  reviewDay(30, 6, [{ kind: 'own', text: 'Write bubble, selection and insertion sort from memory, one after another.' }]),

  // Week 7
  {
    day: 31,
    week: 7,
    title: 'Counting with objects',
    focus: 'An object or Map answers "have I seen this?" instantly.',
    steps: [
      { kind: 'learn', topic: 'hashing', what: 'Read Understand and play the Visualize trace.', core: true },
      { kind: 'namaste', module: 8, slugs: ['find-words-containing-character', 'jewels-and-stones'], core: true },
      { kind: 'problem', problemId: 'first-repeat', how: 'practice', core: true },
    ],
  },
  {
    day: 32,
    week: 7,
    title: 'Most frequent character',
    focus: 'First count everything, then pick the winner.',
    steps: [
      { kind: 'problem', problemId: 'char-frequency', how: 'try-first', core: true },
      { kind: 'namaste', module: 8, slugs: ['find-most-frequent-vowel-and-consonant', 'split-a-string-in-balanced-strings'], core: true },
    ],
  },
  {
    day: 33,
    week: 7,
    title: 'Reversing parts of strings',
    focus: 'split, reverse, join, and when to do it by hand.',
    steps: [
      { kind: 'problem', problemId: 'reverse-in-place', how: 'from-memory' },
      { kind: 'namaste', module: 8, slugs: ['reverse-string-ii'], core: true },
      { kind: 'problem', problemId: 'reverse-words', how: 'practice', core: true },
    ],
  },
  {
    day: 34,
    week: 7,
    title: 'Valid palindrome',
    focus: 'Skip what does not count, compare what does.',
    steps: [
      { kind: 'problem', problemId: 'valid-palindrome', how: 'try-first', core: true },
      { kind: 'namaste', module: 8, slugs: ['valid-palindrome-approach-1-extra-space', 'valid-palindrome-approach-2-two-pointers'], core: true },
    ],
  },
  reviewDay(35, 7, [{ kind: 'problem', problemId: 'char-frequency', how: 'from-memory' }]),

  // Week 8
  {
    day: 36,
    week: 8,
    title: 'Longest common prefix',
    focus: 'Compare column by column and stop at the first mismatch.',
    steps: [
      { kind: 'namaste', module: 8, slugs: ['largest-odd-number-in-a-string'] },
      { kind: 'problem', problemId: 'longest-common-prefix', how: 'try-first', core: true },
      { kind: 'namaste', module: 8, slugs: ['longest-common-prefix'], core: true },
    ],
  },
  {
    day: 37,
    week: 8,
    title: 'Anagrams and isomorphic strings',
    focus: 'Same counts means same letters.',
    steps: [
      { kind: 'problem', problemId: 'valid-anagram', how: 'try-first', core: true },
      { kind: 'namaste', module: 8, slugs: ['valid-anagram', 'isomorphic-strings'], core: true },
    ],
  },
  {
    day: 38,
    week: 8,
    title: 'Group anagrams',
    focus: 'Turn each word into a key, then group by key.',
    steps: [
      { kind: 'problem', problemId: 'valid-anagram', how: 'from-memory' },
      { kind: 'namaste', module: 8, slugs: ['group-anagrams-approach-1-sorted-key', 'group-anagrams-approach-2-hashed-key'], core: true },
    ],
  },
  {
    day: 39,
    week: 8,
    title: 'Square root with binary search',
    focus: 'Binary search works on answers, not just arrays.',
    steps: [
      { kind: 'learn', topic: 'binary-search', what: 'Answer the Predict questions.' },
      { kind: 'problem', problemId: 'sqrt-floor', how: 'try-first', core: true },
      { kind: 'namaste', module: 10, slugs: ['square-root-of-x', 'best-practice-finding-middle-element', 'guess-higher-or-lower'], core: true },
    ],
  },
  reviewDay(40, 8, [{ kind: 'problem', problemId: 'binary-search', how: 'from-memory' }]),

  // Week 9
  {
    day: 41,
    week: 9,
    title: 'First and last position',
    focus: 'When you find the target, keep searching left.',
    steps: [
      { kind: 'problem', problemId: 'first-occurrence', how: 'try-first', core: true },
      { kind: 'namaste', module: 10, slugs: ['first-bad-version', 'find-first-last-position-in-sorted-array', 'find-first-last-position-in-sorted-array-approach-2'], core: true },
    ],
  },
  {
    day: 42,
    week: 9,
    title: 'Rotated sorted arrays',
    focus: 'One half is always sorted. Find which.',
    steps: [
      { kind: 'problem', problemId: 'binary-search', how: 'from-memory' },
      { kind: 'namaste', module: 10, slugs: ['search-in-rotated-sorted-array', 'find-minimum-in-rotated-sorted-array'], core: true },
      { kind: 'own', text: 'Pick one of the two problems and re-code it yourself the next morning without the video.' },
    ],
  },
  {
    day: 43,
    week: 9,
    title: 'Peaks',
    focus: 'Walk uphill: compare mid with its neighbour.',
    steps: [
      { kind: 'namaste', module: 10, slugs: ['find-peak-element', 'find-peak-in-a-mountain-array'], core: true },
      { kind: 'own', text: 'Write one sentence: how is "find peak" still binary search when the array is not sorted?' },
    ],
  },
  {
    day: 44,
    week: 9,
    title: 'Single element, k closest',
    focus: 'Use index parity, or search for the left edge of a window.',
    steps: [
      { kind: 'problem', problemId: 'first-occurrence', how: 'from-memory' },
      { kind: 'namaste', module: 10, slugs: ['single-element-in-a-sorted-array', 'find-k-closest-elements'], core: true },
    ],
  },
  reviewDay(45, 9, [{ kind: 'problem', problemId: 'sqrt-floor', how: 'from-memory' }]),

  // Week 10
  {
    day: 46,
    week: 10,
    title: 'Two Sum',
    focus: 'Ask "have I already seen target - x?"',
    steps: [
      { kind: 'problem', problemId: 'first-repeat', how: 'from-memory', note: 'Same "seen" idea.' },
      { kind: 'problem', problemId: 'two-sum', how: 'try-first', core: true },
      { kind: 'namaste', module: 11, slugs: ['two-sum'], core: true },
    ],
  },
  {
    day: 47,
    week: 10,
    title: 'Two Sum on a sorted array',
    focus: 'Too small? Move left. Too big? Move right.',
    steps: [
      { kind: 'problem', problemId: 'pair-sum-sorted', how: 'try-first', core: true },
      { kind: 'namaste', module: 11, slugs: ['two-sum-ii-input-array-is-sorted', 'is-subsequence'], core: true },
    ],
  },
  {
    day: 48,
    week: 10,
    title: 'Substrings and container with most water',
    focus: 'Move the pointer that limits you.',
    steps: [
      { kind: 'namaste', module: 11, slugs: ['find-index-of-first-occurrence-in-string', 'container-with-most-water'], core: true },
      { kind: 'namaste', module: 11, slugs: ['kmp-knuth-morris-pratt-algorithm'], note: 'Optional. Skip it if your brain is full.' },
    ],
  },
  {
    day: 49,
    week: 10,
    title: 'Three Sum (stretch)',
    focus: 'Fix one number, then run Two Sum II on the rest.',
    steps: [
      { kind: 'problem', problemId: 'pair-sum-sorted', how: 'from-memory', core: true },
      { kind: 'namaste', module: 11, slugs: ['three-sum'], core: true },
      { kind: 'namaste', module: 11, slugs: ['trapping-rain-water'], note: 'Stretch. It is fine if this one feels hard.' },
    ],
  },
  reviewDay(50, 10, [{ kind: 'problem', problemId: 'two-sum', how: 'from-memory' }]),

  // Week 11
  {
    day: 51,
    week: 11,
    title: 'Sliding window basics',
    focus: 'Add the new element, remove the old one, never re-scan.',
    steps: [
      { kind: 'learn', topic: 'sliding-window', what: 'Read Understand and play the Visualize trace.', core: true },
      { kind: 'problem', problemId: 'max-sum-k', how: 'practice', core: true, note: 'Fixed-size window first.' },
    ],
  },
  {
    day: 52,
    week: 11,
    title: 'Longest substring without repeats',
    focus: 'Grow the right side; shrink the left side when a rule breaks.',
    steps: [
      { kind: 'problem', problemId: 'longest-unique-substring', how: 'try-first', core: true },
      { kind: 'namaste', module: 11, slugs: ['longest-substring-without-repeating-characters'], core: true },
    ],
  },
  {
    day: 53,
    week: 11,
    title: 'Character replacement, permutation in string',
    focus: 'A window plus a frequency map.',
    steps: [
      { kind: 'problem', problemId: 'max-sum-k', how: 'from-memory' },
      { kind: 'namaste', module: 11, slugs: ['longest-repeating-character-replacement', 'permutation-in-string'], core: true },
    ],
  },
  {
    day: 54,
    week: 11,
    title: 'Mixed recall',
    focus: 'Real interviews do not tell you the topic.',
    steps: [
      { kind: 'problem', problemId: 'missing-number', how: 'from-memory', core: true },
      { kind: 'problem', problemId: 'valid-palindrome', how: 'from-memory', core: true },
      { kind: 'problem', problemId: 'longest-unique-substring', how: 'from-memory' },
      { kind: 'namaste', module: 11, slugs: ['sliding-window-maximum'], note: 'Stretch.' },
    ],
  },
  reviewDay(55, 11, [{ kind: 'own', text: 'Look at Progress. Write down the two topics that feel weakest and redo one problem from each.' }]),
];

/** What to do after Day 55: the remaining Namaste DSA modules, with the same daily rhythm. */
export const AFTER_PLAN = {
  intro:
    'After Day 55 you have covered the foundations. Continue with the Namaste DSA modules below in order, one or two lessons a day, keeping the same rhythm: try the problem first for 15 minutes, watch the lesson, re-code it the next day from memory, and keep one review day each week. The app has no practice problems for these modules yet, so do the "re-code it from memory" step in the console or on LeetCode.',
  modules: [7, 9, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21],
};

export const planDayByNumber = (n: number) => DAILY_PLAN.find((d) => d.day === n);
