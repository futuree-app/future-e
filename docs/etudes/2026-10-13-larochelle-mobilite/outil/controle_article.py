#!/usr/bin/env python3
"""controle_article.py — Contrôle déterministe d'un rendu de rédaction (sections A à D) contre son dossier.json.

Ne juge ni le style ni le raisonnement (c'est la relecture). Vérifie mécaniquement :
  1. chaque identifiant de la correspondance (section C) existe dans le dossier ;
  2. aucun identifiant d'usage `non` (en attente de validation, absent) n'est cité ;
  3. le chiffre écrit correspond à la valeur affichée du dossier pour au moins un des identifiants de la ligne
     (tolérance : arrondi à l'unité) ;
  4. chaque pourcentage et chaque montant en euros du corps de l'article (section B, hors méthode) figure dans la colonne
     « Chiffre écrit » de la correspondance ;
  5. aux bornes, « 100 % » ou « 0 % » ne s'écrivent que pour une valeur exacte (le dossier affiche 99,8 % sinon) ;
  6. la section B existe ; ou bien la sortie est une recommandation de ne pas publier.

    python outil/controle_article.py --dossier lots/<lot>/<insee>/dossier/dossier.json --sortie <rendu.md> [--json anomalies.json]

Code de sortie 0 : aucune anomalie bloquante. 1 : anomalies (liste en JSON).
"""
import argparse, json, re, sys

NUM = re.compile(r"(\d+(?:[   ]\d{3})*(?:,\d+)?)")


def norm(s):
    return s.replace(" ", " ").replace(" ", " ").replace("‑", "-")


def nombres(s):
    return [float(n.replace(" ", "").replace(" ", "").replace(" ", "").replace(",", ".")) for n in NUM.findall(norm(s))]


def index_dossier(d):
    """identifiant → (valeurs numériques affichées, usage)."""
    I = {}
    def pct(v):
        return None if v is None or v != v else round(v * 100, 1)
    for f in d.get("faits", []):
        I[f["id"]] = (nombres(f.get("affichage", "")) if f.get("statut") != "en attente de validation" else [], f.get("usage", "non"))
    for s in d.get("secteurs", []):
        for col, key in [("actifs", "actifs"), ("voiture", "voiture"), ("velo", "velo"), ("tc", "tc"), ("marche", "marche"),
                         ("menages_sans_voiture", "menages_sans_voiture"), ("stationnement_reserve", "menages_stationnement_reserve"),
                         ("panier_500m", "panier_quotidien_500m")]:
            v = s.get(key)
            I[f"iris.{s['code']}.{col}"] = ([v] if col == "actifs" else [pct(v)]) if v is not None else [], s.get("usage", "non")
    for r in d.get("destinations", []):
        for col in ["part_des_actifs", "voiture", "velo", "tc", "marche"]:
            I[f"destination.{r['travail']}.{col}"] = [pct(r.get(col))], "oui" if r.get("lignes", 0) >= 150 else ("ordre de grandeur" if r.get("lignes", 0) >= 40 else "non")
    for r in d.get("voisines", []):
        for col in ["voiture", "velo", "tc"]:
            I[f"voisine.{r['insee']}.{col}"] = [pct(r.get(col))], "oui"
        w = (r.get("vers_commune_etudiee") or {}).get("voiture") or {}
        I[f"voisine.{r['insee']}.voiture_vers_commune"] = [pct(w.get("p"))], "oui"
    for c, v in (d.get("acces_communes") or {}).items():
        for col, x in (v or {}).items():
            I.setdefault(f"acces.{c}.{col}", ([pct(x)], "non" if col.startswith(("bus_", "aucun_bus")) else "oui"))
    for r in (d.get("scenario_carburant") or {}).get("lignes", []):
        I[r["id"]] = [r["surcout_an_eur"], r["km_aller"], r["hausse_retenue_eur_l"]], "oui"
    for f in ((d.get("complement_documentaire") or {}).get("faits") or []):
        I[f["id"]] = nombres(f["information"] + " " + f.get("validite", "")), f["usage"]
    for f in ((d.get("comparaison") or {}).get("faits") or []):
        I[f["id"]] = nombres(f["affichage"]), f["usage"]
    return I


def sections(txt):
    S, cur = {}, None
    for l in txt.split("\n"):
        m = re.match(r"^##\s+([A-D])\.", l)
        if m:
            cur = m.group(1); S[cur] = []; continue
        if cur:
            S[cur].append(l)
    return {k: "\n".join(v) for k, v in S.items()}


def controler(d, txt):
    I = index_dossier(d)
    noms_secteurs = [norm(s["nom"]) for s in d.get("secteurs", []) if re.search(r"\d", s.get("nom", ""))]
    A = []
    S = sections(txt)
    if "B" not in S:
        if re.search(r"ne pas publier|non-publication|pas d'article", txt, re.I):
            return [], "non_publication"
        return [{"type": "structure", "gravite": "bloquante", "detail": "section B (article) absente"}], "structure"
    corps = S["B"].split("### Méthode")[0].split("### Methode")[0]
    lignes_c = [l for l in S.get("C", "").split("\n") if l.startswith("|") and "---" not in l]
    ecrits = []
    for l in lignes_c[1:]:
        cells = [c.strip() for c in l.strip().strip("|").split("|")]
        if len(cells) < 3:
            continue
        passage, chiffre, ids = cells[0], cells[1], cells[2]
        ecrits.append(chiffre)
        # Identifiants entre accents graves, ou écrits nus (« iris.490070107.voiture ») : les deux formes sont reconnues.
        codes = re.findall(r"`([^`]+)`", ids) or re.findall(
            r"\b(?:mobpro|iris|acces|carburant|scenario|ecart|destination|voisine|doc|comparaison)\.[\w./-]*[\w/]", ids)
        definition = re.match(r"m[ée]thode|sources?", passage, re.I)  # périmètres, seuils et dates de la méthode : pas des valeurs
        if not codes:
            if re.search(r"\d", chiffre) and not definition and not re.search(r"capacit|hypoth|définition|millésime|limite|source|population|périmètre|date|méthode", ids, re.I):
                A.append({"type": "identifiant_absent", "gravite": "bloquante", "passage": passage, "detail": f"« {chiffre} » sans identifiant"})
            continue
        vals = []
        dev = []
        for c in codes:
            c0 = c.split(" ")[0]
            if "/" in c0:  # « iris.voiture.min/max » : deux identifiants abrégés
                base, _, fin = c0.rpartition(".")
                dev += [f"{base}.{x}" for x in fin.split("/")]
            else:
                dev.append(c0)
        for c0 in dev:
            if "<" in c0 or "*" in c0:
                continue  # motif générique (définition), pas une valeur
            if c0 not in I:
                A.append({"type": "identifiant_inconnu", "gravite": "bloquante", "passage": passage, "detail": f"`{c0}` absent du dossier"})
                continue
            v, usage = I[c0]
            if usage == "non":
                A.append({"type": "usage_interdit", "gravite": "bloquante", "passage": passage, "detail": f"`{c0}` a l'usage « non »"})
            vals += [x for x in v if x is not None]
        # Distances de définition (« 500 m », « rayon de 12 km ») : pas des valeurs, sauf pour le scénario carburant.
        ch = chiffre if any(c.startswith("scenario.") for c in dev) else re.sub(r"\d+(?:,\d+)?\s?(km|m|mètres|kilomètres|L/100)\b", "", norm(chiffre))
        # Dates (« semaine du 6 octobre 2025 ») : des repères de période, pas des valeurs.
        ch = re.sub(r"\d{1,2}(?:er)?\s+(?:janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)(?:\s+\d{4})?|\d{1,2}/\d{1,2}/\d{2,4}", "", ch, flags=re.I)
        # Noms de secteurs (« Amiens Nord 3 », « Pau Centre 2 ») : leur numéro n'est pas une valeur (lot 03, 15/10/2026).
        for nom in sorted(noms_secteurs, key=len, reverse=True):
            ch = ch.replace(nom, "")
        if re.search(r"dans le libell", ch, re.I):
            ch = ""
        n = [x for x in nombres(ch) if not (1900 < x < 2100)]
        if re.search(r"centimes?", ch):  # « 75 centimes » = 0,75 €
            n += [x / 100 for x in n]
        # Aux bornes, l'égalité doit être exacte : « 100 % » pour une valeur affichée 99,8 % est une erreur.
        ok = lambda x, y: (x == y) if x in (0, 100) and "%" in chiffre else (abs(x - y) <= 0.6 or abs(x - round(y)) < 0.01)
        if n and vals and not definition and not any(ok(x, y) for x in n for y in vals):
            A.append({"type": "valeur", "gravite": "bloquante", "passage": passage,
                      "detail": f"« {chiffre} » ne correspond à aucune valeur du dossier pour {', '.join(codes)} ({', '.join(str(v) for v in vals[:6])})"})
    tous_ecrits = " ".join(norm(e) for e in ecrits)
    for m in re.finditer(r"(\d+(?:,\d+)?)\s?%", norm(corps)):
        if m.group(1) not in tous_ecrits:
            A.append({"type": "chiffre_sans_correspondance", "gravite": "bloquante", "detail": f"« {m.group(0)} » du corps absent de la correspondance"})
    for m in re.finditer(r"(\d+)\s?€", norm(corps)):
        if m.group(1) not in tous_ecrits:
            A.append({"type": "chiffre_sans_correspondance", "gravite": "bloquante", "detail": f"« {m.group(0)} » du corps absent de la correspondance"})
    return A, "ok"


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--dossier", required=True); p.add_argument("--sortie", required=True); p.add_argument("--json")
    a = p.parse_args()
    A, nature = controler(json.load(open(a.dossier)), open(a.sortie).read())
    res = {"nature": nature, "anomalies": A, "bloquantes": sum(1 for x in A if x["gravite"] == "bloquante")}
    if a.json:
        json.dump(res, open(a.json, "w"), ensure_ascii=False, indent=1)
    print(json.dumps(res, ensure_ascii=False, indent=1))
    sys.exit(1 if res["bloquantes"] else 0)


if __name__ == "__main__":
    main()
