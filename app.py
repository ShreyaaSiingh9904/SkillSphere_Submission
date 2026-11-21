"""SkillSphere's Flask API and SQLite persistence."""
import json
import os
import re
import secrets
import shutil
import sqlite3
import subprocess
from datetime import timedelta
from pathlib import Path

from flask import Flask, abort, g, jsonify, request, session
from werkzeug.security import check_password_hash, generate_password_hash


ROOT = Path(__file__).resolve().parent
SCHEMA = """
CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY,
    student_id TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    password_hash TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student INTEGER NOT NULL REFERENCES students(id),
    title TEXT NOT NULL,
    created TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
    payload TEXT NOT NULL,
    practice TEXT NOT NULL DEFAULT '{}'
);
CREATE INDEX IF NOT EXISTS reports_by_student ON reports(student, id DESC);
"""


def create_app(database=None, secret=None):
    app = Flask(__name__, static_folder=str(ROOT / "site"), static_url_path="/assets")
    data_dir = Path(os.environ.get("SKILLSPHERE_DATA_DIR", ROOT / "instance"))
    if database is None or secret is None:
        data_dir.mkdir(mode=0o700, parents=True, exist_ok=True)
    if secret is None:
        key_file = data_dir / "session.key"
        try:
            fd = os.open(key_file, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
        except FileExistsError:
            pass
        else:
            with os.fdopen(fd, "w") as stream:
                stream.write(secrets.token_hex(32))
        secret = key_file.read_text().strip()
    app.config.update(
        SECRET_KEY=secret, DATABASE=str(database if database is not None else data_dir / "skillsphere.sqlite3"),
        MAX_CONTENT_LENGTH=3 * 1024 * 1024,
        SESSION_COOKIE_HTTPONLY=True, SESSION_COOKIE_SAMESITE="Lax",
        SESSION_COOKIE_SECURE=os.environ.get("SKILLSPHERE_HTTPS") == "1",
        PERMANENT_SESSION_LIFETIME=timedelta(hours=8),
    )

    def db():
        if "db" not in g:
            g.db = sqlite3.connect(app.config["DATABASE"], timeout=10)
            g.db.row_factory = sqlite3.Row
            g.db.execute("PRAGMA foreign_keys = ON")
        return g.db

    with app.app_context():
        db().executescript(SCHEMA)
        db().close()
        g.pop("db")

    @app.teardown_appcontext
    def close_db(_error):
        connection = g.pop("db", None)
        if connection is not None:
            connection.close()

    @app.before_request
    def protect_api():
        # Cross-origin JavaScript cannot send this custom header without CORS permission.
        if request.path.startswith("/api/") and request.method in {"POST", "PATCH", "DELETE"}:
            if request.headers.get("X-SkillSphere") != "1":
                abort(403, description="Open SkillSphere and try the action again.")

    @app.after_request
    def protect_response(response):
        if request.path.startswith("/api/"):
            response.headers["Cache-Control"] = "no-store"
        response.headers["X-Content-Type-Options"] = "nosniff"
        return response

    @app.errorhandler(400)
    @app.errorhandler(401)
    @app.errorhandler(403)
    @app.errorhandler(404)
    @app.errorhandler(409)
    @app.errorhandler(413)
    @app.errorhandler(503)
    def error_response(error):
        return jsonify(error=error.description), error.code

    def body():
        value = request.get_json(silent=True)
        if not isinstance(value, dict):
            abort(400, description="Send a valid JSON object.")
        return value

    def field(data, key, limit):
        value = data.get(key, "")
        if not isinstance(value, str) or len(value) > limit:
            abort(400, description=f"{key.capitalize()} must be text of at most {limit} characters.")
        return value

    def student():
        return db().execute(
            "SELECT id, student_id, name FROM students WHERE id = ?", (session.get("student"),)
        ).fetchone()

    def require_student():
        user = student()
        if not user:
            abort(401, description="Sign in to open or change your history.")
        return user

    def start_session(user_id):
        session.clear()
        session["student"] = user_id
        session.permanent = True
        return jsonify(student=dict(student()))

    @app.get("/")
    def index():
        return app.send_static_file("index.html")

    @app.get("/api/session")
    def current_session():
        user = student()
        return jsonify(student=dict(user) if user else None)

    @app.post("/api/register")
    def register():
        data = body()
        name = field(data, "name", 70).strip()
        student_id = field(data, "student_id", 30).strip().upper()
        password = field(data, "password", 128)
        if not name or not re.fullmatch(r"[A-Z0-9][A-Z0-9_-]{2,29}", student_id):
            abort(400, description="Enter a name and a student ID of 3–30 letters, digits, hyphens or underscores.")
        if len(password) < 8:
            abort(400, description="Choose a password with at least 8 characters.")
        try:
            with db():
                result = db().execute(
                    "INSERT INTO students (name, student_id, password_hash) VALUES (?, ?, ?)",
                    (name, student_id, generate_password_hash(password)),
                )
        except sqlite3.IntegrityError:
            abort(409, description="This student ID already has a profile on this installation.")
        return start_session(result.lastrowid)

    @app.post("/api/login")
    def login():
        data = body()
        user = db().execute("SELECT * FROM students WHERE student_id = ?",
                            (field(data, "student_id", 30).strip().upper(),)).fetchone()
        password = field(data, "password", 128)
        if not user or not check_password_hash(user["password_hash"], password):
            abort(401, description="Check your student ID and password.")
        return start_session(user["id"])

    @app.post("/api/logout")
    def logout():
        session.clear()
        return jsonify(student=None)

    @app.post("/api/analyse")
    def analyse():
        data = body()
        lines, jobs = data.get("lines"), data.get("jobs")
        if not isinstance(lines, list) or not 1 <= len(lines) <= 6000:
            abort(400, description="Supply 1–6,000 extracted resume lines.")
        clean = []
        for line in lines:
            if not isinstance(line, dict):
                abort(400, description="Invalid resume line.")
            text = field(line, "text", 200000)
            page = line.get("page")
            if page is not None and (type(page) is not int or not 1 <= page <= 30):
                abort(400, description="Invalid PDF page number.")
            clean.append({"text": text, **({"page": page} if page else {})})
        if not any(line["text"].strip() for line in clean) or sum(len(line["text"]) for line in clean) > 200000:
            abort(400, description="Use a resume with 1–200,000 characters.")
        if not isinstance(jobs, list) or not 1 <= len(jobs) <= 5:
            abort(400, description="Compare between one and five job descriptions.")
        clean_jobs = []
        for job in jobs:
            if not isinstance(job, dict):
                abort(400, description="Invalid job description.")
            title, description = field(job, "title", 100).strip(), field(job, "description", 60000)
            if not description.strip():
                abort(400, description="Enter a description for each role.")
            clean_jobs.append({"title": title or description.lstrip().splitlines()[0].strip()[:100],
                               "description": description})
        node = os.environ.get("SKILLSPHERE_NODE") or shutil.which("node")
        if not node:
            abort(503, description="Node.js is missing. Install it, then restart SkillSphere.")
        try:
            result = subprocess.run(
                [node, str(ROOT / "analyse.mjs")], input=json.dumps({"lines": clean, "jobs": clean_jobs}),
                capture_output=True, text=True, encoding="utf-8", timeout=30, check=True
            )
            reports = json.loads(result.stdout)
        except (OSError, subprocess.SubprocessError, ValueError):
            abort(503, description="The analysis engine could not complete the request.")
        user = student()
        for report in reports:
            report["id"] = None
        if user:
            with db():
                for report in reports:
                    # Evidence is stored with the report, while the uploaded PDF is never received.
                    row = db().execute("INSERT INTO reports (student, title, payload) VALUES (?, ?, ?)",
                                       (user["id"], report["title"], json.dumps(report)))
                    report["id"] = row.lastrowid
        return jsonify(reports=reports)

    @app.get("/api/reports")
    def history():
        user = require_student()
        rows = db().execute(
            "SELECT id, title, created FROM reports WHERE student = ? ORDER BY id DESC", (user["id"],)
        )
        return jsonify(reports=[dict(row) for row in rows])

    def owned_report(report_id):
        user = require_student()
        row = db().execute("SELECT * FROM reports WHERE id = ? AND student = ?",
                           (report_id, user["id"])).fetchone()
        if not row:
            abort(404, description="This report was not found in your history.")
        return row

    @app.get("/api/reports/<int:report_id>")
    def report_detail(report_id):
        row = owned_report(report_id)
        report = json.loads(row["payload"])
        report.update(id=row["id"], practice=json.loads(row["practice"]))
        return jsonify(report=report)

    @app.delete("/api/reports/<int:report_id>")
    def delete_report(report_id):
        row = owned_report(report_id)
        with db():
            db().execute("DELETE FROM reports WHERE id = ? AND student = ?", (row["id"], row["student"]))
        return jsonify(deleted=True)

    @app.patch("/api/reports/<int:report_id>")
    def save_practice(report_id):
        row = owned_report(report_id)
        data = body()
        report = json.loads(row["payload"])
        answers, days = data.get("answers"), data.get("days")
        if (not isinstance(answers, list) or len(answers) != len(report["questions"])
                or any(not isinstance(a, str) or len(a) > 3000 for a in answers)):
            abort(400, description="Supply an answer of 0–3,000 characters for each practice question.")
        if (not isinstance(days, list) or len(days) > 14 or any(
                type(day) is not int or not 1 <= day <= len(report["roadmap"]) for day in days)):
            abort(400, description="Supply valid completed roadmap days.")
        practice = {"answers": answers, "days": sorted(set(days))}
        studio = data.get("studio", json.loads(row["practice"]).get("studio"))
        if studio is not None:
            gaps = {skill["name"] for skill in report["result"]["missing"]}
            if not isinstance(studio, dict):
                abort(400, description="Supply a valid Proof Studio draft.")
            skill = field(studio, "skill", 100)
            if skill not in gaps:
                abort(400, description="Choose a missing skill from this report.")
            practice["studio"] = {"skill": skill, **{
                key: field(studio, key, 500) for key in ("action", "check", "result", "artifact")
            }}
        with db():
            db().execute("UPDATE reports SET practice = ? WHERE id = ? AND student = ?",
                         (json.dumps(practice), row["id"], row["student"]))
        return jsonify(practice=practice)

    return app


if __name__ == "__main__":
    create_app().run(host="127.0.0.1", port=int(os.environ.get("SKILLSPHERE_PORT", "8000")))
