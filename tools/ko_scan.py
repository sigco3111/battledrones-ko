#!/usr/bin/env python3
"""battledrones-ko: list screen-text candidates and runtime stats for the Korean overlay."""
import collections, os, re

OUT = "ko-report"
SKIP = ("src/link/modem",)
QUOTES = '"' + chr(39) + chr(96)


def literals(src):
    out, i, n = [], 0, len(src)
    while i < n:
        c = src[i]
        if c in QUOTES:
            j = i + 1
            while j < n and src[j] != c and src[j] != chr(10):
                j += 2 if src[j] == chr(92) else 1
            out.append(src[i + 1:j])
            i = j + 1
        else:
            i += 1
    return out


rows, where, text = collections.Counter(), {}, []
for dp, dn, fn in os.walk("src"):
    if any(dp.startswith(s) for s in SKIP):
        continue
    for f in sorted(fn):
        if not f.endswith((".ts", ".js")):
            continue
        p = os.path.join(dp, f)
        src = open(p, encoding="utf-8").read()
        text.append(src)
        for s in literals(src):
            if not 3 <= len(s) <= 160 or chr(10) in s:
                continue
            if "\u0024{" in s:
                continue
            if not re.search(r"[A-Za-z]", s) or re.match(r"^[a-z0-9_.:/-]+$", s):
                continue
            if not re.search(r"[ A-Z]", s):
                continue
            rows[s] += 1
            where.setdefault(s, p)

alltext = chr(10).join(text)
os.makedirs(OUT, exist_ok=True)
for f in os.listdir(OUT):
    os.remove(os.path.join(OUT, f))

lines = ["%s	%d	%s" % (s, n, where[s]) for s, n in sorted(rows.items(), key=lambda kv: (-kv[1], kv[0]))]
chunks, buf, size = [], [], 0
for line in lines:
    if size + len(line) > 17000:
        chunks.append(buf)
        buf, size = [], 0
    buf.append(line + chr(10))
    size += len(line) + 1
chunks.append(buf)
for i, c in enumerate(chunks, 1):
    open("%s/strings-%02d.tsv" % (OUT, i), "w", encoding="utf-8").write("".join(c))

stats = ["strings: %d" % len(lines)]
for k in ["fillText", "innerHTML", "textContent", "insertAdjacentHTML", "document.title"]:
    stats.append("%s: %d" % (k, alltext.count(k)))
hosts = sorted(set(re.findall(r"(?:https?|wss?)://[A-Za-z0-9.-]+", alltext)))
stats.append("hosts: " + " ".join(hosts))
open(OUT + "/stats.txt", "w", encoding="utf-8").write(chr(10).join(stats))
print(chr(10).join(stats))
