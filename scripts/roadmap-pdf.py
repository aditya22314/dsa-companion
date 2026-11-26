"""Builds docs/DSA-Resource-Roadmap.html from docs/DSA_RESOURCE_ROADMAP.md (pip install markdown)."""
import pathlib, markdown
root = pathlib.Path(__file__).resolve().parent.parent
md = (root / "docs/DSA_RESOURCE_ROADMAP.md").read_text(encoding="utf-8")
md = md.replace("## The short version (print this)", '<div style="break-before:page"></div>\n\n## The short version (print this)')
body = markdown.markdown(md, extensions=["tables", "sane_lists"])
# For paper: every link written out in full, in order of first use.
import re
seen = []
for text, url in re.findall(r"\[([^\]]+)\]\((https?://[^)]+)\)", md):
    if url not in [u for _, u in seen]:
        seen.append((text, url))
body += '<div style="break-before:page"></div><h2>All links, written out (for the printed copy)</h2><ol class="links">' + "".join(f"<li>{t}: <code>{u}</code></li>" for t, u in seen) + "</ol>"
css = """
@page { size: A4; margin: 15mm 14mm 17mm; }
body { font-family: Inter, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif; color:#1c1c28; font-size:10.3pt; line-height:1.5; }
h1 { font-size:22pt; color:#2b2170; margin:0 0 8px; letter-spacing:-0.02em; }
h2 { font-size:13.5pt; color:#3b2f8f; border-bottom:2px solid #6d5ae6; padding-bottom:3px; margin:18px 0 6px; break-after:avoid; }
a { color:#4b3cc4; text-decoration:none; }
table { border-collapse:collapse; width:100%; font-size:8.8pt; margin:6px 0 10px; }
th, td { border:1px solid #dcd9ea; padding:4px 6px; vertical-align:top; text-align:left; }
th { background:#f1effa; }
tr { break-inside:avoid; }
ul { padding-left:18px; } li { margin:3px 0; }
code { background:#f1effa; padding:0 3px; border-radius:3px; font-size:9pt; }
hr { border:0; border-top:1px solid #dcd9ea; margin:14px 0; }
em { color:#5e5d70; }
.links { font-size:8.5pt; } .links code { background:none; padding:0; word-break:break-all; }
"""
html = f'<!doctype html><html><head><meta charset="utf-8"><title>DSA Resource Roadmap</title><style>{css}</style></head><body>{body}</body></html>'
(root / "docs/DSA-Resource-Roadmap.html").write_text(html, encoding="utf-8")
print("wrote docs/DSA-Resource-Roadmap.html")
