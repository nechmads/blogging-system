"""Package the run for sharing: build the gallery, capture previews, copy the
deliverable to a fresh directory outside the repo, verify every relative
reference resolves there, and zip it. Prototype tooling only.

    python3 package.py            # gallery + previews + verify + zip
    python3 package.py --no-shots # skip preview capture (reuse existing)
"""

import os, re, shutil, subprocess, sys, tempfile, zipfile

HERE = os.path.dirname(os.path.abspath(__file__))
RUN = os.path.dirname(HERE)
NAME = os.path.basename(RUN)
CONCEPTS = ["01-cover-stock", "02-horizon", "03-poster"]
DELIVERABLE = ["index.html", "README.md", "previews"] + CONCEPTS
EXCLUDE_DIRS = {"_build", "_shots", "_shared", "__pycache__", "review"}


def previews():
    out = os.path.join(RUN, "previews")
    os.makedirs(out, exist_ok=True)
    for c in CONCEPTS:
        for page in ("index", "post"):
            dst = os.path.join(out, f"{c}-{'home' if page == 'index' else 'post'}.png")
            subprocess.run(["node", os.path.join(HERE, "capture.mjs"),
                            os.path.join(RUN, c, page + ".html"), dst,
                            "--height", "900"], check=True)


def refs(html_path):
    html = open(html_path, encoding="utf-8").read()
    found = set()
    for m in re.finditer(r'(?:src|href)=["\']([^"\']+)["\']', html):
        found.add(m.group(1))
    for m in re.finditer(r'url\(["\']?([^"\')]+)["\']?\)', html):
        found.add(m.group(1))
    return found


def verify(root):
    missing, count = [], 0
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in EXCLUDE_DIRS]
        for f in filenames:
            if not f.endswith(".html"):
                continue
            p = os.path.join(dirpath, f)
            for r in refs(p):
                if r.startswith(("http:", "https:", "mailto:", "#", "data:", "javascript:")):
                    continue
                target = os.path.normpath(os.path.join(dirpath, r.split("#")[0].split("?")[0]))
                count += 1
                if not os.path.exists(target):
                    missing.append((os.path.relpath(p, root), r))
    return count, missing


def main():
    if "--no-shots" not in sys.argv:
        previews()
    subprocess.run([sys.executable, os.path.join(HERE, "gallery.py")], check=True)

    tmp = tempfile.mkdtemp(prefix="package-")
    dest = os.path.join(tmp, NAME)
    os.makedirs(dest)
    for item in DELIVERABLE:
        src = os.path.join(RUN, item)
        if os.path.isdir(src):
            shutil.copytree(src, os.path.join(dest, item),
                            ignore=shutil.ignore_patterns("*.py", "__pycache__", "DESIGN.md"))
        elif os.path.exists(src):
            shutil.copy2(src, os.path.join(dest, item))
    count, missing = verify(dest)
    print(f"verified {count} relative references in the copied package; {len(missing)} missing")
    for m in missing:
        print("  MISSING", m)

    zip_path = os.path.join(RUN, NAME + ".zip")
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as z:
        for dirpath, _, filenames in os.walk(dest):
            for f in filenames:
                p = os.path.join(dirpath, f)
                z.write(p, os.path.relpath(p, tmp))
    size = os.path.getsize(zip_path) / 1e6
    print(f"zip: {zip_path} ({size:.1f} MB); extracted copy at {dest}")
    return 1 if missing else 0


if __name__ == "__main__":
    sys.exit(main())
