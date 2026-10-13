#!/usr/bin/env python3
"""07_carburants.py — Prix à la pompe : médiane hebdomadaire, France et stations à moins de 12 km du centre de
La Rochelle, gazole et SP95-E10, 2025 → 13/10/2026.

Source : flux officiel prix-carburants.gouv.fr (donnees.roulez-eco.fr/opendata/annee/2025, /annee/2026,
/instantane), téléchargé le 13/10/2026 10:25 UTC. Chaque enregistrement <prix> est une MISE À JOUR déclarée
par une station (date maj). Méthode : pour chaque (station, carburant, semaine ISO), on garde le DERNIER prix
déclaré dans la semaine ; puis médiane entre stations. Une station qui ne déclare rien une semaine n'y compte
pas (pas de report). Coordonnées du flux en degrés × 100 000 (WGS84).
Usage : python 07_carburants.py <dossier carbu> <resultats>"""
import sys, os, math, json
import xml.etree.ElementTree as ET
import pandas as pd
D, OUT = sys.argv[1], sys.argv[2]
LR = (46.1590, -1.1520)
FUELS = {"Gazole", "E10", "SP95"}
def hv(a, b, c, d):
    p = math.radians; R = 6371
    x = math.sin(p(c - a) / 2) ** 2 + math.cos(p(a)) * math.cos(p(c)) * math.sin(p(d - b) / 2) ** 2
    return 2 * R * math.asin(math.sqrt(x))
rows = []
for f in ["x_annee_2025/PrixCarburants_annuel_2025.xml", "x_annee_2026/PrixCarburants_annuel_2026.xml"]:
    for ev, el in ET.iterparse(os.path.join(D, f), events=("end",)):
        if el.tag != "pdv":
            continue
        try:
            la = float(el.get("latitude")) / 1e5; lo = float(el.get("longitude")) / 1e5
        except (TypeError, ValueError):
            la = lo = None
        near = la is not None and hv(LR[0], LR[1], la, lo) <= 12
        pid = el.get("id")
        for p in el.findall("prix"):
            n = p.get("nom")
            if n in FUELS and p.get("valeur"):
                v = float(p.get("valeur"))
                if v > 10:  # anciens formats en millièmes d'euro
                    v = v / 1000
                rows.append((pid, n, p.get("maj")[:19], v, near, el.get("cp")))
        el.clear()
df = pd.DataFrame(rows, columns=["pdv", "carburant", "maj", "prix", "pres_LR", "cp"])
df["maj"] = pd.to_datetime(df["maj"], errors="coerce")
df = df.dropna(subset=["maj"])
df = df[(df.prix > 0.8) & (df.prix < 4)]
df["semaine"] = df["maj"].dt.to_period("W-SUN").dt.start_time
last = df.sort_values("maj").groupby(["pdv", "carburant", "semaine"]).tail(1)
nat = last.groupby(["carburant", "semaine"])["prix"].agg(["median", "count"]).reset_index()
loc = last[last.pres_LR].groupby(["carburant", "semaine"])["prix"].agg(["median", "min", "max", "count"]).reset_index()
nat.to_csv(os.path.join(OUT, "carburants_hebdo_france.csv"), index=False)
loc.to_csv(os.path.join(OUT, "carburants_hebdo_la_rochelle_12km.csv"), index=False)
# Instantané : stations à 12 km, dernier prix et son âge
inst = []
for ev, el in ET.iterparse(os.path.join(D, "x_instantane/PrixCarburants_instantane.xml"), events=("end",)):
    if el.tag != "pdv":
        continue
    try:
        la = float(el.get("latitude")) / 1e5; lo = float(el.get("longitude")) / 1e5
    except (TypeError, ValueError):
        el.clear(); continue
    if hv(LR[0], LR[1], la, lo) <= 12:
        for p in el.findall("prix"):
            if p.get("nom") in FUELS:
                inst.append({"pdv": el.get("id"), "ville": (el.findtext("ville") or "").strip(), "adresse": (el.findtext("adresse") or "").strip(),
                             "carburant": p.get("nom"), "prix": float(p.get("valeur")), "maj": p.get("maj")})
        rup = [r.get("nom") for r in el.findall("rupture")]
        if rup:
            inst.append({"pdv": el.get("id"), "ville": (el.findtext("ville") or "").strip(), "carburant": "RUPTURE:" + ",".join(rup)})
    el.clear()
pd.DataFrame(inst).to_csv(os.path.join(OUT, "carburants_instantane_LR_12km.csv"), index=False)
for c in ["Gazole", "E10"]:
    print("==", c)
    a = nat[nat.carburant == c].set_index("semaine")["median"]
    b = loc[loc.carburant == c].set_index("semaine")[["median", "count"]]
    m = pd.concat([a.rename("france"), b], axis=1)
    print(m.iloc[::4].round(3).to_string())
    print(m.tail(6).round(3).to_string())
