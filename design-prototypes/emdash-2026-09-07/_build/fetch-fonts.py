"""Bundle Google Fonts families as local woff2 (latin + latin-ext only) so the
prototypes have no runtime network dependency. Prototype tooling only.

Writes <run>/_shared/fonts/<key>-N.woff2 and merges @font-face CSS (with local
`fonts/` paths) into <run>/_shared/fonts/faces.json. Re-runnable; a family
already in faces.json is skipped."""

import json, os, re, sys, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(os.path.dirname(HERE), "_shared", "fonts")
UA = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/128.0 Safari/537.36")

FAMILIES = {
    "fraunces": "Fraunces:ital,opsz,wght@0,9..144,300..900;1,9..144,300..900",
    "instrument-sans": "Instrument+Sans:ital,wdth,wght@0,75..100,400..700;1,75..100,400..700",
    "schibsted-grotesk": "Schibsted+Grotesk:ital,wght@0,400..900;1,400..900",
    "literata": "Literata:ital,opsz,wght@0,7..72,200..900;1,7..72,200..900",
    "bricolage-grotesque": "Bricolage+Grotesque:opsz,wdth,wght@12..96,75..100,200..800",
    "geist": "Geist:wght@100..900",
}
KEEP = ("U+0000-00FF", "U+0100-02BA")  # latin, latin-ext


def get(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read()


def main(keys):
    os.makedirs(OUT, exist_ok=True)
    faces_path = os.path.join(OUT, "faces.json")
    faces = json.load(open(faces_path)) if os.path.exists(faces_path) else {}
    for key in keys:
        if key in faces:
            print("skip", key); continue
        css = get("https://fonts.googleapis.com/css2?family=%s&display=swap" % FAMILIES[key]).decode()
        blocks, n = [], 0
        for block in re.findall(r"@font-face\s*\{[^}]*\}", css):
            ur = re.search(r"unicode-range:\s*([^;]+);", block)
            if not ur or not ur.group(1).strip().startswith(KEEP):
                continue
            src = re.search(r"url\(([^)]+)\)", block).group(1)
            name = "%s-%d.woff2" % (key, n); n += 1
            open(os.path.join(OUT, name), "wb").write(get(src))
            block = re.sub(r"src:\s*url\([^)]+\)\s*format\('woff2'\)",
                           "src: url(fonts/%s) format('woff2')" % name, block)
            blocks.append(block)
        faces[key] = "\n".join(blocks)
        json.dump(faces, open(faces_path, "w"), indent=1)
        print(key, n, "files")


if __name__ == "__main__":
    main(sys.argv[1:] or list(FAMILIES))
