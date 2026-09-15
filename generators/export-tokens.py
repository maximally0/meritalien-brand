"""Export the design tokens from tokens.css into machine-readable formats.

`tokens.css` is the single source of truth. This reads it and emits:

  tokens/tokens.json   W3C Design Tokens (DTCG) format — for Figma, Style Dictionary,
                       Token Studio, and anything that consumes design tokens.
  tokens/tokens.scss   SCSS variables — for a Sass-based build.

Why generate instead of hand-maintaining: three copies of a palette drift within a
month. There is exactly one place a colour changes, and it is tokens.css.

The script FAILS if it cannot classify every variable. A silent drop is the failure
mode that matters here — a missing token looks exactly like a token that was never
defined, and you only find out when a deck renders the wrong colour.

Usage:  python generators/export-tokens.py
"""
from __future__ import annotations

import json
import os
import re

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SRC = os.path.join(ROOT, "tokens", "tokens.css")

# Colour families. Nesting is exactly ONE level deep (prefix -> name).
# Deeper nesting on '-' is wrong: `--text-invert-muted` is a flat name, not
# `text > invert > muted`, and nesting it there makes `text-invert` both a token
# and a group, which is invalid DTCG.
COLOUR_PREFIXES = ("ink", "paper", "text", "accent", "line")

TYPED = {
    "color": "color",
    "dimension": "dimension",
    "number": "number",
    "fontFamily": "fontFamily",
    "duration": "duration",
    "cubicBezier": "cubicBezier",
    "shadow": "shadow",
}


def parse_css(path: str) -> dict[str, str]:
    """Pull `--name: value;` pairs out of the first :root block."""
    css = open(path, encoding="utf-8").read()
    # strip comments first so commented-out values are not picked up
    css = re.sub(r"/\*.*?\*/", "", css, flags=re.S)
    root = re.search(r":root\s*\{(.*?)\}", css, re.S)
    if not root:
        raise SystemExit("no :root block found in " + path)
    out = {}
    for name, value in re.findall(r"--([a-z0-9-]+)\s*:\s*([^;]+);", root.group(1)):
        out[name] = " ".join(value.split())
    return out


def tok(value: str, type_: str) -> dict:
    return {"$value": value, "$type": type_}


def build(t: dict[str, str]) -> tuple[dict, set[str]]:
    """Return (token tree, set of css variable names consumed)."""
    used: set[str] = set()
    seen: list[str] = []

    def take(name: str, node: dict, key: str, type_: str) -> None:
        if name in t:
            node[key] = tok(t[name], type_)
            used.add(name)
            seen.append(name)

    out: dict = {}

    # ---------------------------------------------------------------- colour --
    colour: dict = {}
    for prefix in COLOUR_PREFIXES:
        fam = colour.setdefault(prefix, {})
        # the bare token, e.g. --accent, --text. Keyed DEFAULT rather than set on
        # the family itself: a node with both $value and children is invalid DTCG.
        take(prefix, fam, "DEFAULT", "color")
        # one level of suffix, kept flat
        for k in sorted(t):
            if k.startswith(prefix + "-"):
                take(k, fam, k[len(prefix) + 1:], "color")
    out["color"] = colour

    # ------------------------------------------------------------ typography --
    typography: dict = {"family": {}, "size": {}, "lineHeight": {}, "letterSpacing": {}}
    for role, key in (("sans", "font-sans"), ("serif", "font-serif"), ("mono", "font-mono")):
        take(key, typography["family"], role, "fontFamily")
    for k in sorted(t):
        if k.startswith("t-"):
            take(k, typography["size"], k[2:], "dimension")
        elif k.startswith("lh-"):
            take(k, typography["lineHeight"], k[3:], "number")
        elif k.startswith("tr-"):
            take(k, typography["letterSpacing"], k[3:], "dimension")
    out["typography"] = typography

    # ----------------------------------------------------------------- space --
    out["space"] = {}
    for k in sorted(t, key=lambda x: int(x[2:]) if x.startswith("s-") and x[2:].isdigit() else 0):
        if k.startswith("s-") and k[2:].isdigit():
            take(k, out["space"], k[2:], "dimension")

    # ---------------------------------------------------------------- radius --
    out["radius"] = {}
    for k in sorted(t):
        if k.startswith("r-"):
            take(k, out["radius"], k[2:], "dimension")

    # ---------------------------------------------------------------- motion --
    motion: dict = {"easing": {}, "duration": {}}
    take("ease", motion["easing"], "DEFAULT", "cubicBezier")
    take("dur", motion["duration"], "DEFAULT", "duration")
    for k in sorted(t):
        if k.startswith("dur-"):
            take(k, motion["duration"], k[4:], "duration")
    out["motion"] = motion

    # ---------------------------------------------------------------- layout --
    out["layout"] = {}
    for k in sorted(t):
        if k in ("shell-max", "shell-x", "band-y"):
            take(k, out["layout"], k, "dimension")

    # ---------------------------------------------------------------- shadow --
    out["shadow"] = {}
    for k in sorted(t):
        if k.startswith("shadow-"):
            take(k, out["shadow"], k[7:], "shadow")

    return out, used


def walk(node, path=()):
    """Yield every token leaf. Recurses even into a node that has $value, so the
    count cannot silently under-report."""
    if isinstance(node, dict):
        if "$value" in node:
            yield path, node
        for k, v in node.items():
            if k != "$value":
                yield from walk(v, path + (k,))


def main() -> int:
    t = parse_css(SRC)
    tokens, used = build(t)

    missing = sorted(set(t) - used)
    print(f"  parsed {len(t)} variables from tokens.css")
    if missing:
        print(f"\n  UNCLASSIFIED ({len(missing)}) — the export would be incomplete:")
        for m in missing:
            print(f"    --{m}: {t[m]}")
        print("\n  Add these to a family in build() before shipping.")
        return 1

    exported = list(walk(tokens))
    print(f"  exported {len(exported)} tokens — every variable accounted for")

    os.makedirs(os.path.join(ROOT, "tokens"), exist_ok=True)
    with open(os.path.join(ROOT, "tokens", "tokens.json"), "w", encoding="utf-8", newline="\n") as fh:
        json.dump(tokens, fh, indent=2, ensure_ascii=False)
        fh.write("\n")

    lines = [
        "// Meritalien design tokens — SCSS variables",
        "// GENERATED from tokens/tokens.css by generators/export-tokens.py.",
        "// Do not edit by hand: edit tokens.css and re-run the generator.",
        "",
    ]
    for k, v in sorted(t.items()):
        safe = re.sub(r"-(\d)", r"_$1", k).replace("-", "_")
        lines.append(f"${safe}: {v};")
    with open(os.path.join(ROOT, "tokens", "tokens.scss"), "w", encoding="utf-8", newline="\n") as fh:
        fh.write("\n".join(lines) + "\n")

    print(f"  tokens.json  written")
    print(f"  tokens.scss  {len(t)} variables")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
