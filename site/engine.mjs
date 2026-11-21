import { catalog } from './catalog.mjs';

export const normalize = text => text.normalize('NFKC')
  .replace(/\u00ad/g, '').replace(/[‘’]/g, "'").replace(/[‐‑‒–—]/g, '-')
  .replace(/\s*([.+#])(?=[A-Za-z+.#]|\s*[+#])/g, '$1')
  .replace(/([.+#])\s+(?=[+#])/g, '$1');

const escape = text => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const patterns = catalog.flatMap(skill => skill.aliases.map(alias => ({
  skill,
  pattern: new RegExp(`(?<![\\p{L}\\p{N}_])${escape(alias).replace(/ /g, '\\s+')}(?![\\p{L}\\p{N}_+#])`, 'giu'),
  ambiguous: ['c', 'r', 'go', 'node', 'express', 'cv'].includes(alias.toLowerCase()) ? alias.toLowerCase() : ''
})));
const byName = new Map(catalog.flatMap(skill => skill.aliases.map(alias => [alias.toLowerCase(), skill.name])));
export const canonical = name => byName.get(name.trim().toLowerCase()) || name.trim();

function isSkillContext(kind, token, line, index) {
  if (kind === 'go' && /^(?:\s+(?:to|through|ahead|with|live|for)\b)/i.test(line.slice(index + 2))) return false;
  if (kind === 'cv') return /computer vision|opencv|image processing/i.test(line);
  if (kind === 'express' && /^\s+(?:your|their|ideas|interest|themselves)\b/i.test(line.slice(index + token.length))) return false;
  if (kind === 'r' || kind === 'c') return token === token.toUpperCase();
  return true;
}

export function extract(line) {
  const normalized = normalize(line);
  const hits = patterns.flatMap(({ skill, pattern, ambiguous }) =>
    Array.from(normalized.matchAll(pattern))
      .filter(match => isSkillContext(ambiguous, match[0], normalized, match.index))
      .map(match => ({ skill, index: match.index, end: match.index + match[0].length }))
  );
  hits.sort((a, b) => (b.end - b.index) - (a.end - a.index) || a.index - b.index);
  const selected = [];
  for (const hit of hits) {
    if (!selected.some(other => other.index < hit.end && hit.index < other.end)) selected.push(hit);
  }
  return selected.sort((a, b) => a.index - b.index).map(hit => hit.skill);
}

const required = /\b(?:must(?:[- ]have)?|mandatory|required|requirements?|essential|minimum|need(?:s|ed)?|qualifications)\b/i;
const preferred = /\b(?:plus|bonus|preferred|desirable|good[- ]to[- ]have|nice[- ]to[- ]have|advantage|optional)\b/i;
const section = /^(?:role overview|responsibilities|about (?:us|the role)|benefits|what you(?:'ll| will) do)\s*:?$/i;
const exempt = /\b(?:not required|not necessary|no (?:prior )?(?:experience|knowledge) (?:with|in|of))\b/i;
const title = /^(?:(?:minimum |basic |preferred |technical |required |desired )?(?:skills|qualifications|requirements)|must[- ]have|good[- ]to[- ]have|nice[- ]to[- ]have|bonus(?: skills)?|essential(?: skills)?)\s*$/i;
const weight = { Required: 3, Listed: 2, Preferred: 1 };

function jobSkills(description) {
  const skills = new Map();
  let group = 'Listed';
  for (const [index, raw] of description.split(/\r\n?|\n/).entries()) {
    const original = raw.trim();
    const cleaned = original.replace(/^[•●▪*\-\d.)\s]+/, '');
    const heading = cleaned.split(':')[0].trim();
    const headingPriority = preferred.test(heading) ? 'Preferred' : required.test(heading) ? 'Required' : 'Listed';
    if (title.test(heading) || section.test(heading)) group = headingPriority;
    const statements = cleaned.split(/;|(?<=[.!?])\s+(?=[A-Z])|,\s*(?=(?:experience with\s+)?[\w+#.-]+(?:\s+[\w+#.-]+){0,2}\s+(?:is |are )?(?:preferred|optional|mandatory|required|a plus|a bonus)\b)/i);
    for (const statement of statements) {
      if (exempt.test(statement)) continue;
      const priority = preferred.test(statement) ? 'Preferred' : required.test(statement) ? 'Required' : group;
      for (const skill of extract(statement)) {
        const record = skills.get(skill.name) || { ...skill, priority, evidence: [] };
        if (weight[priority] > weight[record.priority]) record.priority = priority;
        if (!record.evidence.some(source => source.line === index + 1)) {
          record.evidence.push({ line: index + 1, text: original, priority });
        }
        skills.set(skill.name, record);
      }
    }
  }
  return [...skills.values()].sort((a, b) => weight[b.priority] - weight[a.priority] ||
    b.evidence.length - a.evidence.length || a.evidence[0].line - b.evidence[0].line);
}

export function analyse(resumeLines, description) {
  const resume = new Map();
  for (const entry of resumeLines) {
    if (exempt.test(entry.text) || /^(?:currently learning|interested in|planning to learn)\b/i.test(entry.text)) continue;
    for (const skill of extract(entry.text)) {
      if (!resume.has(skill.name)) resume.set(skill.name, { ...skill, source: entry });
    }
  }
  const target = jobSkills(description);
  const matched = target.filter(skill => resume.has(skill.name)).map(skill => ({
    ...skill, source: resume.get(skill.name).source
  }));
  const missing = target.filter(skill => !resume.has(skill.name));
  return { matched, missing, target, resume: [...resume.values()] };
}

export function plan(gaps) {
  if (!gaps.length) return [];
  const days = [];
  for (const [index, skill] of gaps.slice(0, 3).entries()) {
    const [artifact, build, verify] = skill.lab;
    const start = index * 4;
    days.push(
      { day: start + 1, skill: skill.name, task: `Learn the basics of ${skill.name}. Write three concepts in your own words and list where the JD expects you to use it.` },
      { day: start + 2, skill: skill.name, task: `Build a first version: ${build}.` },
      { day: start + 3, skill: skill.name, task: `Verify your work: ${verify}.` },
      { day: start + 4, skill: skill.name, task: `Save evidence: ${artifact}. Add setup steps, one result and one limitation.` }
    );
  }
  const names = gaps.slice(0, 3).map(skill => skill.name).join(', ');
  const followup = [
    `Choose one realistic task that uses ${names}. Write a small checklist for success.`,
    'Connect your existing exercises to the task and take a baseline measurement you can reproduce.',
    'Run a normal case and record the input, expected outcome and actual outcome.',
    'Try a boundary or failure case, fix one issue and re-run the example.',
    'Ask a teammate to follow your setup steps and note where they get stuck.',
    'Improve your weakest step and compare the updated result with the baseline.',
    'Write a truthful resume bullet describing the action, tools and observed result.',
    'Rehearse a one-minute explanation using your actual artifact and test output.',
    'Check each claim against the source material and remove anything you cannot demonstrate.',
    'Run a clean demonstration, save your evidence and compare the updated resume to the JD again.'
  ];
  return days.concat(followup.slice(-Math.max(0, 14 - days.length)).map((task, index) => ({
    day: days.length + index + 1, skill: 'Portfolio', task
  })));
}

export const coverage = (matched, total) => total ? Math.round(matched * 100 / total) : null;

export function compare(predicted, expected) {
  const actual = new Set(predicted.map(canonical));
  const key = new Set(expected.map(canonical));
  const correct = [...actual].filter(skill => key.has(skill));
  const extra = [...actual].filter(skill => !key.has(skill));
  const missed = [...key].filter(skill => !actual.has(skill));
  const union = correct.length + extra.length + missed.length;
  return { correct, extra, missed, agreement: union ? correct.length / union : 1 };
}
