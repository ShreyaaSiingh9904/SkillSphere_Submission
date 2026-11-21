# SkillSphere code walkthrough

The ZIP contains the complete runnable source. Open the files below in VS Code. Every teammate should be able to follow the same data path from the upload button through the final report.

## File map

| File | What to explain |
| --- | --- |
| `site/index.html` | Forms and sections for upload, comparison, gap evidence, roadmap, Evidence Lab, Proof Studio, interview practice, account history and export. |
| `site/style.css` | Responsive UI plus a print layout for Save as PDF. |
| `site/app.mjs` | Browser events, input handling, JSON requests, rendering, score previews, draft forms and export. Start at the `analyse-form` submit handler and follow `api`, `openResult` and `renderReport`. |
| `site/pdf.mjs` | Uses PDF.js to extract text and positions. `layoutLines` groups similar heights and splits wide horizontal gaps. `readPdf` keeps page numbers for later evidence. |
| `site/vendor/` | Bundled PDF.js library and its notices. Our layout logic is in `site/pdf.mjs`. |
| `site/catalog.mjs` | Canonical skills, aliases and starter practice recipes. |
| `site/engine.mjs` | `normalize` and `extract` clean and recognise terms. `analyse` compares canonical skills and preserves exact JD lines. `plan` builds a 14-day roadmap. `coverage` computes matched recognised skills divided by total recognised role skills. `compare` calculates judge-key Jaccard agreement. |
| `analyse.mjs` | Reads a JSON request from standard input. Calls the matching engine per role, sorts reports, and adds interview prompts. Outputs JSON to Flask. |
| `app.py` | Creates Flask and the SQLite tables, validates input, sends the request to Node with a timeout, handles student accounts and sessions, and saves report or practice JSON. |
| `Dockerfile`, `requirements-deploy.txt` | Build the hosting image with Python, Node.js and Gunicorn. Gunicorn starts Flask on the host's assigned port. |
| `tests/` | PDF fixtures, unit tests, Flask endpoint checks, practice benchmark, and judge answer-key comparison. |

## Trace the main action

1. The browser reads the PDF file with PDF.js. It extracts visible text and page positions. The original PDF bytes stay in the browser. For raster-only resumes, use an OCR-enabled copy or pasted text.
2. When you click Analyse skill gaps, `site/app.mjs` sends extracted lines and job descriptions as JSON to `POST /api/analyse`.
3. Flask checks counts, text limits, role titles and PDF page numbers. It runs the fixed `analyse.mjs` script using Node and sends the job and resume input through standard input.
4. The matcher resolves aliases to canonical skills, such as ReactJS and React.js. It finds matches and missing skills, retains the original numbered JD lines, and sorts gaps by priority and evidence. It adds a learning plan and interview prompts.
5. Flask returns JSON. Browser JavaScript renders the report. A signed-in student's analyses each get a report row. A guest's results stay temporary.
6. Cross-role Skill Impact scans several returned reports for the same gap. It adds one matched skill for each role in a clearly labelled preview. Proof Studio generates a brief from the skill recipe. The student supplies the build, test and result. Evidence Lab asks them to confirm supported skills before calculating the preview. Neither preview is a hiring probability.
7. The student can explicitly save interview answers, roadmap days and a Proof Studio draft. The browser sends that data to `PATCH /api/reports/<id>`. Flask validates it and updates only the signed-in student's report.

## Database and hosting

SQLite has `students` and `reports`. The internal student ID links a report to its owner. Student IDs entered at registration are unique on that installation. Werkzeug hashes passwords. Flask uses a signed session cookie and checks the signed-in owner in report queries. The report has `payload` JSON for the analysis and `practice` JSON for answers, roadmap days and the current Proof Studio draft.

Locally, SQLite writes to `instance/skillsphere.sqlite3`. On Render, the app writes to the directory set by `SKILLSPHERE_DATA_DIR`, or its default instance directory. Persistent hosting keeps that directory across deploys. Saving a report stores selected evidence excerpts and job descriptions. It does not save the uploaded PDF as a file.

## Quick questions

- **Why Flask and Node?** Flask handles HTTP and SQL. The project reuses its tested JavaScript matching engine through Node.
- **Why Docker?** It gives the hosting service a single repeatable setup containing both runtimes and the server command.
- **Why GitHub plus Render?** GitHub records and shares source. Render runs it at a public HTTPS URL.
- **What happens if the judge sends a skill that is outside the catalog?** It may not be recognised. The judge-key checker records that as a missed skill when the key includes it.
- **What is the 70%?** Agreement with the judges' missing-skill key. Our practice Jaccard score of 95.8% was measured on eight labelled examples. It is different from one person's resume coverage percentage.

Use FINAL_DEMO_AND_VIVA.md to rehearse the five-minute presentation. Use PROJECT_AND_PITCH.md for test commands and the judge-key checker.
