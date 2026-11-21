# SkillSphere · Build, demo and viva

## Project and problem

SkillSphere gives placement applicants one place to compare job descriptions, see the evidence behind their gaps, plan what to learn, practise interviews and revisit their progress. A student can use one resume for up to five jobs. The ranking is an estimate based on recognised written skills. It is useful for prioritising preparation. It does not measure proficiency or determine placement eligibility.

## Four mandatory M5 checks

| Requirement | How SkillSphere implements it | What to verify |
| --- | --- | --- |
| Messy resume PDFs with two columns, tables and icons | PDF.js extracts fragments and x/y coordinates. We reconstruct rows, keep wide gaps separate and scan the resulting segments. Drawn table lines and icons do not interfere with selectable text. | Use the judges' text-enabled PDF. Open a match and show its extracted resume excerpt and page. Two synthetic PDFs with columns, table lines and an icon are included. Image-only scans need an OCR-exported copy or pasted text. |
| Skill synonyms count as one skill | The catalog maps aliases to the same canonical skill, with token boundaries and overlap handling. | ReactJS in the sample resume matches React.js in the sample JD. Java and JavaScript stay separate. |
| Every gap traces to its JD line | Each recognised role skill stores the original excerpts, priority, and 1-based line numbers. | Expand any gap. Compare the excerpt to the pasted JD. Job PDFs use lines from their extracted editable text. |
| Minimum 70% agreement against the judges' answer key | Compare an exported missing-skill list against the key for the same resume and JD. The supplied calculator reports correct, extra and missed gaps and applies the 70% threshold using Jaccard agreement. | The developer-created practice set scored 23/24 (95.8%). Official compliance remains unverified until judges provide their independent key and scoring method. Use their formula if it differs. |

Beyond those checks, the app still produces a **14-day learning plan for up to the top three gaps**, ranked by requirement priority, frequency and first JD appearance.

## Three innovations

- **Evidence Lab** reads a short description of work the student completed. The student confirms which skills they actually used and sees a before/after coverage preview. The original comparison still reflects the original resume.
- **Multi-Job Comparison** feeds the same extracted resume to up to five role analyses. It ranks by displayed coverage and breaks ties using displayed required-skill coverage. Equal results are marked joint best. Open a role to see its evidence, roadmap and interview practice. A role with no recognised skills receives no score.
- **Interview Practice** makes prompts from skills matched and missing for the selected role, plus behavioural prompts. Students draft answers with real experiences using Situation, Task, Action, Result (STAR). They can save those drafts and checked roadmap days to the selected report. The feature generates prompts from templates and gives structure hints. It does not assign interview grades.

## How we built it

1. **Build the page and interaction.** HTML defines the upload form, account dialog, comparison, report, roadmap, practice and Evidence Lab. CSS controls the responsive layout and rank meters. Browser JavaScript listens for clicks, reads input files and updates the page. User text is rendered as text rather than interpreted as markup.
2. **Read the PDF.** `site/pdf.mjs` calls Mozilla PDF.js in the browser. For each page, it groups fragments by vertical position and sorts them left to right. It splits large horizontal gaps to avoid joining distant table cells or columns. Each resulting text segment keeps its page number. The browser sends extracted lines, plus the job descriptions, as JSON to Flask.
3. **Handle the request in Flask.** `app.py` checks request sizes, number of roles and field types. It runs `analyse.mjs` using Node with JSON through standard input. The process runs a fixed script with a time limit. This reuses the same tested matching logic from the original version.
4. **Match and explain.** `site/catalog.mjs` stores 202 canonical skills and aliases. `site/engine.mjs` recognises matches, looks up each job skill in the resume, attaches evidence and ranks missing skills. It generates 14 days of tasks that cover study, building, verification and a work sample.
5. **Rank roles and generate interview prompts.** `analyse.mjs` applies the engine to every JD, calculates coverage and required coverage, sorts the reports and builds role-specific questions. Flask returns the reports as JSON. `site/app.mjs` displays the highest match first and lets you switch between reports.
6. **Add accounts with Flask and SQLite.** Registration uses a name, self-entered student ID and password. Werkzeug hashes the password. Flask signs a session cookie that identifies the internal account. SQLite stores the student profiles, saved reports, interview drafts and checked roadmap days. Each history lookup uses the active account ID and the requested report ID. A separate student cannot read, edit or delete those reports through the app.
7. **Connect the save and reopen flows.** Signed-in analyses save one report per job automatically. Saving answers and roadmap progress updates the chosen report. Reopening pulls the saved report plus practice. Guests can try the tools without creating a persistent report. PDF binaries and the complete raw resume text are not stored. Reports retain job descriptions and skill evidence excerpts, which can contain personal data.
8. **Test the full path.** Test coordinate-based PDF extraction, aliases, numbered citations and the two-week plan. Use Flask tests for registration, hashed passwords, ranking, access isolation, save/reopen after a restart and guest persistence. Try the browser's PDF example and verify the ranking, practice draft and Evidence Lab.

| File | Explain it in one line |
| --- | --- |
| `site/index.html`, `site/style.css` | Page structure, forms, responsive design and report styling. |
| `site/app.mjs` | Browser events, PDF upload, calls to Flask, account dialog and report rendering. |
| `site/pdf.mjs` | Browser PDF parsing and grouping of text coordinates. |
| `site/catalog.mjs`, `site/engine.mjs` | Skill aliases, skill extraction, matching, ranked gaps, evidence and plans. |
| `analyse.mjs` | Runs the existing matcher for all JDs, orders results and creates interview questions. |
| `app.py` | Flask routes, validation, session handling and SQLite queries. |
| `Start-Mac.command`, `requirements.txt` | One-time environment install and repeatable local launch. |
| `tests/` | Synthetic PDFs, automated verification and judge-key comparison. |

## Five-minute pitch for three people

The official brief requires live judging on judges' inputs. Use the built-in example for team rehearsal. If they provide one role, demonstrate the single-role flow first and use additional judge-provided roles if available. Use fictional student details in the demo.

| Time | Speaker | What to show |
| --- | --- | --- |
| 0:00–0:55 | Person 1 | Explain the placement problem. Sign in with a demo profile. Load the judges' resume and JD. |
| 0:55–2:05 | Person 1 | Run the comparison. Open a match, a cited gap, and the 14-day plan. If there are multiple roles, show the ranking. |
| 2:05–3:10 | Person 2 | Explain PDF coordinates, alias mapping, JD citations, Flask/Node and SQLite ownership. State how official agreement is scored. |
| 3:10–4:30 | Person 3 | Practise a role-specific question, show the save/reopen flow, and preview one gap in Evidence Lab. |
| 4:30–5:00 | Person 3 | Sum up what a student can do next and explain what the coverage score measures. |

**Person 1:** “Students often apply before they know how their projects line up with a role. SkillSphere starts with one resume. If I have several listings, I can compare them together. Here is why this role matched, and here is a skill gap with the actual sentence from the job description. The student can take the top gaps into a two-week plan.”

**Person 2:** “PDF.js gives us text and page positions, so text from distant columns can stay separate. Our catalog recognises different names for the same skill. Flask receives extracted lines, calls the matching engine and returns the result. SQLite stores the history under the signed-in account. To measure our output, we compare missing skills against an independently labelled key. The practice set reached 95.8% using Jaccard. The judges’ key determines the official result.”

**Person 3:** “Here is a question tied to the role we selected. I'll draft a short answer about a real project, then save and reopen it from the student profile. Evidence Lab lets the student describe what they built and preview the impact of adding genuine evidence. With the ranked roles, gap plan and practice history, the student knows what to build and what to talk about.”

## Viva quick answers

| If a judge asks | Say |
| --- | --- |
| What is your frontend? | HTML and CSS for the screen, JavaScript for interactions, and PDF.js for extracting resume text in the browser. |
| What is your backend? | Flask runs the web app and its routes. It handles accounts, requests, and storage. It invokes a JavaScript matcher with Node. |
| Why use both Node and Flask? | We reused the original JavaScript matcher, including its tested aliases and scoring. Flask added account and storage features. Node runs the matcher as a separate program. |
| How do profiles stay separate? | From the session cookie, the server reads the account ID. Its database query requires both the report ID and that account ID. |
| What exactly is stored? | Name, student ID, password hash, reports with job descriptions and evidence, and saved practice. PDFs stay in the browser during extraction. |
| Is an ID verified by the university? | It identifies a profile on this installation. It is self-entered and there is no university identity connection. |
| What is a coverage score? | The number of matched recognised job skills divided by all recognised job skills. The score uses written evidence. |
| How do you handle an unknown skill? | The catalog can miss it. Use an independent key to measure that miss and add verified aliases when extending the catalog. |
| Can it read all PDFs? | The text extractor handles many unusual layouts with selectable text. For image-only or badly encoded text, use an OCR-enabled copy or paste the text. |
| Does it use a chatbot for interviews? | No. The backend fills question templates with role skills. STAR guidance helps the student write a genuine example. |
| What AI did the team use? | OpenAI Codex generated and assisted with the earlier app, SkillSphere features, tests and docs. Say which additional tools the team actually used and identify your own changes. The app itself uses rules and no external AI API. |

## Testing and judge scoring

From the SkillSphere folder, after the launcher has installed Flask, you can open a second Terminal and run:

```sh
.venv/bin/python -m unittest discover -s tests -p 'test_*.py' -v
node --test tests/*.test.mjs
node tests/benchmark.mjs
```

For a judge-key test, run the exact resume and role in the app and click **Download JSON** for that role. Put the expected skills from the judges in a JSON array such as `["Docker", "TypeScript"]` and save that as `judge-key.json`. Run the command with the paths to both files:

```sh
node tests/check_judge_key.mjs "$HOME/Downloads/skillsphere-results.json" judge-key.json
```

Jaccard agreement is the number of shared gaps divided by the number of distinct gaps across both lists. Unexpected and omitted skills both reduce the score. The checker prints both kinds of errors.

## Submission status

This ZIP runs locally. The official brief also asks for a public GitHub repository with granular commit history and a live deployment. Deploy the **Flask app**, including a Node runtime and persistent storage for SQLite. The old static-site instructions only served the previous frontend. For live hosting, use a production WSGI server behind HTTPS and set `SKILLSPHERE_DATA_DIR` to a private persistent directory and `SKILLSPHERE_HTTPS=1`. This package has no live deployment or public repository attached. Keep `instance/`, student IDs and test passwords out of the repo, and use synthetic inputs on any public demo. Follow the official event form for registration numbers and AI declaration.
