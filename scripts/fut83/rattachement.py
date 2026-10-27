"""FUT-83 : rattachement adresse BAN -> bâtiment RNB -> copropriété RNIC, mesuré sur les 990 adresses de FUT-80.

Trois voies, jamais fusionnées en une seule preuve :
  - ADRESSE  : l'adresse BAN du dossier figure parmi les adresses que la copropriété déclare (référence ou
               complémentaires, plages développées), même commune, même numéro, même voie normalisée ;
  - PARCELLE : une parcelle des bâtiments RNB de l'adresse (selon la BDNB) figure parmi les trois références
               cadastrales déclarées ;
  - BDNB     : la table `rel_batiment_groupe_rnc` relie un groupe de bâtiments de l'adresse à la copropriété
               (rapprochement du CSTB, millésime 2026-02a, sur un RNIC antérieur).

Usage : python3 -I scripts/fut83/rattachement.py <rnic.csv> <mesure-fut80.json.gz> <bdnb_rnc.json> > rattachement.json
"""
import collections, gzip, json, sys
sys.path.insert(0, __file__.rsplit("/", 1)[0])
from rnic_index import lire_rnic, construire_index, cle_ban, parcelle_norm  # noqa: E402

def niveau(adr, par, bdnb):
    tous = adr | par | bdnb
    if not tous:
        return "aucun_candidat"
    if len(adr) == 1 and (not par or par == adr) and (not bdnb or bdnb == adr):
        return "confirme" if (par == adr or bdnb == adr) else "adresse_seule"
    if len(adr) > 1:
        return "ambigu_adresse"
    if not adr and len(tous) == 1:
        return "plausible_sans_adresse"
    if len(adr) == 1:
        return "contradictoire"  # l'adresse désigne une copropriété, la parcelle ou la BDNB une autre (aussi)
    return "ambigu_sans_adresse"

def main(rnic, fut80, bdnb_rnc):
    copros = lire_rnic(rnic)
    par_adresse, par_parcelle = construire_index(copros)
    d = json.load(gzip.open(fut80))
    groupe_de = {b["rnb_id"]: b["groupe"] for b in d["bdnb"] if b.get("groupe")}
    liens = collections.defaultdict(set)
    for l in json.load(open(bdnb_rnc))["lignes"]:
        liens[l["batiment_groupe_id"]].add(l["numero_immat"])
    resultats = []
    for ech in ("A", "B"):
        for a in d[ech]:
            cle = cle_ban(a["label"], a["insee"])
            adr = set(par_adresse.get(cle, set())) if cle else set()
            groupes = [groupe_de[i] for i in a["rnb"]["ids"] if i in groupe_de]
            parcelles = {parcelle_norm(p) for g in groupes for p in (g.get("l_parcelle_id") or [])} - {None}
            par = set().union(*(par_parcelle.get(p, set()) for p in parcelles)) if parcelles else set()
            bdnb = set().union(*(liens.get(g["batiment_groupe_id"], set()) for g in groupes)) if groupes else set()
            bdnb_absents = {n for n in bdnb if n not in copros}
            resultats.append({
                "echantillon": ech, "strate": a["strate"], "banId": a["banId"], "label": a["label"],
                "rnb_statut": a["rnb"]["status"], "n_batiments": a["rnb"]["n"], "rnb_ids": a["rnb"]["ids"],
                "groupes_bdnb": len({g["batiment_groupe_id"] for g in groupes}), "parcelles": sorted(parcelles),
                "adresse": sorted(adr), "parcelle": sorted(par), "bdnb": sorted(bdnb),
                "bdnb_hors_rnic_du_jour": sorted(bdnb_absents),
                "niveau": niveau(adr, par, bdnb - bdnb_absents),
                "dpe_appartement_a_l_adresse": any(x.get("grain") == "logement" for x in a.get("dpe", [])),
            })
    synth = {}
    for ech in ("A", "B"):
        rs = [r for r in resultats if r["echantillon"] == ech]
        synth[ech] = {
            "adresses": len(rs),
            "niveaux": dict(collections.Counter(r["niveau"] for r in rs)),
            "au_moins_un_candidat": {v: sum(1 for r in rs if r[v]) for v in ("adresse", "parcelle", "bdnb")},
            "plusieurs_candidats": {v: sum(1 for r in rs if len(r[v]) > 1) for v in ("adresse", "parcelle", "bdnb")},
            "accord_adresse_bdnb": dict(collections.Counter(
                "identiques" if set(r["adresse"]) == set(r["bdnb"]) else "intersectent" if set(r["adresse"]) & set(r["bdnb"]) else "disjoints"
                for r in rs if r["adresse"] and r["bdnb"])),
            "accord_adresse_parcelle": dict(collections.Counter(
                "identiques" if set(r["adresse"]) == set(r["parcelle"]) else "intersectent" if set(r["adresse"]) & set(r["parcelle"]) else "disjoints"
                for r in rs if r["adresse"] and r["parcelle"])),
            "par_statut_rnb": {s: dict(collections.Counter(r["niveau"] for r in rs if r["rnb_statut"] == s and r["n_batiments"] == n))
                               for s, n in (("trouve", 1),)},
            "rnb_plusieurs_batiments": dict(collections.Counter(r["niveau"] for r in rs if r["n_batiments"] > 1)),
            "rnb_aucun": dict(collections.Counter(r["niveau"] for r in rs if r["n_batiments"] == 0)),
            "bdnb_numero_absent_du_rnic_du_jour": sum(len(r["bdnb_hors_rnic_du_jour"]) for r in rs),
        }
    json.dump({"synthese": synth, "adresses": resultats}, sys.stdout, ensure_ascii=False, indent=1)

if __name__ == "__main__":
    main(*sys.argv[1:4])
