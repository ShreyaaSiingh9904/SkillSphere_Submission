# SkillSphere submission guide

## What deployment means

On your laptop, you open a localhost address. Only that laptop serves the app. Deployment runs the same app on an internet host and gives the judges a public HTTPS URL. GitHub is where the source code and commit history live. Render is where the code runs. Submit both URLs through the official Code Fuzion portal.

## 1. Test the clean source folder

Unzip the package and open **SkillSphere_Submission** in VS Code. The folder root contains `app.py`, `analyse.mjs`, `Dockerfile`, and `site/`. Use the instructions in OPEN_THIS_FIRST.txt to launch it locally. Run Explore a live demo, open Proof Studio, and export a report. For the scored demo, use the judges' own inputs.

## 2. Track the files with Git

Open Terminal → New Terminal inside the submission folder. Run these lines in order. Each commit records a coherent part of the packaged project. If your team already has genuine history in a repo, preserve it and commit this release there instead.

```sh
git init -b main
git add .gitignore app.py analyse.mjs requirements.txt Start-Mac.command site/
git diff --cached --stat
git commit -m "Add SkillSphere application and local launcher"

git add tests/
git commit -m "Add PDF fixtures and evaluation checks"

git add Dockerfile .dockerignore requirements-deploy.txt
git commit -m "Package Flask and Node for deployment"

git add README.md OPEN_THIS_FIRST.txt START_HERE.md CODE_VIVA.md SUBMISSION_GUIDE.md FINAL_DEMO_AND_VIVA.md PROJECT_AND_PITCH.md
git commit -m "Document setup, code walkthrough and judging demo"
git status
git log --oneline -4
```

If Git asks who you are, run `git config user.name "YOUR NAME"` and `git config user.email "YOUR GITHUB EMAIL"` inside the project and retry the failed commit. Use your GitHub no-reply address if you prefer. Before publishing, review the Changes view and tracked filenames. The archive includes synthetic fixtures. Keep the `instance/` folder, session key, virtual environment, real resumes and any real student details out of GitHub.

## 3. Publish the public GitHub repository

1. Open [GitHub Desktop](https://desktop.github.com/) and sign in to the GitHub account or team account you want to own the project.
2. Use **File → Add Local Repository…** and select **SkillSphere_Submission**. It should show the commits you made.
3. Click **Publish repository**. Name it **skillsphere** or **qubrix-skillsphere**. In the publish dialog, uncheck **Keep this code private**. Verify the owner and click **Publish Repository**.
4. Open the repo on GitHub. Confirm it says **Public** and that `Dockerfile`, `app.py`, `site/`, the README and commit history are visible. Copy the browser address. This is the first URL.
5. If you edit the project later, commit the changes and click **Push origin** to send them to GitHub.

Official reference: [Publishing a repository with GitHub Desktop](https://docs.github.com/en/desktop/overview/creating-your-first-repository-using-github-desktop#part-4-publishing-your-repository-to-github).

## 4. Deploy the full app on Render

The event lists Vercel and Netlify. The full SkillSphere app needs Python and Node in one running service, and it uses SQLite for saved history. The included Dockerfile packages those runtimes for Render. Confirm with the help desk if the form restricts which hosting providers it accepts.

1. Sign in to the [Render dashboard](https://dashboard.render.com/). Click **New → Web Service**.
2. Connect GitHub to Render and select your **skillsphere** repo. Give the service a unique name, such as **qubrix-skillsphere**.
3. Set **Branch** to `main`, **Runtime/Language** to **Docker**, and leave **Root Directory** blank. If asked for **Dockerfile Path**, enter `./Dockerfile`. Leave the Docker command blank so Render uses the Dockerfile's default. Set the health check path to `/` if the field is available.
4. Under **Environment Variables**, set `SKILLSPHERE_HTTPS` to `1`. Choose one hosting setup below.
   - **Free demo:** Leave `SKILLSPHERE_DATA_DIR` unset. The app works, and accounts and reports can be used during an active demo. Render Free can sleep and its disk is ephemeral, so saved data may disappear after a restart, redeploy, or sleep. Use synthetic resumes or the judges' approved inputs. For rehearsal before judging, open the link early to let it wake up.
   - **Persistent demo:** Select a paid instance and add a persistent disk mounted at `/var/data`. Set `SKILLSPHERE_DATA_DIR` to `/var/data`. The app stores its SQLite database and session-signing key there, so normal restarts keep account data. Review Render's displayed cost before choosing a paid plan.
5. Click **Create Web Service** or **Deploy Web Service**. Wait for the dashboard to show the service is live. Copy the `https://…onrender.com` URL. This is the second URL.
6. Open the link in a Chrome Incognito window. Run the sample, then test a fresh synthetic resume and JD. Verify matching, source lines, roadmap, Proof Studio and JSON export. Test sign-in and a saved report with a temporary demo account if you plan to show them. If the judge accesses the URL on another device, use the deployed HTTPS address.

Official references: [Render web services](https://render.com/docs/web-services), [Docker on Render](https://render.com/docs/docker), [Free hosting limits](https://render.com/docs/free), [Persistent disks](https://render.com/docs/disks).

## 5. Submit

- Paste the public GitHub repository URL and the working public demo URL into the official Code Fuzion submission portal.
- Declare where ChatGPT/Codex and any other AI tools were used.
- Prepare a five-minute live explanation with the judges' inputs. Use rehearsed examples only for practice. A prerecording is a venue-network fallback under the event rules.
- Check that links work from outside your account. The real judge-key agreement is measured on their data. Do not present the practice benchmark as the official score.
