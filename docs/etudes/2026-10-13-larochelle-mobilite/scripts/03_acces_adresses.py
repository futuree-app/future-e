#!/usr/bin/env python3
"""03_acces_adresses.py — Accès aux services et au bus depuis CHAQUE adresse, La Rochelle et 5 voisines.

Sources :
  - BAN, adresses-17.csv.gz (adresse.data.gouv.fr, « latest », téléchargé le 13/10/2026 10:20 UTC).
    Points d'adresse : ce ne sont ni des logements ni des habitants (un immeuble = une adresse).
  - BPE 2025 INSEE (data/bpe25.parquet du checkout, non versionné ; même source que data/bpe-points).
    Coordonnées Lambert 93 (LAMBERT_X/Y) ; position = adresse de l'établissement, pas son entrée.
  - GTFS Yélo (NA Mobilités, transport.data.gouv.fr id 632a56a68a907ff3d4eacfa4, fichiers du 09/10/2026,
    validité 07/10/2026–30/04/2027, téléchargé le 13/10/2026 10:20 UTC). Jour de référence : mardi 13/10/2026,
    période scolaire. Lignes régulières seulement (liste explicite : 1 à 22, NCV, 393, BUSDEMER, PASSEUR ; scolaires, nuit, dimanche, stade exclues). La ligne 6 « Lycée Vieljeux » est une ligne urbaine (58 courses/jour) : elle est bien incluse.
  - Contours IRIS IGN (WFS STATISTICALUNITS.IRISGE:iris_ge), pour rattacher l'adresse à son IRIS.

Distances À VOL D'OISEAU. Le contrôle sur réseau (cf. 04) montre qu'elles sous-estiment la marche réelle.
On publie donc des seuils larges (500 m, 1 km), jamais « à X minutes ».

Pondération : chaque adresse pèse  ménages de son IRIS / nombre d'adresses de l'IRIS  (RP 2022). Cela
corrige le poids des IRIS entre eux, pas la densité à l'intérieur d'un IRIS (une maison = un immeuble).

Usage : python 03_acces_adresses.py <dl> <bpe25.parquet> <resultats>
"""
import sys, os, json, gzip, csv
import numpy as np
import pandas as pd
import pyarrow.parquet as pq
from shapely.geometry import shape, Point
from shapely.strtree import STRtree
from pyproj import Transformer

DL, BPE, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
COMS = {"17300": "La Rochelle", "17200": "Lagord", "17291": "Puilboreau", "17028": "Aytré",
        "17274": "Périgny", "17094": "Châtelaillon-Plage"}
to_l93 = Transformer.from_crs("EPSG:4326", "EPSG:2154", always_xy=True)

# ── Adresses ────────────────────────────────────────────────────────────────────────────────
ban = pd.read_csv(os.path.join(DL, "ban/adresses-17.csv.gz"), sep=";", dtype=str,
                  usecols=["id", "code_insee", "lon", "lat", "x", "y", "type_position"])
ban = ban[ban["code_insee"].isin(COMS)].copy()
ban["x"] = ban["x"].astype(float); ban["y"] = ban["y"].astype(float)
ban["lon"] = ban["lon"].astype(float); ban["lat"] = ban["lat"].astype(float)

# ── IRIS ────────────────────────────────────────────────────────────────────────────────────
geoms, codes = [], []
for c in COMS:
    for f in json.load(open(os.path.join(DL, f"ign/iris_{c}.json")))["features"]:
        geoms.append(shape(f["geometry"])); codes.append(f["properties"]["code_iris"])
tree = STRtree(geoms)
def iris_of(lon, lat):
    p = Point(lon, lat)
    for i in tree.query(p):
        if geoms[i].contains(p):
            return codes[i]
    return None
ban["IRIS"] = [iris_of(a, b) for a, b in zip(ban["lon"], ban["lat"])]
iris = pd.read_csv(os.path.join(OUT, "iris_mobilite_2022.csv"), dtype={"IRIS": str, "COM": str})
men = iris.set_index("IRIS")["menages"].to_dict()
cnt = ban.groupby("IRIS")["id"].count().to_dict()
ban["poids"] = [men.get(i, np.nan) / cnt[i] if i in cnt else np.nan for i in ban["IRIS"]]

# ── BPE ─────────────────────────────────────────────────────────────────────────────────────
CATS = {
    "supermarche": ["B104", "B105"], "commerce_alim": ["B104", "B105", "B201", "B202", "B207"],
    "boulangerie": ["B207"], "pharmacie": ["D307"], "medecin_generaliste": ["D265"],
    "ecole_elementaire": ["C108", "C109"], "college": ["C201"], "gare": ["E107", "E108", "E109"],
}
bpe = pq.read_table(BPE, columns=["DEPCOM", "TYPEQU", "LAMBERT_X", "LAMBERT_Y", "NOMRS"],
                    filters=[("DEP", "=", "17")]).to_pandas()
bpe = bpe.dropna(subset=["LAMBERT_X", "LAMBERT_Y"])
bpe["LAMBERT_X"] = bpe["LAMBERT_X"].astype(float); bpe["LAMBERT_Y"] = bpe["LAMBERT_Y"].astype(float)
A = ban[["x", "y"]].to_numpy()

def nearest(pts):
    """Distance (m) de chaque adresse au point le plus proche (L93, euclidien = vol d'oiseau)."""
    best = np.full(len(A), np.inf)
    for i in range(0, len(pts), 200):
        P = pts[i:i + 200]
        d = np.sqrt(((A[:, None, :] - P[None, :, :]) ** 2).sum(-1)).min(1)
        best = np.minimum(best, d)
    return best

for k, tq in CATS.items():
    pts = bpe[bpe["TYPEQU"].isin(tq)][["LAMBERT_X", "LAMBERT_Y"]].drop_duplicates().to_numpy()
    ban[f"d_{k}"] = nearest(pts)
gare_lr = bpe[(bpe["TYPEQU"] == "E107") & (bpe["DEPCOM"] == "17300")][["LAMBERT_X", "LAMBERT_Y"]].to_numpy()
ban["d_gare_la_rochelle"] = nearest(gare_lr)

# ── GTFS : courses distinctes passant à moins de 400 m, mardi 13/10/2026, 7h-9h ────────────────
G = os.path.join(DL, "gtfs/yelo")
routes = pd.read_csv(os.path.join(G, "routes.txt"), dtype=str)
regular = routes[routes["route_short_name"].str.fullmatch(r"\d{1,2}|NCV|393|BUSDEMER|PASSEUR")]["route_id"]
trips = pd.read_csv(os.path.join(G, "trips.txt"), dtype=str)
cal = pd.read_csv(os.path.join(G, "calendar.txt"), dtype=str)
cd = pd.read_csv(os.path.join(G, "calendar_dates.txt"), dtype=str)
DAY, WD = "20261013", "tuesday"
active = set(cal[(cal[WD] == "1") & (cal["start_date"] <= DAY) & (cal["end_date"] >= DAY)]["service_id"])
active |= set(cd[(cd["date"] == DAY) & (cd["exception_type"] == "1")]["service_id"])
active -= set(cd[(cd["date"] == DAY) & (cd["exception_type"] == "2")]["service_id"])
tr = trips[trips["service_id"].isin(active) & trips["route_id"].isin(regular)]
st = pd.read_csv(os.path.join(G, "stop_times.txt"), dtype=str, usecols=["trip_id", "stop_id", "departure_time"])
st = st[st["trip_id"].isin(set(tr["trip_id"]))]
st["h"] = st["departure_time"].str.slice(0, 2).astype(int)
stops = pd.read_csv(os.path.join(G, "stops.txt"), dtype={"stop_id": str})
sx, sy = to_l93.transform(stops["stop_lon"].astype(float).to_numpy(), stops["stop_lat"].astype(float).to_numpy())
stops["X"], stops["Y"] = sx, sy
spos = stops.set_index("stop_id")[["X", "Y"]]

def courses_par_heure(h0, h1, radius=400):
    s = st[(st["h"] >= h0) & (st["h"] < h1)]
    by_stop = s.groupby("stop_id")["trip_id"].apply(set)
    by_stop = by_stop[by_stop.index.isin(spos.index)]
    P = spos.loc[by_stop.index].to_numpy()
    sets = list(by_stop.values)
    res = np.zeros(len(A))
    for i in range(len(A)):
        d = np.sqrt(((P - A[i]) ** 2).sum(1))
        near = np.nonzero(d <= radius)[0]
        if len(near):
            u = set().union(*[sets[j] for j in near])
            res[i] = len(u) / (h1 - h0)
    return res

ban["bus_7_9h"] = courses_par_heure(7, 9)
ban["bus_20_21h"] = courses_par_heure(20, 22)
ban.drop(columns=["x", "y"]).to_csv(os.path.join(OUT, "adresses_acces.csv.gz"), index=False, compression="gzip")

# ── Agrégats ────────────────────────────────────────────────────────────────────────────────
def summary(df):
    w = df["poids"].fillna(0)
    W = w.sum()
    o = {"adresses": int(len(df)), "menages_ponderes": round(W)}
    for k in CATS:
        o[f"{k}_500m"] = round(float((w * (df[f"d_{k}"] <= 500)).sum() / W), 3)
        o[f"{k}_1km"] = round(float((w * (df[f"d_{k}"] <= 1000)).sum() / W), 3)
    o["gare_LR_2km"] = round(float((w * (df["d_gare_la_rochelle"] <= 2000)).sum() / W), 3)
    o["gare_LR_3km"] = round(float((w * (df["d_gare_la_rochelle"] <= 3000)).sum() / W), 3)
    o["gare_quelconque_2km"] = round(float((w * (df["d_gare"] <= 2000)).sum() / W), 3)
    o["bus_ge4_par_h_7_9h"] = round(float((w * (df["bus_7_9h"] >= 4)).sum() / W), 3)
    o["bus_ge8_par_h_7_9h"] = round(float((w * (df["bus_7_9h"] >= 8)).sum() / W), 3)
    o["bus_ge12_par_h_7_9h"] = round(float((w * (df["bus_7_9h"] >= 12)).sum() / W), 3)
    o["aucun_bus_7_9h"] = round(float((w * (df["bus_7_9h"] == 0)).sum() / W), 3)
    o["bus_ge4_par_h_20_22h"] = round(float((w * (df["bus_20_21h"] >= 4)).sum() / W), 3)
    # Panier « quotidien à pied » : commerce alimentaire ET pharmacie ET école élémentaire à 500 m
    ok = (df["d_commerce_alim"] <= 500) & (df["d_pharmacie"] <= 500) & (df["d_ecole_elementaire"] <= 500)
    o["panier_quotidien_500m"] = round(float((w * ok).sum() / W), 3)
    ok2 = ok & (df["bus_7_9h"] >= 8)
    o["panier_500m_et_bus8"] = round(float((w * ok2).sum() / W), 3)
    return o

res = {"communes": {}, "iris": {}}
for c, nom in COMS.items():
    res["communes"][nom] = summary(ban[ban["code_insee"] == c])
for i, sub in ban[ban["IRIS"].notna()].groupby("IRIS"):
    if sub["code_insee"].iloc[0] == "17300":
        res["iris"][i] = summary(sub)
json.dump(res, open(os.path.join(OUT, "acces_resultats.json"), "w"), ensure_ascii=False, indent=1)
print(pd.DataFrame(res["communes"]).T.to_string())
