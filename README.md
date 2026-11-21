# SkillSphere

**Team QUBRIX · Code Fuzion · M5 Resume vs Job Description Gap Analyser**

SkillSphere compares one resume with up to five job descriptions. It cites the exact lines behind detected gaps, suggests a two-week roadmap, and turns a missing skill into a small project with a test and evidence a student can explain in an interview.

## Run locally on Mac

Open this folder in VS Code. With Python and Node.js installed, open **Terminal → New Terminal** and run:

```sh
SKILLSPHERE_PORT=8001 zsh Start-Mac.command
```

Open [localhost:8001](http://127.0.0.1:8001) once Flask starts. For Windows and first-time setup, see [START_HERE.md](START_HERE.md).

## Code and judging

- [SUBMISSION_GUIDE.md](SUBMISSION_GUIDE.md) · Public GitHub and Render deployment instructions
- [CODE_VIVA.md](CODE_VIVA.md) · Source map and line of execution
- [FINAL_DEMO_AND_VIVA.md](FINAL_DEMO_AND_VIVA.md) · Feature list and five-minute demonstration
- [PROJECT_AND_PITCH.md](PROJECT_AND_PITCH.md) · Tests and judge-key comparison instructions

Image-only scans need an OCR-enabled copy or pasted text. Coverage measures recognised job skills found in the resume. The practice benchmark is separate from the official judge-key result.

## AI use disclosure

OpenAI ChatGPT/Codex assisted with drafting and refining the original M5 application, PDF layout extraction, matching and ranking rules, UI, Flask/SQLite integration, report and practice features, tests, documentation, and deployment packaging. The running matcher and interview features use rules and templates without an external AI API. The team should disclose any additional tools and actual uses before submission.
