import { analyse, coverage, plan } from './engine.mjs';

const $ = id => document.getElementById(id);
const form = $('analyse-form');
let resumeFile;
let sample = false;
let revision = 0;
let jobUpload = 0;
let report;
let active;
let ranking = [];
let student = null;
let nextRole = 0;
let accountBusy = false;

async function api(path, method = 'GET', data) {
  const response = await fetch(`/api/${path}`, {
    method, headers: { 'X-SkillSphere': '1', 'Content-Type': 'application/json' },
    ...(data === undefined ? {} : { body: JSON.stringify(data) })
  });
  if (!response.headers.get('Content-Type')?.includes('application/json')) {
    throw new Error('Start SkillSphere with the Flask launcher, then refresh this tab.');
  }
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'SkillSphere could not complete the request.');
  return result;
}
let completed = new Set();
let selection = [];

function el(tag, value, className) {
  const element = document.createElement(tag);
  if (value !== undefined) element.textContent = value;
  if (className) element.className = className;
  return element;
}

function message(text, error = false) {
  $('status').textContent = text;
  $('status').dataset.error = error;
}

function invalidate() {
  revision++;
  report = undefined;
  active = undefined;
  $('studio-output').value = '';
  for (const key of studioFields) $(`studio-${key}`).value = '';
  ranking = [];
  selection = [];
  completed = new Set();
  for (const id of ['ranking-rows', 'gaps', 'matches', 'days', 'questions', 'lab-result', 'all-resume']) $(id).replaceChildren();
  $('proof').value = '';
  $('report').hidden = true;
  $('run').disabled = false;
  message('');
}

function setResume(file) {
  invalidate();
  resumeFile = file;
  sample = false;
  $('resume-text').value = '';
  $('filename').textContent = file?.name || 'Or drop a PDF here';
}

$('resume').addEventListener('change', event => setResume(event.target.files[0]));
$('resume-text').addEventListener('input', () => {
  invalidate();
  resumeFile = undefined;
  sample = false;
  $('resume').value = '';
  $('filename').textContent = 'Using pasted text';
});
$('jd').addEventListener('input', () => {
  invalidate();
  jobUpload++;
  $('jd-file').value = '';
});

for (const event of ['dragover', 'dragleave', 'drop']) {
  $('drop').addEventListener(event, action => {
    action.preventDefault();
    $('drop').classList.toggle('active', event === 'dragover');
    if (event === 'drop' && action.dataTransfer.files[0]) {
      $('resume').value = '';
      setResume(action.dataTransfer.files[0]);
    }
  });
}

async function readPdf(file) {
  if (file.size > 15 * 1024 * 1024) throw new Error('Use a PDF smaller than 15 MB.');
  if (!/\.pdf$/i.test(file.name)) throw new Error('Choose a PDF file.');
  const { readPdf: extract } = await import('./pdf.mjs');
  return extract(new Uint8Array(await file.arrayBuffer()));
}

$('jd-file').addEventListener('change', async event => {
  const file = event.target.files[0];
  const request = ++jobUpload;
  invalidate();
  if (!file) return;
  $('run').disabled = true;
  message('Opening the job description…');
  try {
    if (file.size > 15 * 1024 * 1024) throw new Error('Use a job description smaller than 15 MB.');
    let text;
    let skipped = [];
    if (/\.pdf$/i.test(file.name)) {
      const pdf = await readPdf(file);
      text = pdf.lines.map(line => line.text).join('\n');
      skipped = pdf.unreadablePages;
    } else if (/\.txt$/i.test(file.name)) text = await file.text();
    else throw new Error('Choose a .txt or .pdf job description.');
    if (!text.trim() || text.length > 60000) throw new Error('Use a job description with 1–60,000 characters.');
    if (request !== jobUpload) return;
    invalidate();
    $('jd').value = text;
    message(skipped.length ? `Loaded. Check missing text on page(s) ${skipped.join(', ')} before analysing.` : 'Job description loaded. Review the text before analysing.');
  } catch (error) {
    if (request === jobUpload) message(error.message, true);
  } finally {
    if (request === jobUpload) $('run').disabled = false;
  }
});

form.addEventListener('reset', () => {
  jobUpload++;
  invalidate();
  resumeFile = undefined;
  sample = false;
  $('filename').textContent = 'Or drop a PDF here';
  $('paste-panel').open = false;
  $('extra-jobs').replaceChildren();
  updateRoleCount();
});

function loadSample(multiple) {
  form.reset();
  sample = true;
  $('filename').textContent = 'Example · two-column resume PDF';
  $('jd').value = [
    'Junior web developer',
    'Required skills:',
    'Build interactive screens with React.js, TypeScript and CSS.',
    'Use RESTful APIs to connect features to PostgreSQL.',
    'Use Docker for repeatable development.',
    'Preferred skills:',
    'Familiarity with GitHub Actions and Figma is a plus.'
  ].join('\n');
  if (multiple) {
    addJob('Platform Engineer', 'Required skills:\nLinux, AWS, Docker, Kubernetes and Git.\nPreferred skills:\nCI/CD and Terraform.');
    addJob('Frontend Intern', 'Required skills:\nHTML, CSS, React.js and JavaScript.\nPreferred skills:\nFigma and Git.');
  }
  form.requestSubmit();
}

$('sample').addEventListener('click', () => loadSample(false));
$('sample-multi').addEventListener('click', () => loadSample(true));
$('hero-demo').addEventListener('click', () => loadSample(true));
$('role-title').addEventListener('input', invalidate);
$('add-job').addEventListener('click', () => addJob()?.focus());

function updateRoleCount() {
  const count = $('extra-jobs').children.length + 1;
  $('role-count').textContent = `${count} of 5 roles`;
  $('add-job').disabled = count >= 5;
}

function addJob(title = '', description = '') {
  if ($('extra-jobs').children.length >= 4) return;
  invalidate();
  const id = ++nextRole;
  const block = el('section', undefined, 'extra-role');
  const head = el('div', undefined, 'section-head');
  const remove = el('button', 'Remove role', 'quiet');
  remove.type = 'button';
  remove.addEventListener('click', () => {
    block.remove();
    updateRoleCount();
    invalidate();
    $('add-job').focus();
  });
  head.append(el('h3', 'Additional role'), remove);
  const titleField = el('input');
  titleField.id = `extra-title-${id}`;
  titleField.maxLength = 100;
  titleField.value = title;
  const descriptionField = el('textarea');
  descriptionField.id = `extra-jd-${id}`;
  descriptionField.maxLength = 60000;
  descriptionField.rows = 4;
  descriptionField.value = description;
  const titleLabel = el('label', 'Role title (optional)');
  titleLabel.htmlFor = titleField.id;
  const descriptionLabel = el('label', 'Job description');
  descriptionLabel.htmlFor = descriptionField.id;
  block.append(head, titleLabel, titleField, descriptionLabel, descriptionField);
  block.addEventListener('input', invalidate);
  $('extra-jobs').append(block);
  updateRoleCount();
  return titleField;
}

form.addEventListener('submit', async event => {
  event.preventDefault();
  invalidate();
  const request = revision;
  const jobs = [{ title: $('role-title').value, description: $('jd').value },
    ...Array.from($('extra-jobs').children, block => ({
      title: block.querySelector('input').value, description: block.querySelector('textarea').value
    }))];
  const pasted = $('resume-text').value.trim();
  if (jobs.some(job => !job.description.trim()) || !(pasted || resumeFile || sample)) {
    message('Add a resume and fill in the job description for each role.', true);
    return;
  }
  $('run').disabled = true;
  message('Reading the documents and comparing skills…');
  try {
    let input;
    if (pasted) input = { lines: pasted.split(/\r\n?|\n/).map(text => ({ text })), unreadablePages: [] };
    else {
      let file = resumeFile;
      if (sample) {
        const response = await fetch(new URL('./sample_resume.pdf', import.meta.url));
        if (!response.ok) throw new Error('The example PDF could not be loaded.');
        file = new File([await response.blob()], 'sample_resume.pdf');
      }
      input = await readPdf(file);
    }
    if (request !== revision) return;
    const result = await api('analyse', 'POST', { lines: input.lines, jobs });
    if (request !== revision) return;
    ranking = result.reports;
    openResult(ranking[0]);
    message(input.unreadablePages.length ?
      `Check resume page(s) ${input.unreadablePages.join(', ')}. No selectable text was found there.` :
      report.resume.length ? (active.id ? 'Analysis complete. Saved to your profile.' : 'Analysis complete. Guest reports are temporary.') : 'The resume text contained no recognised skills. Check the resume or paste its text.');
    $('report-title').focus();
  } catch (error) {
    if (request !== revision) return;
    message(error.name === 'PasswordException' ? 'Remove password protection from this PDF or paste the text.' : error.message, true);
  } finally {
    if (request === revision) $('run').disabled = false;
  }
});

function quote(container, label, text) {
  const paragraph = el('p', undefined, 'quote');
  paragraph.append(el('small', label), document.createTextNode(text));
  container.append(paragraph);
}

function skillsAt(id, skills, empty, matched) {
  const target = $(id);
  target.replaceChildren();
  if (!skills.length) target.append(el('p', empty, 'hint'));
  for (const [index, skill] of skills.entries()) {
    const detail = el('details', undefined, 'skill');
    detail.open = !matched && index < 3;
    const title = el('summary', skill.name);
    title.append(el('span', skill.priority, 'pill'));
    detail.append(title);
    for (const source of skill.evidence) quote(detail, `Job description · line ${source.line}`, source.text);
    if (matched) quote(detail, skill.source.page ? `Resume · page ${skill.source.page}` : 'Resume text', skill.source.text);
    target.append(detail);
  }
}

function openResult(entry) {
  active = entry;
  report = entry.result;
  renderReport();
  renderRanking();
  renderImpact();
}

function renderRanking() {
  $('ranking').hidden = ranking.length < 2;
  $('ranking-rows').replaceChildren();
  const best = ranking[0];
  const winners = best ? ranking.filter(item => item.score === best.score && item.requiredScore === best.requiredScore) : [];
  for (const [index, entry] of ranking.entries()) {
    const row = el('div', undefined, 'rank-row');
    const info = el('div');
    const leader = entry.score !== null && winners.includes(entry);
    info.append(el('strong', entry.title),
      el('p', `${leader ? (winners.length > 1 ? 'Joint best match · ' : 'Best match · ') : ''}${entry.score === null ? 'No recognised role skills' : `${entry.score}% coverage`}` +
        (entry.requiredScore === null ? '' : ` · ${entry.requiredScore}% of required skills`), 'hint'));
    const meter = el('meter');
    meter.min = 0;
    meter.max = 100;
    meter.value = entry.score ?? 0;
    meter.setAttribute('aria-label', `${entry.title} skill coverage`);
    const select = el('button', active === entry ? 'Selected' : 'View report', 'secondary');
    select.type = 'button';
    select.setAttribute('aria-pressed', String(active === entry));
    select.addEventListener('click', () => {
      openResult(entry);
      $('report-title').focus();
    });
    row.append(info, meter, select);
    $('ranking-rows').append(row);
  }
}

function renderReport() {
  const { matched, missing, target, resume } = report;
  $('report-title').textContent = active.title;
  const percent = coverage(matched.length, target.length);
  const metrics = [
    [percent === null ? '—' : `${percent}%`, 'Role skill coverage'],
    [matched.length, 'Matched skills'],
    [missing.length, 'Missing skills']
  ].map(([value, label]) => {
    const node = el('div', undefined, 'metric');
    node.append(el('strong', value), el('span', label));
    return node;
  });
  $('metrics').replaceChildren(...metrics);
  $('gap-count').textContent = missing.length;
  $('match-count').textContent = matched.length;
  skillsAt('gaps', missing, target.length ? 'Your resume mentions all the recognised role skills.' : 'No catalog skills were recognised in this job description.', false);
  skillsAt('matches', matched, 'No matched skills in this analysis.', true);
  $('all-resume').textContent = resume.map(skill => skill.name).join(' · ') || 'No recognised skills.';
  $('plan-section').hidden = $('lab').hidden = $('roadmap-link').hidden = $('lab-link').hidden = !missing.length;
  $('proof').value = '';
  $('lab-result').replaceChildren();
  selection = [];
  renderPlan(active.roadmap);
  renderInterview();
  renderStudio();
  $('report').hidden = false;
}

function updateRoadmapProgress(total) {
  $('progress').textContent = `${completed.size} / ${total} days done`;
  $('roadmap-meter').max = total || 14;
  $('roadmap-meter').value = completed.size;
}

function renderPlan(days) {
  completed = new Set(active.practice?.days || []);
  updateRoadmapProgress(days.length);
  $('focus-skills').textContent = report.missing.slice(0, 3).map(skill => skill.name).join(' · ');
  $('days').replaceChildren();
  for (let week = 0; week < 2 && days.length; week++) {
    const panel = el('div', undefined, 'week');
    panel.append(el('h3', `Week ${week + 1}`));
    for (const { day, skill, task } of days.slice(week * 7, week * 7 + 7)) {
      const label = el('label', undefined, 'day');
      const checkbox = el('input');
      checkbox.type = 'checkbox';
      checkbox.checked = completed.has(day);
      const body = el('span');
      body.append(el('strong', `Day ${day} · ${skill}`), document.createTextNode(task));
      checkbox.addEventListener('change', () => {
        if (checkbox.checked) completed.add(day);
        else completed.delete(day);
        draft(active).days = [...completed];
        updateRoadmapProgress(days.length);
      });
      label.append(checkbox, body);
      panel.append(label);
    }
    $('days').append(panel);
  }
}

$('proof').addEventListener('input', () => {
  selection = [];
  $('lab-result').replaceChildren();
});

$('preview').addEventListener('click', () => {
  const supported = new Set(analyse($('proof').value.split(/\r\n?|\n/).map(text => ({ text })), active.description).matched.map(skill => skill.name));
  const candidates = report.missing.filter(skill => supported.has(skill.name));
  const result = $('lab-result');
  result.replaceChildren();
  selection = [];
  if (!candidates.length) {
    result.append(el('p', 'No current gap was recognised in this evidence. Mention the exact skill you used and what you built.'));
    return;
  }
  result.append(el('p', 'Select only skills that you can show in the work you described.'));
  const outcome = el('p');
  const choices = candidates.map(skill => {
    const label = el('label', undefined, 'choice');
    const checkbox = el('input');
    checkbox.type = 'checkbox';
    checkbox.value = skill.name;
    checkbox.addEventListener('change', update);
    label.append(checkbox, document.createTextNode(skill.name));
    result.append(label);
    return checkbox;
  });
  function update() {
    selection = choices.filter(choice => choice.checked).map(choice => choice.value);
    const before = coverage(report.matched.length, report.target.length);
    const after = coverage(report.matched.length + selection.length, report.target.length);
    outcome.textContent = `Coverage preview: ${before}% → ${after}% · ${report.missing.length - selection.length} gaps would remain.`;
  }
  result.append(outcome);
  update();
});

function exportData() {
  const summarize = skill => ({
    skill: skill.name, priority: skill.priority, jobEvidence: skill.evidence,
    ...(skill.source && { resumeEvidence: skill.source })
  });
  return {
    role: active.title,
    coverage: coverage(report.matched.length, report.target.length),
    matched: report.matched.map(summarize),
    missing: report.missing.map(summarize),
    learningPlan: active.roadmap,
    completedDays: [...completed].sort((a, b) => a - b),
    evidencePreview: { selected: selection, remaining: report.missing.length - selection.length }
  };
}

$('export').addEventListener('click', () => {
  if (!report) return;
  const url = URL.createObjectURL(new Blob([JSON.stringify(exportData(), null, 2)], { type: 'application/json' }));
  const download = el('a');
  download.href = url;
  download.download = 'skillsphere-results.json';
  download.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});

$('export-pdf').addEventListener('click', () => {
  if (!report) return;
  const data = exportData();
  const page = $('print-report');
  const percentage = data.coverage === null ? 'No recognised role skills' : `${data.coverage}% skill coverage`;
  page.replaceChildren(el('p', 'SkillSphere · Skill gap report', 'print-brand'), el('h1', data.role),
    el('p', `${percentage} · ${data.matched.length} matched · ${data.missing.length} missing`));

  for (const [heading, list] of [['Missing skills', data.missing], ['Matched skills', data.matched]]) {
    page.append(el('h2', heading));
    if (!list.length) page.append(el('p', 'None in this report.'));
    for (const item of list) {
      const skill = el('section', undefined, 'print-skill');
      skill.append(el('h3', `${item.skill} · ${item.priority}`));
      for (const evidence of item.jobEvidence) quote(skill, `Job description · line ${evidence.line}`, evidence.text);
      if (item.resumeEvidence) {
        const { page: number, text } = item.resumeEvidence;
        quote(skill, number ? `Resume · page ${number}` : 'Resume text', text);
      }
      page.append(skill);
    }
  }
  if (data.learningPlan.length) {
    page.append(el('h2', 'Two-week roadmap'));
    for (const { day, skill, task } of data.learningPlan) {
      const marker = data.completedDays.includes(day) ? ' · Done' : '';
      page.append(el('p', `Day ${day} · ${skill}${marker} — ${task}`, 'print-day'));
    }
  }
  if (data.evidencePreview.selected.length) {
    const preview = coverage(data.matched.length + data.evidencePreview.selected.length, report.target.length);
    page.append(el('h2', 'Evidence Lab preview'), el('p', `${data.coverage}% → ${preview}% if supported by: ${data.evidencePreview.selected.join(', ')}.`));
  }
  document.body.classList.add('printing-report');
  window.print();
});

window.addEventListener('afterprint', () => {
  document.body.classList.remove('printing-report');
  $('print-report').replaceChildren();
});

function draft(entry) {
  entry.practice ||= { answers: entry.questions.map(() => ''), days: [] };
  entry.practice.answers ||= entry.questions.map(() => '');
  entry.practice.days ||= [];
  return entry.practice;
}

function renderInterview() {
  const entry = active;
  $('questions').replaceChildren();
  $('save-practice').hidden = !entry.id;
  $('save-practice').disabled = false;
  $('practice-status').textContent = entry.id ? '' : 'Guest practice stays in this tab.';
  const practice = draft(entry);
  for (const [index, question] of entry.questions.entries()) {
    const detail = el('details', undefined, 'question');
    detail.open = index === 0;
    const label = el('label', 'Your practice answer');
    label.htmlFor = `answer-${index}`;
    const answer = el('textarea');
    answer.id = label.htmlFor;
    answer.rows = 3;
    answer.maxLength = 3000;
    answer.placeholder = 'Describe your example and what you did…';
    answer.value = practice.answers[index] || '';
    answer.addEventListener('input', () => { practice.answers[index] = answer.value; });
    const scaffold = el('button', 'Insert STAR outline', 'secondary');
    scaffold.type = 'button';
    scaffold.disabled = Boolean(answer.value.trim());
    answer.addEventListener('input', () => { scaffold.disabled = Boolean(answer.value.trim()); });
    scaffold.addEventListener('click', () => {
      if (answer.value.trim()) return;
      answer.value = 'Situation: \nTask: \nAction: \nResult: ';
      practice.answers[index] = answer.value;
      scaffold.disabled = true;
      answer.focus();
      answer.setSelectionRange(11, 11);
    });
    detail.append(el('summary', question.prompt), el('p', question.hint, 'hint'), scaffold, label, answer);
    $('questions').append(detail);
  }
}

async function saveDraft(button, status) {
  const entry = active;
  if (!entry?.id) return;
  button.disabled = true;
  try {
    await api(`reports/${entry.id}`, 'PATCH', draft(entry));
    if (active === entry) status.textContent = 'Your report progress was saved.';
  } catch (error) {
    if (active === entry) status.textContent = error.message;
  } finally {
    if (active === entry) button.disabled = false;
  }
}

$('save-practice').addEventListener('click', () => saveDraft($('save-practice'), $('practice-status')));

function showStudent(user) {
  student = user;
  $('signed-in').hidden = !user;
  $('signed-out').hidden = Boolean(user);
  $('account').textContent = user ? 'My profile & history' : 'Student profile';
  $('student-details').textContent = user ? `${user.name} · Student ID ${user.student_id}` : '';
  $('session-note').textContent = user ?
    `Signed in as ${user.name}. New reports save to your profile on this installation.` :
    'Guest mode. Create a student profile to save reports and practice across visits.';
}

async function loadHistory() {
  const user = student;
  const list = $('history');
  list.replaceChildren();
  const { reports } = await api('reports');
  if (student !== user) return;
  if (!reports.length) list.append(el('li', 'Your first signed-in analysis will appear here.'));
  for (const item of reports) {
    const row = el('li');
    const label = el('div', item.title);
    label.append(el('small', new Date(item.created).toLocaleString()));
    const actions = el('div');
    const open = el('button', 'Open', 'secondary');
    const remove = el('button', 'Delete', 'quiet');
    open.type = remove.type = 'button';
    open.addEventListener('click', async () => {
      try {
        const revisionOnOpen = revision;
        const { report: saved } = await api(`reports/${item.id}`);
        if (student !== user || revisionOnOpen !== revision) return;
        invalidate();
        openResult(saved);
        $('profile-dialog').close();
        $('report-title').focus();
      } catch (error) { $('account-status').textContent = error.message; }
    });
    remove.addEventListener('click', async () => {
      if (!window.confirm(`Delete the saved report for ${item.title}?`)) return;
      try {
        await api(`reports/${item.id}`, 'DELETE');
        if (active?.id === item.id || ranking.some(entry => entry.id === item.id)) invalidate();
        await loadHistory();
      } catch (error) { $('account-status').textContent = error.message; }
    });
    actions.append(open, remove);
    row.append(label, actions);
    list.append(row);
  }
}

function syncAuthMode() {
  const registering = $('auth-mode').value === 'register';
  $('register-name').hidden = !registering;
  $('student-name').required = registering;
  $('auth-submit').textContent = registering ? 'Create my profile' : 'Sign in';
  $('password').autocomplete = registering ? 'new-password' : 'current-password';
}

$('auth-mode').addEventListener('change', syncAuthMode);
$('account').addEventListener('click', async () => {
  $('account-status').textContent = '';
  $('profile-dialog').showModal();
  if (!student) return;
  try { await loadHistory(); }
  catch (error) { $('account-status').textContent = error.message; }
});

$('close-profile').addEventListener('click', () => $('profile-dialog').close());
$('profile-dialog').addEventListener('close', () => { $('password').value = ''; });

$('auth-form').addEventListener('submit', async event => {
  event.preventDefault();
  if (accountBusy) return;
  accountBusy = true;
  $('auth-submit').disabled = true;
  $('account-status').textContent = '';
  try {
    const mode = $('auth-mode').value;
    const result = await api(mode, 'POST', {
      name: $('student-name').value, student_id: $('student-id').value, password: $('password').value
    });
    form.reset();
    $('auth-form').reset();
    syncAuthMode();
    showStudent(result.student);
    await loadHistory();
  } catch (error) {
    $('account-status').textContent = error.message;
  } finally {
    accountBusy = false;
    $('auth-submit').disabled = false;
  }
});

$('logout').addEventListener('click', async () => {
  if (accountBusy) return;
  accountBusy = true;
  try {
    await api('logout', 'POST');
    form.reset();
    $('history').replaceChildren();
    showStudent(null);
    $('profile-dialog').close();
  } catch (error) { $('account-status').textContent = error.message; }
  finally { accountBusy = false; }
});

$('account').disabled = true;
api('session').then(result => showStudent(result.student)).catch(error => {
  $('session-note').textContent = error.message;
}).finally(() => { $('account').disabled = false; });

function renderImpact() {
  const counter = new Map();
  for (const { result } of ranking) {
    for (const gap of result.missing) {
      const item = counter.get(gap.name) || { name: gap.name, roles: 0, required: 0 };
      item.roles++;
      if (gap.priority === 'Required') item.required++;
      counter.set(gap.name, item);
    }
  }
  const choices = [...counter.values()].sort((a, b) =>
    b.roles - a.roles || b.required - a.required || a.name.localeCompare(b.name));
  $('impact').hidden = ranking.length < 2 || !choices.length;
  $('impact-result').replaceChildren();
  $('impact-skill').replaceChildren(...choices.map(({ name, roles }) =>
    new Option(`${name} · ${roles} ${roles === 1 ? 'role' : 'roles'}`, name)));
  if (!$('impact').hidden) showImpact();
}

function showImpact() {
  const skill = $('impact-skill').value;
  $('impact-result').replaceChildren();
  for (const entry of ranking) {
    const gap = entry.result.missing.find(item => item.name === skill);
    if (!gap) continue;
    const before = entry.score;
    const after = coverage(entry.result.matched.length + 1, entry.result.target.length);
    const row = el('div', undefined, 'impact-row');
    const button = el('button', 'Open project brief', 'secondary');
    button.type = 'button';
    button.addEventListener('click', () => {
      openResult(entry);
      $('studio-skill').value = skill;
      changeStudioSkill();
      $('studio-title').focus();
    });
    row.append(el('span', `${entry.title} · ${gap.priority} · ${before}% → ${after}%`), button);
    $('impact-result').append(row);
  }
}

$('impact-skill').addEventListener('change', showImpact);

const studioFields = ['action', 'check', 'result', 'artifact'];

function renderStudio() {
  const hidden = report.missing.length === 0;
  $('studio').hidden = $('studio-link').hidden = hidden;
  if (hidden) return;
  const practice = draft(active);
  const notes = practice.studio || {};
  $('studio-skill').replaceChildren(...report.missing.map(gap => new Option(gap.name, gap.name)));
  if (report.missing.some(gap => gap.name === notes.skill)) $('studio-skill').value = notes.skill;
  for (const key of studioFields) $(`studio-${key}`).value = notes[key] || '';
  $('save-studio').hidden = !active.id;
  $('save-studio').disabled = false;
  $('studio-status').textContent = active.id ? '' : 'Guest drafts stay in this tab.';
  showBrief();
}

function recordStudio() {
  if (!active) return;
  draft(active).studio = {
    skill: $('studio-skill').value,
    ...Object.fromEntries(studioFields.map(key => [key, $(`studio-${key}`).value]))
  };
  $('studio-output').value = '';
  $('send-proof').disabled = true;
}

function showBrief() {
  const gap = report.missing.find(item => item.name === $('studio-skill').value);
  if (!gap) return;
  const tasks = plan([gap]).slice(0, 4).map(item => el('li', item.task));
  $('studio-brief').replaceChildren(...tasks);
  recordStudio();
}

function changeStudioSkill() {
  const previous = draft(active).studio;
  if (previous && previous.skill !== $('studio-skill').value) {
    if (studioFields.some(key => previous[key]?.trim()) &&
        !window.confirm('Switch skills and clear the current Proof Studio draft?')) {
      $('studio-skill').value = previous.skill;
      return;
    }
    for (const key of studioFields) $(`studio-${key}`).value = '';
    $('studio-status').textContent = '';
  }
  showBrief();
}

$('studio-skill').addEventListener('change', changeStudioSkill);
for (const key of studioFields) $(`studio-${key}`).addEventListener('input', recordStudio);
$('save-studio').addEventListener('click', () => saveDraft($('save-studio'), $('studio-status')));
$('make-proof').addEventListener('click', () => {
  const { skill, action, check, result, artifact } = draft(active).studio;
  if (![action, check, result].every(value => value.trim())) {
    $('studio-status').textContent = 'Add what you built, how you tested it, and what you observed.';
    return;
  }
  $('studio-output').value = `Skill: ${skill}\nWhat I built: ${action.trim()}\nHow I tested it: ${check.trim()}\nObserved result: ${result.trim()}` +
    (artifact.trim() ? `\nArtifact: ${artifact.trim()}` : '');
  $('studio-status').textContent = 'Draft ready. Check that every claim matches the work you completed.';
  $('send-proof').disabled = false;
});
$('send-proof').addEventListener('click', () => {
  $('proof').value = $('studio-output').value;
  $('preview').click();
  $('proof').focus();
});
