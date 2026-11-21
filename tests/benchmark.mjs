import { readFile } from 'node:fs/promises';
import { analyse, compare } from '../site/engine.mjs';

const path = process.argv[2] || new URL('./cases.json', import.meta.url);
const cases = JSON.parse(await readFile(path, 'utf8'));
if (!Array.isArray(cases) || !cases.length) throw new Error('Supply a non-empty JSON array of labelled cases.');
let total = { correct: 0, extra: 0, missed: 0 };
for (const { name, resume, jd, expected } of cases) {
  const result = analyse(resume.split(/\r\n?|\n/).map(text => ({ text })), jd);
  const score = compare(result.missing.map(skill => skill.name), expected);
  for (const key of Object.keys(total)) total[key] += score[key].length;
  console.log(`${name}: ${(100 * score.agreement).toFixed(1)}%${score.extra.length ? ' | Extra: ' + score.extra.join(', ') : ''}${score.missed.length ? ' | Missed: ' + score.missed.join(', ') : ''}`);
}
const union = total.correct + total.extra + total.missed;
console.log(`Overall sample Jaccard agreement: ${(union ? total.correct / union * 100 : 100).toFixed(1)}% (${total.correct} exact matches / ${union} total unique gaps across cases)`);
