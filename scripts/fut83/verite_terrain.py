"""FUT-83 : le rattachement par l'adresse, confronté au numéro de copropriété que le diagnostiqueur (DPE) ou
l'auditeur (audit énergétique) a saisi. Ce numéro n'est pas infaillible (faute de frappe, copropriété voisine),
il est seulement INDÉPENDANT de la BAN et du registre : on mesure l'accord, pas une exactitude absolue.

Usage : python3 -I scripts/fut83/verite_terrain.py <rnic.csv> <dpe_copro.json> > verite_terrain.json
"""
import collections, json, re, sys
sys.path.insert(0, __file__.rsplit("/", 1)[0])
from rnic_index import lire_rnic, construire_index, cle_ban  # noqa: E402

FORMAT = re.compile(r"^A[A-J]\d{7}$")

def evaluer(numero, label, insee, copros, par_adresse):
    numero = (numero or "").strip().upper()
    if not FORMAT.match(numero):
        return "numero_mal_forme", []
    connu = numero in copros
    cle = cle_ban(label or "", insee or "")
    cands = sorted(par_adresse.get(cle, set())) if cle else []
    if not connu:
        return ("numero_inconnu_du_registre" if not cands else "numero_inconnu_adresse_donne_autre"), cands
    if not cands:
        return "adresse_ne_donne_rien", cands
    if cands == [numero]:
        return "adresse_donne_le_bon_seul", cands
    if numero in cands:
        return "adresse_donne_plusieurs_dont_le_bon", cands
    return "adresse_donne_un_autre", cands

def main(rnic, chemin):
    copros = lire_rnic(rnic)
    par_adresse, _ = construire_index(copros)
    d = json.load(open(chemin))
    sortie = {}
    for jeu, champ_num, cle_id in (("dpe", "numero_immatriculation_copropriete", "numero_dpe"), ("audits", "n_immatriculation_copro", "n_audit")):
        lignes = [l for l in d[jeu] if "erreur" not in l]
        detail, par_copro = [], {}
        for l in lignes:
            label = l.get("adresse_ban") or ""
            verdict, cands = evaluer(l.get(champ_num), label, l.get("code_insee_ban"), copros, par_adresse)
            r = copros.get((l.get(champ_num) or "").strip().upper())
            detail.append({"id": l[cle_id], "type": l.get("type_batiment"), "adresse_ban": label, "numero": l.get(champ_num),
                           "verdict": verdict, "candidats": cands,
                           "commune_registre": r["commune"] if r else None, "commune_ban": l.get("code_insee_ban"),
                           "adresse_registre": r["adresse_reference"] if r else None})
            par_copro.setdefault((l.get(champ_num), l.get("identifiant_ban")), verdict)
        sortie[jeu] = {
            "lignes": len(lignes),
            "verdicts": dict(collections.Counter(x["verdict"] for x in detail)),
            "verdicts_un_par_couple_copro_adresse": dict(collections.Counter(par_copro.values())),
            "commune_differente": sum(1 for x in detail if x["commune_registre"] and x["commune_registre"] != x["commune_ban"]),
            "detail": detail,
        }
    json.dump(sortie, sys.stdout, ensure_ascii=False, indent=1)

if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
