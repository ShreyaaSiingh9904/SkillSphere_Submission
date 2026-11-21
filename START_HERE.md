# SkillSphere on your Mac

SkillSphere is a web app. The ZIP contains the whole app. You extract it, start its server and open it in a browser tab inside VS Code. **Use the new SkillSphere folder for these steps.**

## First time only

1. Download **SkillSphere_M5.zip**. In **Finder → Downloads**, double-click it. Finder creates a **SkillSphere** folder. Keep that folder somewhere easy to find, such as Documents.
2. If the old RoleReady server is running, click its Terminal and press **Control + C** so port 8000 is free.
3. Install **Node.js LTS** from [the official Node.js downloads page](https://nodejs.org/en/download). On your Apple Silicon Mac, choose the macOS **ARM64** installer. Open the downloaded installer and follow the steps. Quit and reopen VS Code so its terminal sees Node. You already ran Python for RoleReady. If `python3 --version` fails, install Python 3.11 or newer from [Python for macOS](https://www.python.org/downloads/macos/).
4. In **VS Code → File → Open Folder…**, pick the extracted **SkillSphere** folder. In the sidebar you should see **app.py**, **site**, and **Start-Mac.command**.
5. Go to **Terminal → New Terminal**. Paste this command into the bottom terminal and press **Return**:

   ```sh
   zsh Start-Mac.command
   ```

   On the first run, the launcher creates a project-only Python environment and downloads Flask. Stay online for this step. Wait until you see **Running on http://127.0.0.1:8000**. Keep the terminal running.
6. Press **⌘ + Shift + P** in VS Code, run **Browser: Open Integrated Browser** and enter **http://127.0.0.1:8000** in the new tab. You can also enter that address in Chrome. If the tab says **ERR_CONNECTION_REFUSED**, start the launcher first and then reload.

## Every time you want to open it again

1. Open the **same SkillSphere folder** in VS Code. Open **Terminal → New Terminal**.
2. Run `zsh Start-Mac.command`.
3. Open or refresh **http://127.0.0.1:8000**. Press **Control + C** in the terminal only when you want to stop the app.

The same folder preserves student profiles and history in `instance/skillsphere.sqlite3`. Keep this file and the associated `instance/session.key` private. Once Python, Node and Flask are installed, the local demo works offline.

| If you see | Do this |
| --- | --- |
| `node` missing | Install Node.js LTS and quit and reopen VS Code. |
| `Start-Mac.command` missing | Open the extracted SkillSphere folder, where `app.py` is visible. |
| `Address already in use` | Stop the old server or run `SKILLSPHERE_PORT=8001 zsh Start-Mac.command` and open **http://127.0.0.1:8001**. |
| A Flask install error | Check your internet connection and rerun the launcher. |
| The address still shows the old RoleReady screen | Stop the old server and run the new launcher from **SkillSphere**, then reload. |
| The PDF has no selectable text | Use a text-enabled or OCR-exported copy, or paste the resume text. |

## First demo

1. Open **Student profile**, select **Create student profile**, and enter a fake name and ID like `DEMO-101`. Choose a password of at least eight characters. Close the profile dialog.
2. Click **Try a multi-role example**. It uses one sample resume PDF and three jobs. Expected ranking is Frontend Intern **83%**, Junior web developer **38%**, and Platform Engineer **14%**.
3. Open the Junior web developer report. Expand a gap, check a roadmap day, and draft an interview answer from a real class or project example. Click **Save answers and roadmap progress**.
4. In **Evidence Lab**, type “I wrote a Dockerfile and tested the Docker image.” Click **Review evidence**, then select **Docker**. Coverage previews **38% → 50%**.
5. In **My profile & history**, reopen the Junior web developer report. Your interview answer and checked day should reappear. Sign out on a shared computer when you finish.

For your own files, click **Clear**, upload one resume and enter a job description. Use **Add another role** for up to five jobs total. The first job supports a pasted description or a .txt/.pdf upload. Additional roles accept pasted descriptions.

## Save a readable report

After analysing a role, click **Save as PDF** in its report. In Google Chrome's print dialog, set **Destination → Save as PDF**, click **Save**, and choose where to save the file. If you compared multiple roles, first select the one you want to save. Choose **Download JSON** when using the judge-key checker.

## Final build with Proof Studio

If you already have a working SkillSphere folder and want to keep its accounts, stop the old server, unzip the final build and copy **app.py** into the original folder. Copy **index.html**, **app.mjs** and **style.css** from the final build's **site** folder into the original **site** folder. Choose Replace for those four files. Keep the original **instance** directory. Restart using the same launcher and hard-refresh Chrome with Command+Shift+R on macOS or Ctrl+Shift+R on Windows.

A new installation uses its own database. On Windows, open the extracted SkillSphere folder in VS Code, install Python and Node.js LTS if needed, then run these lines in PowerShell:

```powershell
py -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe app.py
```

On subsequent launches, run only the last line. With either operating system, open http://127.0.0.1:8000 in Chrome when Flask starts. See **FINAL_DEMO_AND_VIVA.md** for the new features and timed presentation.
