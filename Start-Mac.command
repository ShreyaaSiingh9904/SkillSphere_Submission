#!/bin/zsh
cd -- "${0:A:h}" || exit 1
if ! command -v python3 >/dev/null 2>&1; then
  print 'Install Python 3 from python.org, then reopen this launcher.'
  read -r
  exit 1
fi
if ! command -v node >/dev/null 2>&1; then
  print 'Install Node.js LTS from nodejs.org, then reopen this launcher.'
  read -r
  exit 1
fi
if [[ ! -x .venv/bin/python ]]; then
  python3 -m venv .venv || exit 1
fi
if ! .venv/bin/python -c 'import flask' 2>/dev/null; then
  .venv/bin/python -m pip install -r requirements.txt || exit 1
fi
print "Open http://127.0.0.1:${SKILLSPHERE_PORT:-8000} in VS Code or Chrome. Press Control+C to stop."
exec .venv/bin/python app.py
