import assert from 'node:assert/strict';
import { test } from 'node:test';
import { analyse, plan, compare, extract, coverage } from '../site/engine.mjs';

const lines = text => text.split('\n').map(text => ({ text, page: 1 }));
const names = hits => hits.map(skill => skill.name);

test('maps aliases while preserving separate tools and languages', () => {
  assert.deepEqual(names(extract('ReactJS / React Native, C++, C# and JavaScript')), ['React', 'React Native', 'C++', 'C#', 'JavaScript']);
  assert.deepEqual(names(extract('C + +, Node .js, AWS and Amazon Web Services')), ['C++', 'Node.js', 'AWS', 'AWS']);
});

test('keeps exact numbered JD sources and highest observed requirement priority', () => {
  const result = analyse(lines('ReactJS\nES6'), 'Frontend\n\nPreferred skills:\nDocker is a plus.\nMust have:\nUse React.js, Docker and PostgreSQL.\nUse Docker daily.\nNo experience with Flask required.');
  assert.deepEqual(names(result.matched), ['React']);
  assert.deepEqual(names(result.missing), ['Docker', 'PostgreSQL']);
  assert.deepEqual(result.missing[0].evidence.map(source => source.line), [4, 6, 7]);
  assert.equal(result.missing[0].evidence[1].text, 'Use React.js, Docker and PostgreSQL.');
  assert.equal(result.missing[0].priority, 'Required');
  assert.equal(result.matched[0].source.page, 1);
});

test('creates 14 tasks for any positive number of gaps', () => {
  const { missing } = analyse([], 'React, Docker, AWS, Git');
  assert.deepEqual(plan([]), []);
  for (const count of [1, 2, 3, 4]) {
    const tasks = plan(missing.slice(0, count));
    assert.deepEqual(tasks.map(task => task.day), Array.from({ length: 14 }, (_, index) => index + 1));
    assert.deepEqual([...new Set(tasks.map(task => task.skill))], [...names(missing.slice(0, Math.min(3, count))), 'Portfolio']);
  }
});

test('agreement penalises extras and omissions, coverage handles unrecognised JD', () => {
  const result = compare(['ReactJS', 'Docker', 'Figma'], ['React.js', 'Docker', 'Git']);
  assert.equal(result.agreement, 0.5);
  assert.deepEqual(result.extra, ['Figma']);
  assert.deepEqual(result.missed, ['Git']);
  assert.equal(coverage(0, 0), null);
});
