import { analyse, coverage, plan } from './site/engine.mjs';

let input = '';
for await (const chunk of process.stdin.setEncoding('utf8')) input += chunk;
const { lines, jobs } = JSON.parse(input);

function interview(report) {
  const example = 'Use Situation, Task, Action and Result. Say what you personally did and what you learned.';
  return [
    ...report.matched.slice(0, 2).map(({ name }) => ({
      prompt: `Tell me about a project where you used ${name}. What did you build, and how did you check that it worked?`,
      hint: example
    })),
    ...report.missing.slice(0, 2).map(({ name }) => ({
      prompt: `This role mentions ${name}. What related experience could you build on, and what small exercise would you try first?`,
      hint: 'Describe a real class, task or project. Explain what you still need to learn and how you would test your first attempt.'
    })),
    { prompt: 'Tell me about a time you solved a difficult problem with a teammate.', hint: example },
    { prompt: 'Which project best prepares you for this role, and what would you improve if you had one more week?', hint: 'Name the project, connect it to a listed requirement, and describe one realistic improvement.' }
  ];
}

const reports = jobs.map(({ title, description }) => {
  const result = analyse(lines, description);
  const required = result.target.filter(item => item.priority === 'Required').length;
  const met = result.matched.filter(item => item.priority === 'Required').length;
  return { title, description, result, score: coverage(result.matched.length, result.target.length),
    requiredScore: coverage(met, required), roadmap: plan(result.missing), questions: interview(result) };
});
reports.sort((a, b) => (b.score ?? -1) - (a.score ?? -1) ||
  (b.requiredScore ?? -1) - (a.requiredScore ?? -1));
process.stdout.write(JSON.stringify(reports));
