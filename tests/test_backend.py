import os
import shutil
import sqlite3
import tempfile
import unittest
from pathlib import Path

from app import create_app


HEADERS = {"X-SkillSphere": "1"}
REQUEST = {
    "lines": [{"text": "Python, HTML5, ReactJS", "page": 1}],
    "jobs": [
        {"title": "Backend", "description": "Required skills:\nPython, SQL, PostgreSQL, Docker"},
        {"title": "Frontend", "description": "Must have:\nHTML and React.js.\nPreferred skills:\nTypeScript."},
    ],
}


class SkillSphereTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.path = Path(self.temp.name) / "test.sqlite3"
        self.app = create_app(self.path, "test-only-secret")
        self.client = self.app.test_client()

    def register(self, client, student_id="DEMO-101"):
        return client.post("/api/register", headers=HEADERS,
                           json={"name": "Demo Student", "student_id": student_id, "password": "practice123"})

    def test_app_assets_and_form(self):
        with self.client.get("/") as response:
            self.assertEqual(response.status_code, 200)
            self.assertIn(b"SkillSphere", response.data)
            self.assertIn(b"Interview Practice", response.data)
        with self.client.get("/assets/pdf.mjs") as script:
            self.assertEqual(script.status_code, 200)
        self.assertEqual(self.client.get("/assets/../app.py").status_code, 404)

    def test_accounts_and_cookie(self):
        created = self.register(self.client)
        self.assertEqual(created.status_code, 200)
        self.assertIn("HttpOnly", created.headers["Set-Cookie"])
        self.assertEqual(self.register(self.client, "demo-101").status_code, 409)
        with sqlite3.connect(self.path) as db:
            hashed, = db.execute("SELECT password_hash FROM students").fetchone()
        db.close()
        self.assertTrue(hashed.startswith("scrypt:"))
        self.assertNotIn("practice123", hashed)
        self.assertEqual(self.client.post("/api/logout", headers=HEADERS).status_code, 200)
        self.assertEqual(self.client.get("/api/reports").status_code, 401)
        self.assertEqual(self.client.post("/api/login", headers=HEADERS,
                                        json={"student_id": "demo-101", "password": "wrong password"}).status_code, 401)
        self.assertEqual(self.client.post("/api/login", headers=HEADERS,
                                        json={"student_id": "demo-101", "password": "practice123"}).status_code, 200)
        self.assertEqual(self.client.get("/api/session").json["student"]["student_id"], "DEMO-101")

    def test_api_rejects_cross_origin_form_and_bad_payload(self):
        self.assertEqual(self.client.post("/api/analyse", json=REQUEST).status_code, 403)
        self.assertEqual(self.client.post("/api/analyse", headers=HEADERS, json={"lines": []}).status_code, 400)
        invalid = {**REQUEST, "jobs": REQUEST["jobs"] * 3}
        self.assertEqual(self.client.post("/api/analyse", headers=HEADERS, json=invalid).status_code, 400)

    @unittest.skipUnless(os.environ.get("SKILLSPHERE_NODE") or shutil.which("node"), "Requires Node.js")
    def test_end_to_end_reports_practice_isolation_and_restart(self):
        self.assertEqual(self.register(self.client).status_code, 200)
        response = self.client.post("/api/analyse", headers=HEADERS, json=REQUEST)
        self.assertEqual(response.status_code, 200, response.json)
        reports = response.json["reports"]
        self.assertEqual([(report["title"], report["score"]) for report in reports],
                         [("Frontend", 67), ("Backend", 25)])
        report = reports[0]
        self.assertEqual(report["result"]["missing"][0]["name"], "TypeScript")
        self.assertEqual(report["result"]["missing"][0]["evidence"][0]["line"], 4)
        self.assertEqual(len(report["roadmap"]), 14)
        self.assertTrue(any("TypeScript" in q["prompt"] for q in report["questions"]))
        report_url = "/api/reports/" + str(report["id"])
        other = self.app.test_client()
        self.assertEqual(self.register(other, "DEMO-102").status_code, 200)
        self.assertEqual(other.get("/api/reports").json, {"reports": []})
        for verb in ("GET", "PATCH", "DELETE"):
            self.assertEqual(other.open(report_url, method=verb, headers=HEADERS).status_code, 404)
        answers = ["Built a class project using React."] + [""] * (len(report["questions"]) - 1)
        self.assertEqual(self.client.patch(report_url, headers=HEADERS,
                                          json={"answers": answers, "days": [1, 2]}).status_code, 200)
        studio = {"skill": "TypeScript", "action": "Built a typed form", "check": "Ran test inputs",
                  "result": "Handled four valid inputs", "artifact": "form.ts"}
        self.assertEqual(self.client.patch(report_url, headers=HEADERS,
                                          json={"answers": answers, "days": [1, 2], "studio": studio}).status_code, 200)
        self.assertEqual(self.client.patch(report_url, headers=HEADERS,
                                          json={"answers": answers, "days": [1, 2],
                                                "studio": {**studio, "skill": "React"}}).status_code, 400)
        self.assertEqual(self.client.patch(report_url, headers=HEADERS,
                                          json={"answers": answers, "days": [1, 2]}).status_code, 200)
        restarted = create_app(self.path, "test-only-secret").test_client()
        restarted.post("/api/login", headers=HEADERS, json={"student_id": "DEMO-101", "password": "practice123"})
        self.assertEqual(len(restarted.get("/api/reports").json["reports"]), 2)
        self.assertEqual(restarted.get(report_url).json["report"]["practice"], {"answers": answers, "days": [1, 2], "studio": studio})
        self.assertEqual(restarted.delete(report_url, headers=HEADERS).status_code, 200)
        self.assertEqual(restarted.get(report_url).status_code, 404)

    @unittest.skipUnless(os.environ.get("SKILLSPHERE_NODE") or shutil.which("node"), "Requires Node.js")
    def test_guest_reports_are_temporary(self):
        response = self.client.post("/api/analyse", headers=HEADERS, json=REQUEST)
        self.assertEqual(response.status_code, 200)
        self.assertTrue(all(report["id"] is None for report in response.json["reports"]))
        with sqlite3.connect(self.path) as db:
            self.assertEqual(db.execute("SELECT COUNT(*) FROM reports").fetchone()[0], 0)
        db.close()
