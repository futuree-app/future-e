#!/usr/bin/env python3
"""Compte les marqueurs visuels hérités / Relevé par famille de surfaces.
usage: scan.py <racine> ; les familles sont définies ci-dessous (chemins relatifs à la racine)."""
import os, re, sys, json

ROOT = sys.argv[1]
FAMILLES = json.loads(open(sys.argv[2]).read())

MARQUEURS = {
    "glass": r"\bglass\b",
    "GlassCard": r"GlassCard",
    "monoCaps": r"font-mono[^\"'`]*uppercase|uppercase[^\"'`]*font-mono",
    "trackLarge": r"tracking-\[0\.(?:1|2|3)\d*em\]|tracking-widest|letter-spacing:\s*0\.(?:1|2|3)",
    "rounded>=xl": r"rounded-(?:xl|2xl|3xl)",
    "serif": r"Instrument|font-serif|font-display\b",
    "italicAccent": r"italic[^\"'`\n]{0,60}(?:accent|orange)|(?:accent|orange)[^\"'`\n]{0,60}italic",
    "hexEnDur": r"#[0-9a-fA-F]{6}\b",
    "releve": r"components/releve|releve\.module|Plaque|Marge\b|GlypheGrain",
    "registre": r"--reg-",
    "accueilModule": r"accueil\.module",
    "emoji": r"[\U0001F300-\U0001FAFF☀-➿]",
}

def fichiers(chemins):
    for p in chemins:
        full = os.path.join(ROOT, p)
        if os.path.isfile(full):
            yield full
        elif os.path.isdir(full):
            for d, _, fs in os.walk(full):
                for f in fs:
                    if f.endswith((".tsx", ".ts", ".css")) and ".test." not in f:
                        yield os.path.join(d, f)

print("famille|fichiers|lignes|" + "|".join(MARQUEURS))
for nom, chemins in FAMILLES.items():
    fs = sorted(set(fichiers(chemins)))
    tot = {k: 0 for k in MARQUEURS}
    lignes = 0
    for f in fs:
        t = open(f, encoding="utf-8", errors="ignore").read()
        lignes += t.count("\n")
        for k, rx in MARQUEURS.items():
            tot[k] += len(re.findall(rx, t))
    print(f"{nom}|{len(fs)}|{lignes}|" + "|".join(str(tot[k]) for k in MARQUEURS))
