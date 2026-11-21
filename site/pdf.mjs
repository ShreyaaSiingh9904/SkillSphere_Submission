import { getDocument, GlobalWorkerOptions } from './vendor/pdf.min.mjs';

GlobalWorkerOptions.workerSrc = new URL('./vendor/pdf.worker.min.mjs', import.meta.url).href;

export function layoutLines(items) {
  const rows = [];
  for (const item of items) {
    if (!item.str?.trim()) continue;
    const x = item.transform[4];
    const y = item.transform[5];
    const height = Math.abs(item.height) || 9;
    const row = rows.find(candidate => Math.abs(candidate.y - y) <= Math.max(2, Math.min(height, candidate.height) * 0.26));
    const part = { x, width: item.width, height, value: item.str.trim(), spaced: /^\s|\s$/.test(item.str) };
    if (row) row.parts.push(part);
    else rows.push({ y, height, parts: [part] });
  }
  const lines = [];
  for (const row of rows.sort((a, b) => b.y - a.y)) {
    let line = '';
    let previous;
    for (const part of row.parts.sort((a, b) => a.x - b.x)) {
      const gap = previous ? part.x - (previous.x + previous.width) : 0;
      if (previous && gap > Math.max(18, part.height * 1.7)) {
        lines.push(line);
        line = '';
      }
      if (line && (gap > part.height * 0.16 || part.spaced || previous.spaced)) line += ' ';
      line += part.value;
      previous = part;
    }
    if (line) lines.push(line);
  }
  return lines;
}

export async function readPdf(bytes) {
  const task = getDocument({ data: bytes, isEvalSupported: false, stopAtErrors: false });
  try {
    const doc = await task.promise;
    if (doc.numPages > 30) throw new Error('This PDF exceeds the 30-page limit.');
    const lines = [];
    const unreadablePages = [];
    for (let page = 1; page <= doc.numPages; page++) {
      const content = await (await doc.getPage(page)).getTextContent();
      const extracted = layoutLines(content.items).filter(text => /[\p{L}\p{N}]/u.test(text));
      if (!extracted.length) unreadablePages.push(page);
      lines.push(...extracted.map(text => ({ text, page })));
    }
    if (!lines.length) throw new Error('This PDF has no selectable text. Export an OCR or text-enabled copy, or paste the resume text.');
    return { lines, unreadablePages };
  } finally {
    await task.destroy();
  }
}
