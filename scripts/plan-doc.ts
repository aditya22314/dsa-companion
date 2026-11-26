// Generates docs/DAILY_PLAN.md from src/content/dailyPlan.ts so the doc and the app never disagree.
import { AFTER_PLAN, DAILY_PLAN, PLAN_WEEKS } from '../src/content/dailyPlan';
import { MODULES } from '../src/lib/engine/course';
import { STEP_MINUTES, lessonInfo, stepLabel } from '../src/lib/planText';

const out: string[] = [];
out.push('# Daily DSA plan', '');
out.push('A 55-day path for learning DSA in JavaScript alongside Namaste DSA. It is also built into the app under **Daily plan**, where you can tick steps off.', '');
out.push('## How each day works', '');
out.push('1. **Warm up in the app** (about 10 min): read a concept, watch the visual, or solve an easy bridge problem.');
out.push('2. **Namaste DSA lesson** (about 15–20 min): watch the lesson listed for the day.');
out.push('3. **Solve on your own** (about 15 min): solve the matching problem in the app. Wait 5 minutes before opening a hint.');
out.push('4. **Close** (2 min): without looking, write the key idea in one sentence.', '');
out.push('**Try first** means you attempt the problem for 10–15 minutes *before* watching the lesson. Getting stuck is fine: it makes the lesson stick. **From memory** means a blank editor, no hints.', '');
out.push('Every fifth day is a review day with no new lessons. If your recalls in the app are due, do them before anything else. Short on time? Do only the steps marked ★.', '');
out.push('Study days are numbered, not dated. Missing a day never puts you "behind". Just do the next day.', '');
out.push('Namaste DSA lessons are referenced by their public titles only. Practice problems in the app are original.', '');

for (const w of PLAN_WEEKS) {
  out.push(`## Week ${w.week}: ${w.title}`, '', `_Goal: ${w.goal}_`, '');
  for (const d of DAILY_PLAN.filter((x) => x.week === w.week)) {
    const mins = d.steps.reduce((a, s) => a + STEP_MINUTES[s.kind], 0) + 2;
    out.push(`### Day ${d.day}: ${d.title}${d.review ? ' (review)' : ''}`, '', `${d.focus} · about ${mins} min (lesson lengths vary)`, '');
    d.steps.forEach((s, i) => {
      const l = stepLabel(s);
      const where = s.kind === 'namaste' ? ` ([open](${lessonInfo(s.module, s.slugs[0]).url}))` : l.path ? ` (app: \`${l.path}\`)` : '';
      out.push(`${i + 1}. ${s.core ? '★ ' : ''}**${l.tag}:** ${l.title}${where}${l.detail ? `. ${l.detail}` : ''}`);
    });
    out.push(`${d.steps.length + 1}. **Close:** write today's key idea in one sentence from memory.`, '');
  }
}

out.push('## After Day 55', '', AFTER_PLAN.intro, '');
for (const m of AFTER_PLAN.modules) {
  const mod = MODULES.find((x) => x.order === m);
  out.push(`- Module ${m}: ${mod?.name} (${mod?.count} lessons)`);
}
out.push('');
process.stdout.write(out.join('\n'));
