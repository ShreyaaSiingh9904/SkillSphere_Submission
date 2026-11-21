import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { analyse } from '../site/engine.mjs';

// The text-only Node test never renders a canvas.
globalThis.DOMMatrix ??= class DOMMatrix {};
globalThis.ImageData ??= class ImageData {};
globalThis.Path2D ??= class Path2D {};
const { readPdf, layoutLines } = await import('../site/pdf.mjs');

const fixture = async path => new Uint8Array(await readFile(new URL(path, import.meta.url)));
const names = records => records.map(record => record.name);

test('separates columns and reassembles split aliases using PDF coordinates', () => {
  const item = (str, x, width) => ({ str, width, height: 11, transform: [11, 0, 0, 11, x, 100] });
  const result = layoutLines([
    item('SQL', 335, 17), item('.js', 123, 12), item('React', 100, 23),
    item('Kubernetes', 410, 54)
  ]);
  assert.deepEqual(result, ['React.js', 'SQL', 'Kubernetes']);
});

test('analyses the actual two-column example PDF with drawn grid and icon', async () => {
  const parsed = await readPdf(await fixture('../site/sample_resume.pdf'));
  const result = analyse(parsed.lines,
    'Required skills:\nReact.js, TypeScript and CSS\nRESTful APIs and PostgreSQL\nDocker\nPreferred skills:\nGitHub Actions and Figma');
  assert.deepEqual(names(result.matched), ['React', 'CSS', 'REST APIs']);
  assert.deepEqual(names(result.missing), ['TypeScript', 'PostgreSQL', 'Docker', 'GitHub Actions', 'Figma']);
  assert.equal(result.matched[0].source.page, 1);
});

test('reads an independent QA resume PDF and handles unreadable files', async () => {
  const parsed = await readPdf(await fixture('./qa_resume.pdf'));
  const result = analyse(parsed.lines, 'Java, JUnit, Python, GitHub Actions, Jira, Selenium, Test Automation');
  assert.deepEqual(names(result.matched), ['Java', 'JUnit', 'Python', 'GitHub Actions']);
  assert.deepEqual(names(result.missing), ['Jira', 'Selenium', 'Test Automation']);
  await assert.rejects(readPdf(await fixture('./no_text.pdf')), /no selectable text/);
  await assert.rejects(readPdf(new TextEncoder().encode('this is corrupt')), /PDF/);
});
