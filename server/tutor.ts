import Anthropic from '@anthropic-ai/sdk';
import type { ServerConfig } from './config';

export interface TutorRequest {
  problem: { title: string; statement: string; pattern: string; constraints: string[] };
  code: string;
  hintsUsed: number;
  allowSolution: boolean;
  messages: { role: 'user' | 'assistant'; content: string }[];
}

const SYSTEM = `You are a patient, experienced DSA mentor for a JavaScript developer who understands explanations but struggles to solve problems independently and forgets approaches after a few days.

Teach Socratically:
1. Ask them to explain the problem in their own words before anything else.
2. Help them identify inputs, outputs and constraints.
3. Encourage small examples and edge cases.
4. Help them find a brute-force solution first.
5. Nudge toward the useful pattern with questions, not answers.
6. Help them write pseudocode.
7. Support their own JavaScript implementation; point at the line or idea that is off rather than rewriting it.
8. Explain mistakes and time/space complexity.

Rules:
- Ask at most one or two questions per reply. Keep replies under 150 words unless they ask for more.
- Never paste a complete solution unless the message says the learner explicitly requested it. Small snippets (one line) are fine when they are stuck on syntax.
- Praise reasoning, not speed. Be warm and encouraging, never guilt-inducing.
- Focus on the transferable pattern so they can recognise it next time.
- Use plain JavaScript in code examples.`;

export async function tutorReply(cfg: ServerConfig, req: TutorRequest): Promise<string> {
  const client = new Anthropic({ apiKey: cfg.ai.apiKey });
  const context = `Problem: ${req.problem.title}
Pattern (do not reveal the name unless they are close): ${req.problem.pattern}
Statement: ${req.problem.statement}
Constraints: ${req.problem.constraints.join('; ')}
Hints already revealed in the app: ${req.hintsUsed}/4
Learner explicitly requested the full solution: ${req.allowSolution ? 'yes' : 'no'}

Learner's current code:
\`\`\`js
${req.code.slice(0, 6000)}
\`\`\``;

  const messages: Anthropic.MessageParam[] = [
    { role: 'user', content: context },
    { role: 'assistant', content: 'Thanks, I have the problem and your code. What would you like to work on?' },
    ...req.messages.slice(-16).map((m) => ({ role: m.role, content: m.content.slice(0, 4000) })),
  ];

  const response = await client.messages.create({
    model: cfg.ai.model,
    max_tokens: 2000,
    system: SYSTEM,
    output_config: { effort: 'low' },
    messages,
  });
  if (response.stop_reason === 'refusal') return 'I can’t help with that one. Let’s get back to the problem: what is the input and what should the output be?';
  return response.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('\n')
    .trim();
}
