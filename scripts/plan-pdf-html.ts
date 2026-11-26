// Builds a self-contained, printable HTML version of the daily plan (rendered to PDF by scripts/plan-pdf.cjs).
// Includes every practice problem (statement, examples, hints, solution) and topic cheat sheets,
// so the plan works without the app.
import { AFTER_PLAN, DAILY_PLAN, PLAN_WEEKS, type PlanStep } from '../src/content/dailyPlan';
import { problemById } from '../src/content/problems';
import { TOPICS, topicById } from '../src/content/topics';
import { MODULES, SYLLABUS_SOURCE } from '../src/lib/engine/course';
import { HOW_DETAIL, lessonInfo } from '../src/lib/planText';
import syllabus from '../shared/namasteSyllabus.json';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const md = (s: string) =>
  esc(s)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

// Problems in the order the plan first uses them.
const problemOrder: string[] = [];
for (const d of DAILY_PLAN) for (const s of d.steps) if (s.kind === 'problem' && !problemOrder.includes(s.problemId)) problemOrder.push(s.problemId);
const pNum = (id: string) => problemOrder.indexOf(id) + 1;
const topicOrder = TOPICS.filter((t) => DAILY_PLAN.some((d) => d.steps.some((s) => s.kind === 'learn' && s.topic === t.id)));
const tNum = (id: string) => topicOrder.findIndex((t) => t.id === id) + 1;

// The plan is written for the app; these swaps make the wording right for paper.
const PAPER: [RegExp, string][] = [
  [/Read Understand, watch the growth chart, answer Predict\./, 'Read the topic sheet and answer its Predict questions.'],
  [/Read Understand and step through the call-stack visual slowly\./, 'Read the topic sheet, then trace the call stack of its example on paper.'],
  [/Read Understand and play the Visualize trace( once)?\./, 'Read the topic sheet and trace its example on paper.'],
  [/Answer the Predict questions/, 'Answer the topic sheet\'s Predict questions'],
  [/Do every recall waiting in Revise \(it shows the due ones\)\. Answer from memory before peeking\./, 'Re-solve every problem that is due on your recall tracker (back page). From memory, before peeking.'],
  [/Open Mistakes\. Re-read/, 'Re-read'],
  [/this week's mistakes/, "this week's mistakes in your notebook"],
  [/in Mistakes as a note/, 'in your notebook'],
  [/Look at Progress\. Write down/, 'Look at your recall tracker. Write down'],
  [/Use the mentor steps if you get stuck/, 'Use the hints one at a time if you get stuck'],
  [/Solve it in the playground\./, 'Solve it in your editor.'],
  [/ the app's / , ' this booklet\'s '],
];
const paper = (t: string) => PAPER.reduce((acc, [re, to]) => acc.replace(re, to), t);

const HOW_LABEL = { 'try-first': 'Try first, before the lesson', practice: 'Practice', 'from-memory': 'Re-solve from memory' } as const;

function step(s: PlanStep, i: number): string {
  const core = s.core ? '<span class="core">★ core</span>' : '';
  const box = '<span class="box"></span>';
  switch (s.kind) {
    case 'learn': {
      const t = topicById(s.topic);
      return `<li>${box}<div><div class="tag">${i}. Warm up ${core}</div><b>${esc(t.title)}</b> (Topic sheet T${tNum(t.id)}). ${esc(paper(s.what))}</div></li>`;
    }
    case 'problem': {
      const p = problemById(s.problemId)!;
      return `<li>${box}<div><div class="tag">${i}. ${HOW_LABEL[s.how]} ${core}</div><b>P${pNum(p.id)}. ${esc(p.title)}</b>. ${esc(paper(s.note ?? HOW_DETAIL[s.how]))}</div></li>`;
    }
    case 'namaste': {
      const ls = s.slugs.map((x) => lessonInfo(s.module, x));
      return `<li>${box}<div><div class="tag">${i}. Namaste DSA · ${esc(ls[0].moduleName)} ${core}</div><b>${ls.map((l) => esc(l.title)).join(' + ')}</b>${s.note ? `. ${esc(paper(s.note))}` : ''}</div></li>`;
    }
    case 'own':
      return `<li>${box}<div><div class="tag">${i}. On your own ${core}</div>${esc(paper(s.text))}</div></li>`;
  }
}

const css = `
@page { size: A4; margin: 16mm 15mm 18mm; }
* { box-sizing: border-box; }
body { font-family: 'Inter', -apple-system, 'Segoe UI', Roboto, Arial, sans-serif; color: #1c1c28; font-size: 10.5pt; line-height: 1.45; margin: 0; }
h1 { font-size: 26pt; margin: 0 0 6px; letter-spacing: -0.02em; }
h2 { font-size: 16pt; margin: 0 0 4px; color: #3b2f8f; }
h3 { font-size: 12pt; margin: 0 0 2px; }
code, pre { font-family: 'JetBrains Mono', 'SFMono-Regular', Consolas, monospace; font-size: 9pt; }
code { background: #f1effa; padding: 0 3px; border-radius: 3px; }
pre { background: #f6f5fb; border: 1px solid #e3e0f2; border-radius: 6px; padding: 8px 10px; white-space: pre-wrap; margin: 4px 0 8px; break-inside: avoid; }
.page { break-after: page; }
.cover { height: 250mm; display: flex; flex-direction: column; justify-content: center; }
.cover .logo { width: 52px; height: 52px; border-radius: 12px; background: #6d5ae6; color: #fff; font: 700 20pt monospace; display: flex; align-items: center; justify-content: center; margin-bottom: 18px; }
.muted { color: #5e5d70; }
.small { font-size: 9pt; }
.callout { border-left: 4px solid #6d5ae6; background: #f6f5fb; padding: 8px 12px; border-radius: 4px; margin: 10px 0; }
ol.routine li { margin-bottom: 6px; }
.week { break-before: page; }
h2, h3 { break-after: avoid; }
.sheet { border-top: 1px solid #dcd9ea; padding-top: 10px; margin-top: 12px; }
.sheet.first { border-top: 0; margin-top: 0; padding-top: 0; }
.week-head { break-after: avoid; border-bottom: 2px solid #6d5ae6; padding-bottom: 6px; margin-bottom: 10px; }
.day { border: 1px solid #dcd9ea; border-radius: 8px; padding: 9px 12px; margin-bottom: 9px; break-inside: avoid; }
.day.review { background: #f7faf7; border-color: #cfe3cf; }
.day .meta { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; }
.day .num { font-size: 9pt; font-weight: 700; color: #6d5ae6; text-transform: uppercase; letter-spacing: 0.04em; }
.day .date { font-size: 9pt; color: #8a89a0; white-space: nowrap; }
.day ul { list-style: none; padding: 0; margin: 6px 0 0; }
.day li { display: flex; gap: 8px; margin: 4px 0; }
.box { flex: 0 0 11px; height: 11px; border: 1.3px solid #6d5ae6; border-radius: 2px; margin-top: 3px; }
.tag { font-size: 8pt; text-transform: uppercase; letter-spacing: 0.05em; color: #77768c; }
.core { color: #6d5ae6; font-weight: 600; text-transform: none; letter-spacing: 0; }
.prob { break-inside: avoid-page; border-top: 1px solid #dcd9ea; padding-top: 10px; margin-top: 12px; }
.prob .h { display: flex; justify-content: space-between; gap: 8px; align-items: baseline; }
.pill { font-size: 8pt; border: 1px solid #cfcbe6; border-radius: 99px; padding: 0 7px; color: #4b4a63; white-space: nowrap; }
.hints li { margin-bottom: 2px; }
.sol { break-before: page; }
table { border-collapse: collapse; width: 100%; font-size: 9.5pt; }
td, th { border: 1px solid #dcd9ea; padding: 4px 6px; text-align: left; vertical-align: top; }
.twocol { columns: 2; column-gap: 18px; }
.track td { height: 18px; }
a { color: #4b3cc4; text-decoration: none; }
`;

const parts: string[] = [];
parts.push(`<!doctype html><html><head><meta charset="utf-8"><title>DSA Daily Plan</title><style>${css}</style></head><body>`);

// Cover
parts.push(`<section class="page cover">
<div class="logo">{}</div>
<h1>DSA Daily Plan</h1>
<p style="font-size:14pt" class="muted">55 days of JavaScript problem solving, alongside Namaste DSA</p>
<p style="margin-top:28px">Made for Aditya · November 2026</p>
<div class="callout" style="margin-top:28px">
<b>What is inside</b><br>
1. How to use this plan (one page)<br>
2. The 55-day plan, week by week, with checkboxes<br>
3. Topic sheets: the key idea of each pattern, with practice questions<br>
4. ${problemOrder.length} original practice problems with examples and 4 hints each<br>
5. Full solutions, explained (at the back, so you don't see them by accident)<br>
6. A tracker page for "can I solve it from memory?"
</div>
<p class="small" style="margin-top:24px">Course: <a href="https://namastedev.com/learn/namaste-dsa">namastedev.com/learn/namaste-dsa</a><br>App and source: <a href="https://github.com/aditya22314/dsa-companion">github.com/aditya22314/dsa-companion</a></p>
<p class="small muted" style="margin-top:auto">Namaste DSA lessons are referred to by their public titles only (from ${esc(SYLLABUS_SOURCE.url)}, ${esc(SYLLABUS_SOURCE.retrievedOn)}). No paid course content is included. All practice problems, hints, solutions and explanations in this booklet are original. Not affiliated with NamasteDev.</p>
</section>`);

// How to use
parts.push(`<section class="page">
<h2>How to use this plan</h2>
<p>You already understand explanations. What you are building now is the ability to <b>start a problem on your own</b> and <b>still remember it a week later</b>. This plan trains exactly those two things.</p>
<h3 style="margin-top:12px">Every study day has four steps (about 45–60 minutes)</h3>
<ol class="routine">
<li><b>Warm up (10 min).</b> Read a topic sheet, trace an example on paper, or solve an easy problem from this booklet.</li>
<li><b>Namaste DSA lesson (15–20 min).</b> Watch the lesson(s) named for the day.</li>
<li><b>Solve on your own (15 min).</b> Solve the practice problem in your editor or browser console. Wait 5 minutes before reading Hint 1. Read hints one at a time.</li>
<li><b>Close (2 min).</b> Without looking, write today's key idea in one sentence in a notebook.</li>
</ol>
<h3 style="margin-top:12px">Words used in the plan</h3>
<ul>
<li><b>Try first</b>: attempt the problem for 10–15 honest minutes <i>before</i> watching the lesson. Getting stuck is the point. The lesson then answers a question you already have, so it sticks.</li>
<li><b>Re-solve from memory</b>: blank file, no hints, no peeking. If you can't, read the solution once and try again in two days. That is still progress.</li>
<li><b>★ core</b>: short on time? Do only the core steps (about 30 minutes). A short day beats a skipped day.</li>
</ul>
<h3 style="margin-top:12px">Remembering (so you don't forget after 4–5 days)</h3>
<p>After you solve a problem, write its number and date on the tracker page at the back. Re-solve it from memory <b>1, 3, 7 and 14 days later</b>. If it went well, push the next one further out. If you couldn't, go back to a 1-day gap. Every 5th day in the plan is a review day for this.</p>
<h3 style="margin-top:12px">How to practise without the app</h3>
<p>Write each solution as a function in a <code>.js</code> file and test it with the examples:</p>
<pre>function sumTo(n) { /* your code */ }
console.log(sumTo(4), "expected 10");
console.log(sumTo(0), "expected 0");</pre>
<p>Run it with <code>node file.js</code> or paste it into the browser console. Always also test the edge cases: empty input, one element, all equal, negative numbers.</p>
<div class="callout"><b>Rules that keep you honest.</b> Watching a video or reading a solution is not the same as being able to do it. A problem counts as "mine" only when you solve it from a blank file, from memory, days later. Missing a day never puts you behind: the days are numbered, not dated, so just do the next one.</div>
</section>`);

// Plan
for (const w of PLAN_WEEKS) {
  parts.push(`<section class="week"><div class="week-head"><h2>Week ${w.week}: ${esc(w.title)}</h2><div class="muted">Goal: ${esc(w.goal)}</div></div>`);
  for (const d of DAILY_PLAN.filter((x) => x.week === w.week)) {
    const items = d.steps.map((s, i) => step(s, i + 1)).join('');
    parts.push(`<div class="day${d.review ? ' review' : ''}"><div class="meta"><div><span class="num">Day ${d.day}${d.review ? ' · review' : ''}</span> <h3 style="display:inline">${esc(d.title)}</h3></div><span class="date">Date: ____________</span></div>
<div class="muted small">${esc(d.focus)}</div><ul>${items}<li><span class="box"></span><div><div class="tag">${d.steps.length + 1}. Close</div>Write today's key idea in one sentence, from memory.</div></li></ul></div>`);
  }
  parts.push('</section>');
}

// After 55
const lessonList = (m: number) => syllabus.modules.find((x) => x.order === m)?.lessons.map((l) => esc(l.title)) ?? [];
parts.push(`<section class="week"><div class="week-head"><h2>After Day 55</h2><div class="muted">Keep the same rhythm for the rest of the course.</div></div>
<p>${esc(AFTER_PLAN.intro.replace('The app has no practice problems for these modules yet, so do the "re-code it from memory" step in the console or on LeetCode.', 'For these modules, do the "re-code it from memory" step in your editor or on LeetCode.'))}</p>
<div class="callout"><b>A good pace:</b> one or two lessons a day, a review day every 5th day, and each problem re-solved from memory 1, 3, 7 and 14 days later. Linked List and Stack &amp; Queues come next. They build on the array and two-pointer work you have already done.</div>
${AFTER_PLAN.modules
  .map((m) => {
    const mod = MODULES.find((x) => x.order === m)!;
    return `<div class="day"><div class="num">Module ${m}</div><h3>${esc(mod.name)} <span class="muted small">(${mod.count} lessons)</span></h3><div class="small muted">${lessonList(m).join(' · ')}</div></div>`;
  })
  .join('')}
</section>`);

// Topic sheets
parts.push(`<section class="week"><div class="week-head"><h2>Topic sheets</h2><div class="muted">Read these on "warm up" days. The answers to the Predict questions are at the bottom of each sheet.</div></div>`);
topicOrder.forEach((t, i) => {
  parts.push(`<div class="sheet${i === 0 ? ' first' : ''}"><div class="h"><h3>T${i + 1}. ${esc(t.title)}</h3><span class="pill">Namaste module ${t.namasteModules.join(', ')}</span></div>
<p class="muted">${esc(t.tagline)}</p>
${t.intuition.map((p) => `<p>${md(p)}</p>`).join('')}
<p><b>Analogy.</b> ${md(t.analogy)}</p>
<div class="callout"><b>Key idea.</b> ${md(t.keyIdea)}</div>
<p><b>When you see… think of…</b></p><ul>${t.recognitionCues.map((c) => `<li>${md(c)}</li>`).join('')}</ul>
<p><b>Complexity.</b> ${md(t.complexityNote)}</p>
<p><b>Predict the output</b> (answer before you run anything):</p>
${t.predict.map((q, j) => `<div style="break-inside:avoid"><p style="margin:4px 0">${j + 1}. ${md(q.question)}</p><pre>${esc(q.code)}</pre><p class="small">Options: ${q.options.map((o, k) => `(${String.fromCharCode(97 + k)}) ${esc(o)}`).join('   ')}</p></div>`).join('')}
<p class="small muted">Answers: ${t.predict.map((q, j) => `${j + 1}. (${String.fromCharCode(97 + q.answerIndex)}) ${esc(q.explanation)}`).join(' ')}</p>
</div>`);
});
parts.push('</section>');

// Problems
parts.push(`<section class="week"><div class="week-head"><h2>Practice problems</h2><div class="muted">Numbered in the order the plan uses them. Solutions are in the next section.</div></div>`);
for (const id of problemOrder) {
  const p = problemById(id)!;
  parts.push(`<div class="prob"><div class="h"><h3>P${pNum(id)}. ${esc(p.title)}</h3><span class="pill">${esc(topicById(p.topic).title)} · level ${p.level}</span></div>
<p>${md(p.statement)}</p>
<p class="small"><b>Write:</b> <code>function ${esc(p.functionName)}(…)</code></p>
${p.examples.map((e) => `<p class="small" style="margin:2px 0"><b>Input:</b> <code>${esc(e.input)}</code> → <b>Output:</b> <code>${esc(e.output)}</code>${e.explanation ? ` <span class="muted">(${esc(e.explanation)})</span>` : ''}</p>`).join('')}
<p class="small muted">Constraints: ${p.constraints.map(esc).join('; ')}. Edge cases to test: ${p.mentor.edgeCases.map(esc).join('; ')}.</p>
<p class="small"><b>Hints</b> (read one at a time, only after 5 minutes of trying):</p>
<ol class="hints small">${p.hints.map((h) => `<li>${md(h)}</li>`).join('')}</ol>
</div>`);
}
parts.push('</section>');

// Solutions
parts.push(`<section class="week"><div class="week-head"><h2>Solutions</h2><div class="muted">Only after an honest attempt. If you needed this, re-solve the problem from memory in two days.</div></div>`);
for (const id of problemOrder) {
  const p = problemById(id)!;
  parts.push(`<div class="prob"><div class="h"><h3>P${pNum(id)}. ${esc(p.title)}</h3><span class="pill">${esc(p.pattern)}</span></div>
<pre>${esc(p.solution.trim())}</pre>
<p>${md(p.solutionExplanation)}</p>
<p class="small"><b>Complexity:</b> ${esc(p.complexity.time)} time, ${esc(p.complexity.space)} space. ${md(p.complexity.why)}</p>
<p class="small muted"><b>Common mistakes:</b> ${p.mentor.commonMistakes.map(esc).join('; ')}.</p>
</div>`);
}
parts.push('</section>');

// Tracker
const rows = problemOrder
  .map((id) => `<tr><td>P${pNum(id)}</td><td>${esc(problemById(id)!.title)}</td><td></td><td></td><td></td><td></td><td></td></tr>`)
  .join('');
parts.push(`<section class="week"><div class="week-head"><h2>Recall tracker</h2><div class="muted">Write the date you first solved it, then tick each from-memory re-solve: ✓ solved, ~ with a hint, ✗ couldn't.</div></div>
<table class="track"><thead><tr><th>#</th><th>Problem</th><th>First solved</th><th>+1 day</th><th>+3 days</th><th>+7 days</th><th>+14 days</th></tr></thead><tbody>${rows}</tbody></table>
<p class="small muted" style="margin-top:14px">Also from Namaste DSA: add your own rows for lesson problems you re-solve.</p>
<table class="track"><tbody>${'<tr><td style="width:40%"></td><td></td><td></td><td></td><td></td><td></td></tr>'.repeat(12)}</tbody></table>
</section>`);

parts.push('</body></html>');
process.stdout.write(parts.join('\n'));
