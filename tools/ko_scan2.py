#!/usr/bin/env python3
"""battledrones-ko: group candidate UI strings by area, for the Korean overlay dictionary."""
import collections, os, re

OUT = "ko-report"
SKIP = ("src/link/modem", "src/link/", "src/net/")
QUOTES = '"' + chr(39) + chr(96)
NOISE = "(){}<>;=*|" + chr(92) + chr(36) + chr(123) + chr(125)
GROUPS = [
    ("g1-units", ("src/sim/balance.ts", "src/unit-info.ts")),
    ("g2-hud", ("src/ui/",)),
    ("g3-menu", ("src/main.ts", "src/models.ts", "src/game/", "src/arena/")),
    ("g4-multi", ("src/versus/", "src/ffa/")),
    ("g5-sim", ("src/sim/",)),
]


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


def group_of(p):
    for name, prefixes in GROUPS:
        for pref in prefixes:
            if p == pref or (pref.endswith("/") and p.startswith(pref)):
                return name
    return "g9-rest"


def ok(s):
    if not 4 <= len(s) <= 150 or chr(10) in s:
        return False
    if chr(36) + chr(123) in s:
        return False
    if any(ch in s for ch in NOISE):
        return False
    if not re.search(r"[A-Za-z]{2,}", s):
        return False
    return bool(re.search(r"[ A-Z]", s))


rows = {name: collections.Counter() for name, _ in GROUPS}
rows["g9-rest"] = collections.Counter()
where = {}
for dp, dn, fn in os.walk("src"):
    if any(dp.startswith(s) for s in SKIP):
        continue
    for f in sorted(fn):
        if not f.endswith((".ts", ".js")):
            continue
        p = os.path.join(dp, f)
        g = group_of(p)
        for s in literals(open(p, encoding="utf-8").read()):
            if ok(s):
                rows[g][s] += 1
                where.setdefault((g, s), p)

os.makedirs(OUT, exist_ok=True)
for f in os.listdir(OUT):
    os.remove(os.path.join(OUT, f))
total = 0
for g in rows:
    items = sorted(rows[g].items(), key=lambda kv: (-kv[1], kv[0]))
    if not items:
        continue
    total += len(items)
    lines, buf, size, part = [], [], 0, 1
    for s, n in items:
        line = "%s\t%s" % (s, where[(g, s)])
        if size + len(line) > 16000:
            lines.append(buf)
            buf, size = [], 0
        buf.append(line + chr(10))
        size += len(line) + 1
    lines.append(buf)
    for i, c in enumerate(lines, 1):
        open("%s/%s-%02d.txt" % (OUT, g, i), "w", encoding="utf-8").write("".join(c))
open(OUT + "/counts.txt", "w", encoding="utf-8").write(
    chr(10).join("%s %d" % (g, len(rows[g])) for g in rows) + chr(10) + "total %d" % total)
print(open(OUT + "/counts.txt", encoding="utf-8").read())
