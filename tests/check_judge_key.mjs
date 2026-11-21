import { readFile } from 'node:fs/promises';
import { compare } from '../site/engine.mjs';

const [exportPath, keyPath] = process.argv.slice(2);
if (!exportPath || !keyPath) {
  console.error('Usage: node tests/check_judge_key.mjs downloaded-report.json judge-key.json');
  process.exit(2);
}
const report = JSON.parse(await readFile(exportPath, 'utf8'));
const key = JSON.parse(await readFile(keyPath, 'utf8'));
if (!Array.isArray(key) || key.some(skill => typeof skill !== 'string' || !skill.trim()) ||
    !Array.isArray(report.missing) || report.missing.some(item => typeof item?.skill !== 'string')) {
  throw new Error('Use a SkillSphere export and a JSON array of expected missing skill names.');
}
const { agreement, correct, extra, missed } = compare(report.missing.map(item => item.skill), key);
console.log(`Jaccard agreement: ${(100 * agreement).toFixed(1)}% · ${agreement >= 0.70 ? 'meets' : 'below'} the 70% target using this formula`);
console.log('Agreed:', correct.join(', ') || 'none');
console.log('Extra predictions:', extra.join(', ') || 'none');
console.log('Missed from key:', missed.join(', ') || 'none');
