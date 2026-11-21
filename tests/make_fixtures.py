"""Generate synthetic PDFs with deterministic text placement, using standard Python."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

def write_pdf(path, entries):
    content = ["0.86 0.87 0.92 RG 35 605 520 85 re S 295 605 m 295 690 l S",
               "35 652 m 555 652 l S 57 709 6 6 re f"]
    for x, y, size, text in entries:
        safe = text.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")
        content.append(f"BT /F1 {size} Tf 1 0 0 1 {x} {y} Tm ({safe}) Tj ET")
    stream = "\n".join(content).encode()
    objects = [
        b"<< /Type /Catalog /Pages 2 0 R >>",
        b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
        b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
        f"<< /Length {len(stream)} >>\nstream\n".encode() + stream + b"\nendstream",
    ]
    output = bytearray(b"%PDF-1.4\n")
    offsets = [0]
    for index, body in enumerate(objects, 1):
        offsets.append(len(output))
        output.extend(f"{index} 0 obj\n".encode() + body + b"\nendobj\n")
    start = len(output)
    output.extend(b"xref\n0 6\n0000000000 65535 f \n")
    for offset in offsets[1:]:
        output.extend(f"{offset:010d} 00000 n \n".encode())
    output.extend(f"trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n{start}\n%%EOF\n".encode())
    path.write_bytes(output)

write_pdf(ROOT / "site/sample_resume.pdf", [
    (48, 748, 25, "Aarav Sharma"),
    (71, 709, 11, "Sample resume | Web developer"),
    # Write the right column first to exercise visual ordering.
    (315, 669, 12, "PROJECTS"),
    (315, 637, 11, "Built a filtering dashboard using ReactJS."),
    (315, 616, 11, "Integrated REST API endpoints."),
    (53, 669, 12, "SKILLS"),
    (53, 637, 11, "HTML5, CSS3, JavaScript"),
    (53, 616, 11, "ReactJS, Git"),
])
write_pdf(ROOT / "tests/qa_resume.pdf", [
    (42, 748, 25, "Synthetic QA Candidate"),
    (315, 669, 12, "PRACTICE"),
    (315, 635, 11, "Wrote tests using Java and JUnit."),
    (315, 615, 11, "Ran test suites in GitHub Actions."),
    (53, 669, 12, "SKILLS"),
    (53, 635, 11, "Git, Python 3, Postman"),
    (53, 615, 11, "MySQL, OOPS"),
])
write_pdf(ROOT / "tests/no_text.pdf", [])
