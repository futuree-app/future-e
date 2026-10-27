# FUT-81 — L'ORACLE INDÉPENDANT DES AIRES D'INTERSECTION (deuxième revue indépendante, 27/10/2026).
#
# Calcule avec GEOS (via Shapely) l'aire de A ∩ B et de B ∩ A pour :
#   1. un corpus synthétique en mètres : les contre-épreuves de la revue (bandes de 4 mm, chevauchements
#      millimétriques, frontières communes), des cas obliques, concaves, à trous, multipolygones, des
#      géométries invalides, et des paires aléatoires aux frontières quasi communes (graine fixe) ;
#   2. chaque surface (zone, secteur, prescription) des relevés réels `src/lib/__fixtures__/fut81/`,
#      projetée par la MÊME formule que la production (équirectangulaire sur le premier sommet de la
#      parcelle), ET dans une projection azimutale équivalente de Lambert (pyproj), indépendante de la
#      nôtre : elle contrôle l'approximation de la projection elle-même.
#
# Le résultat est versionné dans `src/lib/__fixtures__/fut81/oracle-geos.json` et lu par
# `src/lib/fut81-geometrie-oracle.test.ts` : les tests ne dépendent pas de Python, mais leurs valeurs
# attendues ne viennent pas de l'algorithme testé.
#
# Usage : python3 -m venv /tmp/v && /tmp/v/bin/pip install shapely pyproj
#         /tmp/v/bin/python -I scripts/research/fut81-oracle-geos.py <racine du dépôt>
import json, math, os, random, sys
import shapely
import pyproj
from shapely.geometry import Polygon, MultiPolygon, box, mapping, shape
from shapely import affinity
from shapely.ops import transform  # noqa: dépréciée en 2.2, toujours exacte
import warnings
warnings.filterwarnings("ignore", category=DeprecationWarning)

racine = sys.argv[1]
random.seed(81)
synthetiques = []

def ajouter(nom, a, b, famille):
    def aire(g):
        try:
            return a.intersection(b).area if g == "ab" else b.intersection(a).area
        except shapely.errors.GEOSException:
            return None
    synthetiques.append({
        "nom": nom, "famille": famille, "a": mapping(a), "b": mapping(b),
        "valideA": a.is_valid, "valideB": b.is_valid,
        "ab": aire("ab"), "ba": aire("ba"), "aireA": a.area, "aireB": b.area,
    })

A = box(0, 0, 100, 100)
# 1. Les rectangles de la revue, dans les deux ordres (l'ordre est rejoué par le test).
ajouter("revue : bande extérieure [100 ; 100,004], frontière commune", A, box(100, 0, 100.004, 100), "revue")
ajouter("revue : chevauchement réel de 0,2 m² [99,998 ; 100,002]", A, box(99.998, 0, 100.002, 100), "revue")
# 2–3. Bande séparée de 1 mm, frontière exactement commune.
ajouter("bande extérieure séparée de 1 mm", A, box(100.001, 0, 100.005, 100), "contact")
ajouter("bande extérieure de 10 m, frontière exactement commune", A, box(100, 0, 110, 100), "contact")
ajouter("coin commun seulement", A, box(100, 100, 110, 110), "contact")
# 4–5. Chevauchements de 2 mm, 4 mm, 2 cm ; intersection réelle de 0,2 m².
for d in (0.002, 0.004, 0.02):
    ajouter(f"chevauchement de {d * 1000:g} mm (bande large)", A, box(100 - d, 0, 110, 100), "micro")
    ajouter(f"chevauchement de {d * 1000:g} mm (bande de 4 mm)", A, box(100 - d, 0, 100 - d + 0.004, 100), "micro")
ajouter("intersection réelle de 0,2 m² (bande de 1 m)", A, box(99.998, 0, 100.998, 100), "micro")
# 6. Les bandes réelles de la première revue.
for largeur, s in ((0.5, 50), (0.3, 30)):
    ajouter(f"bande intérieure de {s} m²", A, box(1, 0, 1 + largeur, 100), "bande")
# 7. Zones réellement partagées.
ajouter("zones partagées 40/60 : UA", A, box(-500, -500, 40, 500), "partage")
ajouter("zones partagées 40/60 : UB", A, box(40, -500, 500, 500), "partage")
ajouter("zone qui couvre toute la parcelle", A, box(-500, -500, 500, 500), "partage")
ajouter("zone identique à la parcelle", A, box(0, 0, 100, 100), "partage")
# 8. Concave, trou, multipolygone.
concave = Polygon([(0, 0), (100, 0), (100, 50), (50, 50), (50, 100), (0, 100)])
ajouter("concave : dans l'encoche", concave, box(60, 60, 90, 90), "concave")
ajouter("concave : à cheval sur l'angle rentrant", concave, box(40, 40, 70, 70), "concave")
ajouter("concave : bande de 4 mm contre l'angle rentrant", concave, box(50, 50, 50.004, 100), "concave")
troue = Polygon([(0, 0), (100, 0), (100, 100), (0, 100)], [[(25, 25), (75, 25), (75, 75), (25, 75)]])
ajouter("trou : zone dans le trou", troue, box(30, 30, 70, 70), "trou")
ajouter("trou : zone à cheval sur le trou", troue, box(0, 0, 50, 50), "trou")
ajouter("trou : zone égale au trou (frontière commune)", troue, box(25, 25, 75, 75), "trou")
ajouter("trou : zone qui déborde du trou de 2 mm", troue, box(24.998, 25, 75, 75), "trou")
ajouter("trou : bande de 4 mm dans le trou, contre son bord", troue, box(25, 25, 25.004, 75), "trou")
multi = MultiPolygon([box(0, 0, 10, 10), box(90, 90, 100, 100)])
ajouter("multipolygone : une partie", multi, box(0, 0, 10, 10), "multi")
ajouter("multipolygone : à cheval sur les deux", multi, box(5, 5, 95, 95), "multi")
ajouter("multipolygone : bande de 4 mm entre deux parties", multi, box(10, 0, 10.004, 10), "multi")
# Obliques : les cas de la revue tournés (aucune arête alignée sur les axes).
for ang in (7, 30, 45, 61):
    ra = affinity.rotate(A, ang, origin=(0, 0))
    for nom, b in (("frontière commune, bande de 4 mm", box(100, 0, 100.004, 100)),
                   ("chevauchement de 2 mm", box(99.998, 0, 100.002, 100)),
                   ("séparée de 1 mm", box(100.001, 0, 100.005, 100))):
        ajouter(f"rotation {ang}° : {nom}", ra, affinity.rotate(b, ang, origin=(0, 0)), "oblique")
# 10. Géométries invalides : la production doit refuser de mesurer (GEOS les dit invalides).
noeud = Polygon([(0, 0), (100, 100), (100, 0), (0, 60)])  # asymétrique : son aire signée n'est pas nulle
ajouter("invalide : zone en nœud papillon", A, noeud, "invalide")
ajouter("invalide : parcelle en nœud papillon", noeud, box(0, 0, 50, 50), "invalide")
trou_dehors = Polygon([(0, 0), (10, 0), (10, 10), (0, 10)], [[(20, 20), (30, 20), (30, 30), (20, 30)]])
ajouter("invalide : trou hors de son contour", A, trou_dehors, "invalide")
chevauche = MultiPolygon([box(0, 0, 60, 60), box(40, 40, 100, 100)])
ajouter("invalide : multipolygone dont les parties se recouvrent", A, chevauche, "invalide")

# Grandes zones (des milliers de sommets, à des kilomètres) : la production les découpe d'abord à une
# fenêtre autour de la parcelle ; GEOS les prend entières.
def grande(n, R, cx, cy, trou=None):
    pts = [(cx + R * (0.8 + 0.2 * math.sin(i * 7.3)) * math.cos(2 * math.pi * i / n),
            cy + R * (0.8 + 0.2 * math.sin(i * 7.3)) * math.sin(2 * math.pi * i / n)) for i in range(n)]
    return Polygon(pts, [trou] if trou else None)
ajouter("grande zone (2 000 sommets, 8 km) : son bord sinueux traverse la parcelle (a)", A, grande(2000, 8000, -6420, 0), "grande")
ajouter("grande zone (2 000 sommets, 8 km) : son bord sinueux traverse la parcelle (b)", A, grande(2000, 8000, -6350, 0), "grande")
ajouter("grande zone : la fenêtre tombe dans son trou", A, grande(2000, 8000, 0, 0, [(-500, -500), (-500, 600), (600, 600), (600, -500)]), "grande")
ajouter("grande zone : son trou recoupe la parcelle", A, grande(2000, 8000, 0, 0, [(50, -500), (50, 600), (600, 600), (600, -500)]), "grande")

# Aléatoire : polygones étoilés (concaves), avec ou sans trou, ou en deux parties, et une zone qui
# reprend une arête de la parcelle décalée de 0 à 2 cm (frontières quasi communes), ou libre.
def etoile(cx, cy, r, n):
    pts = []
    for i in range(n):
        t = 2 * math.pi * i / n + random.uniform(-0.2, 0.2) / n
        rr = r * random.uniform(0.4, 1.0)
        pts.append((cx + rr * math.cos(t), cy + rr * math.sin(t)))
    return Polygon(pts)

def parcelle():
    a = etoile(0, 0, random.uniform(10, 80), random.randint(3, 14))
    forme = random.choice(["simple", "simple", "trou", "multi"])
    if forme == "trou":
        h = affinity.scale(a, 0.3, 0.3, origin=a.centroid)
        a = Polygon(a.exterior.coords, [h.exterior.coords]) if a.contains(h) else a
    elif forme == "multi":
        b = etoile(200, 0, random.uniform(10, 50), random.randint(3, 10))
        a = MultiPolygon([a, b])
    return a

k = 0
while k < 400:
    a = parcelle()
    mode = random.choice(["libre", "decale", "voisin", "decale"])
    if mode == "libre":
        b = etoile(random.uniform(-60, 60), random.uniform(-60, 60), random.uniform(5, 80), random.randint(3, 14))
    else:
        ext = (a.geoms[0] if isinstance(a, MultiPolygon) else a).exterior
        cs = list(ext.coords)[:-1]
        i = random.randrange(len(cs))
        p, q = cs[i], cs[(i + 1) % len(cs)]
        nx, ny = q[1] - p[1], p[0] - q[0]
        L = math.hypot(nx, ny)
        nx, ny = nx / L, ny / L
        if not ext.is_ccw:
            nx, ny = -nx, -ny  # normale extérieure
        e = random.choice([0, 0, 0, 1e-6, 0.001, -0.001, 0.002, -0.002, 0.004, -0.004, 0.02, -0.02])
        w = random.choice([0.004, 0.01, 0.5, 5]) if mode == "voisin" else random.uniform(1, 30)
        p2, q2 = (p[0] + nx * e, p[1] + ny * e), (q[0] + nx * e, q[1] + ny * e)
        b = Polygon([p2, q2, (q2[0] + nx * w, q2[1] + ny * w), (p2[0] + nx * w, p2[1] + ny * w)])
    if not (a.is_valid and b.is_valid):
        continue
    ajouter(f"aléatoire {k} ({mode})", a, b, "aleatoire")
    k += 1

# Les relevés réels.
def premier(v):
    if isinstance(v, list) and len(v) >= 2 and all(isinstance(x, (int, float)) for x in v[:2]):
        return v
    if isinstance(v, list):
        for w in v:
            r = premier(w)
            if r:
                return r
    return None

reels = []
lignes = []
dossier = os.path.join(racine, "src/lib/__fixtures__/fut81")
for f in sorted(os.listdir(dossier)):
    if not f.endswith(".json") or f == "oracle-geos.json":
        continue
    x = json.load(open(os.path.join(dossier, f)))
    if not x.get("parcelle"):
        continue
    lon0, lat0 = premier(x["parcelle"]["geometry"]["coordinates"])[:2]
    # La formule de `projectionAutour` (production) : GRS80, rayons de courbure à la latitude du centre.
    phi = math.radians(lat0)
    w = 1 - 0.0066943800229 * math.sin(phi) ** 2
    kx = 6378137 / math.sqrt(w) * math.cos(phi) * math.pi / 180
    ky = 6378137 * (1 - 0.0066943800229) / w ** 1.5 * math.pi / 180
    equirect = lambda lon, lat, z=None: ((lon - lon0) * kx, (lat - lat0) * ky)
    laea = pyproj.Transformer.from_crs("EPSG:4326", f"+proj=laea +lat_0={lat0} +lon_0={lon0} +ellps=GRS80 +units=m", always_xy=True).transform
    P = shape(x["parcelle"]["geometry"])
    for couche in ("zone", "secteur", "prescriptionSurf"):
        for i, feat in enumerate((x.get(couche) or {}).get("features") or []):
            g = feat.get("geometry")
            if not g or g.get("type") not in ("Polygon", "MultiPolygon") or not g.get("coordinates"):
                continue
            R = shape(g)
            def inter(p):
                try:
                    return transform(p, P).intersection(transform(p, R)).area
                except shapely.errors.GEOSException:
                    return None
            reels.append({
                "cas": f[:-5], "couche": couche, "indice": i, "libelle": (feat.get("properties") or {}).get("libelle"),
                "valides": [transform(equirect, P).is_valid, transform(equirect, R).is_valid],
                "aire": inter(equirect), "aireEquivalente": inter(laea),
                "aireParcelle": transform(equirect, P).area, "aireParcelleEquivalente": transform(laea, P).area,
            })

    # Les lignes (alignements, haies…) : longueur dans la parcelle, frontière comprise chez GEOS.
    for i, feat in enumerate((x.get("prescriptionLin") or {}).get("features") or []):
        g = feat.get("geometry")
        if not g or g.get("type") not in ("LineString", "MultiLineString") or not g.get("coordinates"):
            continue
        L = shape(g)
        lignes.append({
            "cas": f[:-5], "indice": i, "libelle": (feat.get("properties") or {}).get("libelle"),
            "longueur": transform(equirect, P).intersection(transform(equirect, L)).length,
            "longueurEquivalente": transform(laea, P).intersection(transform(laea, L)).length,
        })

json.dump({
    "genere": "scripts/research/fut81-oracle-geos.py", "graine": 81,
    "geos": shapely.geos_version_string, "shapely": shapely.__version__, "pyproj": pyproj.__version__,
    "synthetiques": synthetiques, "reels": reels, "lignes": lignes,
}, open(os.path.join(dossier, "oracle-geos.json"), "w"), ensure_ascii=False, separators=(",", ":"))
print(len(synthetiques), "synthétiques,", len(reels), "surfaces réelles,", len(lignes), "lignes réelles")
