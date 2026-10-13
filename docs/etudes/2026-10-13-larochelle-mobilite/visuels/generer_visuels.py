#!/usr/bin/env python3
"""generer_visuels.py — Les deux visuels de l'article pilote mobilité (carte par IRIS, barres selon le lieu de travail).

Aucune donnée n'est recalculée : la carte lit la fiche validée (`fiches/<insee>/fiche.json`, tableau `iris`,
INSEE RP 2022 base IRIS Activité des résidents) et les contours IRIS IGN archivés avec l'étude
(`iris_ign_<insee>.json`, WFS STATISTICALUNITS.IRISGE:iris_ge). Jointure par code IRIS. Les barres lisent
`resultats/incertitudes_mobpro.csv` (MOBPRO 2022), valeurs exactes avant arrondi.

Sorties dans --out : carte_iris_<insee>[_mobile]_<clair|sombre>.svg/.png, tableau_iris_<insee>.md/.html,
barres_lieu_travail[_mobile]_<clair|sombre>.svg/.png. PNG rendus par Chrome sans interface (2x), police Archivo (Google Fonts) ;
les SVG retombent sur Helvetica Neue / Arial si Archivo est absente.

    python visuels/generer_visuels.py --insee 17300 --fiche fiches/17300/fiche.json \
        --contours <checkout>/data/cache-etudes/2026-10-13-larochelle-mobilite/cache-outil/iris_ign_17300.json \
        --incertitudes resultats/incertitudes_mobpro.csv --out visuels
"""
import argparse, csv, html, json, math, os, subprocess, sys

FONT = "Archivo, 'Helvetica Neue', Arial, sans-serif"
# DEUX THÈMES, chacun avec SA rampe validée sur SA surface (skill dataviz, validate_palette.js --ordinal) :
# clair = fond blanc, la valeur forte est la plus foncée ; sombre = fond --bg-deep du site (#0d1322), la valeur
# forte est la plus lumineuse. Une seule teinte (bleu) : pas d'opposition vert « bon » / rouge « mauvais ».
THEMES = {
    "clair": dict(INK="#1a1d28", INK2="#3d4456", INK3="#5b6373", RULE="#d9d6cf", SURFACE="#ffffff",
                  RAMP=["#86b6ef", "#5598e7", "#2a78d6", "#1c5cab", "#0d366b"], NO_DATA="#eceae5", NON_RES="#d3d0c9",
                  HATCH="#8f8b83", TRACK="#eef1f6", BAR="#1c5cab"),
    "sombre": dict(INK="#f6f4ef", INK2="#c6cfdb", INK3="#9ba3b4", RULE="#2a3246", SURFACE="#0d1322",
                   RAMP=["#1c5cab", "#2a78d6", "#5598e7", "#86b6ef", "#cde2fb"], NO_DATA="#1b2233", NON_RES="#2b3245",
                   HATCH="#6b7488", TRACK="#1a2236", BAR="#5598e7"),
}
CLASSES = [(0.25, 0.35), (0.35, 0.45), (0.45, 0.55), (0.55, 0.65), (0.65, 0.75)]


def set_theme(nom):
    globals().update(THEMES[nom])


set_theme("clair")
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
GFONT = "https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700&display=swap"


def pct(x):
    return f"{round(x * 100):d} %"


def esc(s):
    return html.escape(str(s), quote=True)


def text(x, y, s, size, weight=400, fill=INK, anchor="start", halo=False, extra=""):
    h = f' stroke="{SURFACE}" stroke-width="{max(3, size * 0.28):.1f}" stroke-linejoin="round" paint-order="stroke"' if halo else ""
    return (f'<text x="{x:.1f}" y="{y:.1f}" font-size="{size}" font-weight="{weight}" fill="{fill}" '
            f'text-anchor="{anchor}"{h}{extra}>{esc(s)}</text>')


def wrap(s, n):
    # Typo FR : espace insécable avant « ; : % » pour qu'aucune ponctuation ne commence une ligne. On coupe
    # sur l'espace ordinaire SEULEMENT (str.split() couperait aussi sur l'insécable).
    s = s.replace(" ;", "\u00a0;").replace(" :", "\u00a0:").replace(" %", "\u00a0%")
    out, line = [], ""
    for w in [w for w in s.split(" ") if w]:
        if len(line) + len(w) + 1 > n and line:
            out.append(line); line = w
        else:
            line = (line + " " + w).strip()
    return out + ([line] if line else [])


def svg_doc(w, h, body, title, desc):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}" role="img" '
            f'aria-labelledby="t d" font-family="{FONT}">\n<title id="t">{esc(title)}</title>\n<desc id="d">{esc(desc)}</desc>\n'
            f'<style>@import url("{GFONT}");</style>\n<rect width="{w}" height="{h}" fill="{SURFACE}"/>\n{body}\n</svg>\n')


def render_png(svg_path, w, h):
    """Chrome sans interface : page HTML minimale qui charge Archivo puis affiche le SVG à sa taille."""
    page = svg_path[:-4] + "._rendu.html"
    open(page, "w").write(f'<!doctype html><meta charset="utf-8"><link rel="stylesheet" href="{GFONT}">'
                          f'<style>html,body{{margin:0;background:{SURFACE}}}</style>{open(svg_path).read()}')
    png = svg_path[:-4] + ".png"
    subprocess.run([CHROME, "--headless=new", "--disable-gpu", "--hide-scrollbars", f"--window-size={w},{h}",
                    "--force-device-scale-factor=2", "--virtual-time-budget=4000", f"--screenshot={png}",
                    "file://" + os.path.abspath(page)], check=True, capture_output=True)
    os.remove(page)


# ── 1. Carte ────────────────────────────────────────────────────────────────────────────────
def classe(v):
    for i, (lo, hi) in enumerate(CLASSES):
        if lo <= v < hi:
            return i
    raise SystemExit(f"valeur {v} hors des classes {CLASSES[0][0]}–{CLASSES[-1][1]} : adapter CLASSES")


def rings_of(geom):
    polys = geom["coordinates"] if geom["type"] == "MultiPolygon" else [geom["coordinates"]]
    return [ring for poly in polys for ring in poly]


def area_centroid(ring):
    a = cx = cy = 0.0
    for (x0, y0), (x1, y1) in zip(ring, ring[1:]):
        c = x0 * y1 - x1 * y0; a += c; cx += (x0 + x1) * c; cy += (y0 + y1) * c
    return (cx / (3 * a), cy / (3 * a), abs(a / 2)) if a else (ring[0][0], ring[0][1], 0)


# Libellés de La Rochelle : les secteurs cités dans l'article et un repère connu, posés À LA MAIN dans les espaces
# libres (mer, marges), en fraction du cadre de la carte (0 = gauche/haut, 1 = droite/bas), avec trait de rappel.
# (fx, fy, ancrage, lignes du nom). Pour une autre commune : --libelles CODE[,CODE…], posés au centre du secteur.
LIBELLES_17300 = {
    "173000403": (0.02, 0.05, "start", ["Laleu"]),
    "173000503": (0.56, 0.06, "start", ["Mireuil Est"]),
    "173000103": (0.42, 0.85, "end", ["Centre Préfecture"]),
    "173001002": (0.42, 0.97, "end", ["Les Minimes Université"]),
    "173000902": (1.0, 0.84, "end", ["Villeneuve des", "Salines Ouest"]),
}


def carte(a, mobile):
    fiche = json.load(open(a.fiche))
    if a.insee != fiche["commune"]["insee"]:
        raise SystemExit("la fiche ne correspond pas au code INSEE demandé")
    data = {r["IRIS"]: r for r in fiche["tableaux"].get("iris") or []}
    feats = json.load(open(a.contours))["features"]
    hab = [r for r in data.values() if r["TYP_IRIS"] == "H"]
    if len(hab) < 2:
        raise SystemExit(f"{fiche['commune']['nom']} n'est pas découpée en IRIS d'habitat : pas de carte infra-communale possible.")
    nom = fiche["commune"]["nom"]
    # Projection équirectangulaire locale (commune : quelques km, déformation négligeable).
    pts = [p for f in feats for r in rings_of(f["geometry"]) for p in r]
    lat0 = sum(p[1] for p in pts) / len(pts); k = math.cos(math.radians(lat0))
    xs = [p[0] * k for p in pts]; ys = [-p[1] for p in pts]
    W = 640 if mobile else 1000
    fs = 1.45 if mobile else 1.0
    mx0, my0 = 24, (150 if mobile else 116)
    mw = W - 48 if mobile else 600
    s = mw / (max(xs) - min(xs)); mh = (max(ys) - min(ys)) * s
    P = lambda lon, lat: (mx0 + (lon * k - min(xs)) * s, my0 + (-lat - min(ys)) * s)
    body, stats = [], {"habitat": 0, "non_res": 0, "sans_donnee": 0}
    body.append('<defs><pattern id="hach" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">'
                f'<rect width="7" height="7" fill="{NON_RES}"/><line x1="0" y1="0" x2="0" y2="7" stroke="{HATCH}" stroke-width="1.6"/></pattern></defs>')
    centres = {}
    for f in feats:
        code = f["properties"]["code_iris"]; r = data.get(code)
        d = ""
        best = None
        for ring in rings_of(f["geometry"]):
            q = [P(x, y) for x, y in ring]
            d += "M" + "L".join(f"{x:.1f},{y:.1f}" for x, y in q) + "Z"
            c = area_centroid(q)
            if best is None or c[2] > best[2]:
                best = c
        centres[code] = best
        if r is None or r.get("voiture") is None or r["voiture"] != r["voiture"]:
            fill, cls = NO_DATA, "sans_donnee"; extra = ' stroke-dasharray="3 2"'
        elif r["TYP_IRIS"] != "H":
            fill, cls, extra = "url(#hach)", "non_res", ""
        else:
            fill, cls, extra = RAMP[classe(r["voiture"])], "habitat", ""
        stats[cls] += 1
        lab = f["properties"]["nom_iris"] + (f" : {pct(r['voiture'])}" if cls == "habitat" else " : secteur d'activité, exclu" if cls == "non_res" else " : sans donnée")
        body.append(f'<path d="{d}" fill="{fill}" stroke="{SURFACE}" stroke-width="1.4"{extra} fill-rule="evenodd"><title>{esc(lab)}</title></path>')
    # Libellés
    if a.insee == "17300" and not a.libelles:
        codes = LIBELLES_17300
    else:
        codes = {c: None for c in (a.libelles or "").split(",") if c}
    lh = 15 * fs
    for code, pos in codes.items():
        if code not in centres or code not in data:
            continue
        cx, cy, _ = centres[code]; r = data[code]
        if pos is None:
            lx, ly, anchor, lines = cx, cy, "middle", [r["nom"]]
        else:
            fx, fy, anchor, lines = pos
            lx, ly = mx0 + fx * mw, my0 + fy * mh
            # trait de rappel : du centre du secteur au bord du bloc de texte le plus proche (haut ou bas)
            ey = ly + len(lines) * lh + 5 if ly < cy else ly - lh * 0.95
            body.append(f'<line x1="{cx:.1f}" y1="{cy:.1f}" x2="{lx:.1f}" y2="{ey:.1f}" stroke="{INK}" stroke-width="1"/>'
                        f'<circle cx="{cx:.1f}" cy="{cy:.1f}" r="2.8" fill="{INK}" stroke="{SURFACE}" stroke-width="1"/>')
            lx += -5 if anchor == "end" else 5
        val = pct(r["voiture"]) if r["TYP_IRIS"] == "H" else "non résidentiel"
        for i, l in enumerate(lines):
            body.append(text(lx, ly + i * lh, l, round(13 * fs), 600, INK, anchor, halo=True))
        body.append(text(lx, ly + len(lines) * lh, val, round(13 * fs), 400, INK2, anchor, halo=True))
    # En-tête
    titre = "Aller travailler en voiture : des pratiques différentes selon les secteurs"
    tl = wrap(titre, 34 if mobile else 80)
    y = 34 * fs if mobile else 40
    head = []
    for i, l in enumerate(tl):
        head.append(text(24, y + i * 27 * fs, l, round(22 * fs), 700, INK))
    sub = f"{nom} · part des actifs occupés déclarant la voiture comme mode principal pour aller travailler, par IRIS"
    sy = y + len(tl) * 27 * fs - 2
    for i, l in enumerate(wrap(sub, 52 if mobile else 130)):
        head.append(text(24, sy + i * 19 * fs, l, round(14 * fs), 400, INK2))
    sub_lines = len(wrap(sub, 52 if mobile else 130))
    top = sy + sub_lines * 19 * fs + 12
    shift = top - my0
    # Légende
    leg = []
    lx0 = 24 if mobile else 650
    ly0 = (my0 + mh + shift + 26 + 3 * 15 * fs) if mobile else my0 + shift + 10  # mobile : place des libellés sous la carte
    leg.append(text(lx0, ly0, "Part de la voiture", round(14 * fs), 600, INK))
    sw = round(18 * fs)
    for i, (lo, hi) in enumerate(CLASSES):
        yy = ly0 + 14 * fs + i * (sw + 8)
        leg.append(f'<rect x="{lx0}" y="{yy:.1f}" width="{sw}" height="{sw}" rx="3" fill="{RAMP[i]}"/>')
        leg.append(text(lx0 + sw + 10, yy + sw * 0.75, f"{round(lo*100)} à moins de {round(hi*100)} %", round(13 * fs), 400, INK2))
    yy = ly0 + 14 * fs + 5 * (sw + 8) + 10
    leg.append(f'<rect x="{lx0}" y="{yy:.1f}" width="{sw}" height="{sw}" rx="3" fill="url(#hach)"/>')
    leg.append(text(lx0 + sw + 10, yy + sw * 0.75, f"Secteur d'activité, exclu ({stats['non_res']})", round(13 * fs), 400, INK2))
    yy += sw + 8
    leg.append(f'<rect x="{lx0}" y="{yy:.1f}" width="{sw}" height="{sw}" rx="3" fill="{NO_DATA}" stroke="{HATCH}" stroke-dasharray="3 2"/>')
    leg.append(text(lx0 + sw + 10, yy + sw * 0.75, f"Sans donnée exploitable ({stats['sans_donnee']})", round(13 * fs), 400, INK2))
    # Notes
    notes = [
        "Définition : actifs occupés de 15 ans ou plus résidant dans le secteur, mode de transport principal "
        "déclaré pour aller travailler. Pratiques observées : la carte ne mesure pas la possibilité, pour une "
        "personne, de vivre sans voiture.",
        "Les IRIS sont des secteurs statistiques de l'INSEE ; leurs noms ne correspondent pas toujours aux quartiers "
        "usuels. Estimations par sondage : écarts de quelques points non significatifs.",
        "Source : INSEE, recensement de la population 2022, base infracommunale Activité des résidents ; "
        "contours IRIS IGN. Réalisation futur•e.",
    ]
    nw = 50 if mobile else 46
    nx = 24 if mobile else 650
    ny = (yy + sw + 34 * fs) if mobile else yy + sw + 30
    nb = []
    for n in notes:
        for l in wrap(n, nw):
            nb.append(text(nx, ny, l, round(12 * fs), 400, INK3)); ny += 16.5 * fs
        ny += 8 * fs
    H = max(my0 + shift + mh + 24, ny + 8) if not mobile else ny + 8
    mapg = f'<g transform="translate(0,{shift:.1f})">' + "\n".join(body) + "</g>"
    svg = svg_doc(W, math.ceil(H), "\n".join(head) + "\n" + mapg + "\n" + "\n".join(leg) + "\n" + "\n".join(nb), titre, alt_carte(fiche))
    return svg, W, math.ceil(H), stats, data, fiche


def alt_carte(fiche):
    h = [r for r in fiche["tableaux"]["iris"] if r["TYP_IRIS"] == "H" and r["voiture"] == r["voiture"]]
    lo = min(h, key=lambda r: r["voiture"]); hi = max(h, key=lambda r: r["voiture"])
    return (f"Carte de {fiche['commune']['nom']} découpée en {len(h)} secteurs statistiques (IRIS) d'habitat, colorés selon "
            f"la part des actifs qui vont travailler principalement en voiture (cinq classes de bleu, de 25 à 75 %). Les secteurs du "
            f"centre ont les parts les plus basses (environ {pct(lo['voiture'])} pour {lo['nom']}) ; les plus élevées "
            f"dépassent 65 % (jusqu'à environ {pct(hi['voiture'])} pour {hi['nom']}). Un secteur d'activité est exclu. "
            f"Source : INSEE, recensement 2022.")


def tableau(fiche, out, insee):
    rows = sorted([r for r in fiche["tableaux"]["iris"]], key=lambda r: r["nom"])
    nom = fiche["commune"]["nom"]
    md = [f"# Part de la voiture pour aller travailler, par secteur (IRIS) · {nom}", "",
          "Actifs occupés de 15 ans ou plus résidant dans le secteur, mode principal déclaré. Secteurs classés par ordre "
          "alphabétique (ce n'est pas un classement). Valeurs arrondies au point ; estimations par sondage, écarts de "
          "quelques points non significatifs. Source : INSEE, recensement 2022, base infracommunale Activité des résidents.", "",
          "| Secteur (IRIS, libellé INSEE) | Part de la voiture |", "|---|---|"]
    trs = []
    for r in rows:
        v = pct(r["voiture"]) if r["TYP_IRIS"] == "H" and r["voiture"] == r["voiture"] else ("secteur d'activité, exclu" if r["TYP_IRIS"] != "H" else "sans donnée")
        md.append(f"| {r['nom']} | {v} |")
        trs.append(f"<tr><th scope=\"row\">{esc(r['nom'])}</th><td>{esc(v)}</td></tr>")
    open(os.path.join(out, f"tableau_iris_{insee}.md"), "w").write("\n".join(md) + "\n")
    open(os.path.join(out, f"tableau_iris_{insee}.html"), "w").write(
        f'<table>\n<caption>Part des actifs allant travailler principalement en voiture, par secteur statistique (IRIS), '
        f'{esc(nom)}. Ordre alphabétique. Source : INSEE, recensement 2022.</caption>\n'
        f'<thead><tr><th scope="col">Secteur (IRIS)</th><th scope="col">Part de la voiture</th></tr></thead>\n<tbody>\n'
        + "\n".join(trs) + "\n</tbody>\n</table>\n")


# ── 2. Barres ───────────────────────────────────────────────────────────────────────────────
def barres(a, mobile):
    vals = {}
    for r in csv.DictReader(open(a.incertitudes)):
        vals[r["indicateur"]] = float(r["p"])
    v_ici = vals["Rochelais travaillant à La Rochelle : voiture"]
    v_vois = vals["Rochelais travaillant à Périgny/Aytré/Lagord/Puilboreau : voiture"]
    W = 640 if mobile else 1000
    fs = 1.45 if mobile else 1.0
    titre = "Habiter La Rochelle, travailler ici ou dans une commune voisine"
    sous = "Part utilisant principalement la voiture pour aller travailler, parmi les actifs résidant à La Rochelle."
    note = ("Deux groupes distincts de résidents. Cet écart décrit des pratiques ; il ne mesure pas l'effet causal "
            "du lieu de travail. Source : INSEE, recensement 2022.")
    b = []
    y = 40 * fs
    for l in wrap(titre, 34 if mobile else 80):
        b.append(text(24, y, l, round(22 * fs), 700, INK)); y += 27 * fs
    y -= 4
    for l in wrap(sous, 52 if mobile else 110):
        b.append(text(24, y, l, round(14 * fs), 400, INK2)); y += 19 * fs
    y += 22 * fs
    groupes = [("Travaille à La Rochelle", v_ici), ("Travaille à Aytré, Lagord, Périgny ou Puilboreau", v_vois)]
    x0 = 24; xw = W - 48 - (70 * fs)  # place pour la valeur à droite de la barre
    bh = round(30 * fs)
    # Graduations 0 à 100 %
    ticks = []
    for t in (0, 0.25, 0.5, 0.75, 1.0):
        tx = x0 + t * xw
        ticks.append((tx, t))
    top = y
    for lab, v in groupes:
        for l in wrap(lab, 44 if mobile else 90):
            b.append(text(x0, y, l, round(15 * fs), 600, INK)); y += 19 * fs
        y += 4
        b.append(f'<rect x="{x0}" y="{y:.1f}" width="{xw:.1f}" height="{bh}" rx="4" fill="{TRACK}"/>')
        # graduations limitées à la piste de la barre : elles ne traversent pas les intitulés
        for tx, t in ticks[1:]:
            b.append(f'<line x1="{tx:.1f}" y1="{y:.1f}" x2="{tx:.1f}" y2="{y + bh:.1f}" stroke="{RULE}" stroke-width="1"/>')
        b.append(f'<rect x="{x0}" y="{y:.1f}" width="{v * xw:.1f}" height="{bh}" rx="4" fill="{BAR}"><title>{esc(lab)} : {v*100:.1f} %</title></rect>')
        b.append(text(x0 + v * xw + 10, y + bh * 0.72, pct(v), round(20 * fs), 700, INK))
        y += bh + 24 * fs
    bottom = y - 24 * fs + 4
    grid = []
    for tx, t in ticks:
        grid.append(f'<line x1="{tx:.1f}" y1="{bottom - 2:.1f}" x2="{tx:.1f}" y2="{bottom + 6:.1f}" stroke="{RULE}" stroke-width="1"/>')
        grid.append(text(tx, bottom + 22 * fs, f"{round(t*100)} %", round(12 * fs), 400, INK3, "middle"))
    y = bottom + 50 * fs
    for l in wrap(note, 60 if mobile else 120):
        b.append(text(24, y, l, round(12.5 * fs), 400, INK3)); y += 17 * fs
    H = math.ceil(y + 6)
    alt = (f"Graphique en deux barres sur une échelle de 0 à 100 %. Parmi les actifs résidant à La Rochelle, "
           f"{pct(v_ici)} de ceux qui travaillent à La Rochelle vont travailler principalement en voiture, contre "
           f"{pct(v_vois)} de ceux qui travaillent à Aytré, Lagord, Périgny ou Puilboreau. Deux groupes distincts ; "
           f"l'écart décrit des pratiques, pas un effet causal. Source : INSEE, recensement 2022.")
    return svg_doc(W, H, "\n".join(grid) + "\n" + "\n".join(b), titre, alt), W, H, (v_ici, v_vois), alt


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--insee", default="17300"); p.add_argument("--fiche", required=True); p.add_argument("--contours", required=True)
    p.add_argument("--incertitudes", required=True); p.add_argument("--out", required=True)
    p.add_argument("--libelles", default=""); p.add_argument("--sans-png", action="store_true")
    a = p.parse_args(); os.makedirs(a.out, exist_ok=True)
    for theme, mobile in [(t, m) for t in THEMES for m in (False, True)]:
        set_theme(theme)
        suf = ("_mobile" if mobile else "") + f"_{theme}"
        svg, W, H, stats, data, fiche = carte(a, mobile)
        f = os.path.join(a.out, f"carte_iris_{a.insee}{suf}.svg"); open(f, "w").write(svg)
        if not a.sans_png:
            render_png(f, W, H)
        if a.insee == "17300":
            svg, W, H, vals, alt_b = barres(a, mobile)
            f = os.path.join(a.out, f"barres_lieu_travail{suf}.svg"); open(f, "w").write(svg)
            if not a.sans_png:
                render_png(f, W, H)
    tableau(fiche, a.out, a.insee)
    print(json.dumps({"carte": stats, "barres": vals if a.insee == "17300" else None, "alt_carte": alt_carte(fiche)}, ensure_ascii=False, indent=1))


if __name__ == "__main__":
    main()
