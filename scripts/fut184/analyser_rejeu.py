"""FUT-184 · Compare les textes Territoire rendus avant (main) et après (branche), commune par commune.

Usage : python3 -I scripts/fut184/analyser_rejeu.py <avant.jsonl> <apres.jsonl>
  (sorties de rejouer_textes.mts). Rien n'est écrit : tout est imprimé, dans l'ordre du rapport.
"""
import json, re, sys
from collections import Counter

AVANT = {d["insee"]: d for d in map(json.loads, open(sys.argv[1], encoding="utf-8"))}
APRES = {d["insee"]: d for d in map(json.loads, open(sys.argv[2], encoding="utf-8"))}
assert AVANT.keys() == APRES.keys(), "les deux rejeux n'ont pas les mêmes communes"

RURALES = {"Bourg rural", "Commune rurale de faible densité", "Commune rurale de très faible densité"}
ORDRE = ["Grand centre urbain", "Centre urbain intermédiaire", "Petite ville — classification Insee", "Ceinture urbaine",
         "Bourg rural", "Commune rurale de faible densité", "Commune rurale de très faible densité"]


def titre(t):
    print(f"\n################ {t}")


def classe(d):
    g = d.get("projection_grille")
    return g["categorie"] if g else None


communes = [k for k, d in APRES.items() if not d["arrondissement"] and not d.get("ville_plm")]
arrondissements = [k for k, d in APRES.items() if d["arrondissement"]]
villes = [k for k, d in APRES.items() if d.get("ville_plm")]

titre("1. Couverture de la grille dans le registre")
print(f"entrées : {len(APRES)} = {len(communes)} communes + {len(arrondissements)} arrondissements + {len(villes)} villes PLM")
print("communes sans classe :", sum(1 for k in communes if not classe(APRES[k])))
print("arrondissements à l'échelle de leur ville :", sum(1 for k in arrondissements if (APRES[k]["projection_grille"] or {}).get("echelle", "").startswith("commune entière de ")), "/", len(arrondissements))
print("villes PLM :", {APRES[k]["nom"]: classe(APRES[k]) for k in villes})
dist = Counter(classe(APRES[k]) for k in communes)
for c in ORDRE:
    print(f"  {c:40s} {dist[c]:6d}")
print("registre :", Counter(d["registre"] for d in APRES.values()), "| avant :", Counter(d["registre"] for d in AVANT.values()))
print("règle de la catégorie après :", Counter(d["regle"] for d in APRES.values()))
print("empreintes changées :", sum(1 for k in APRES if APRES[k]["hash"] != AVANT[k]["hash"]), "/", len(APRES))

titre("2. Ancienne catégorie (palier de densité moyenne) × classe de la grille, communes")
tab = Counter((AVANT[k]["categorie"], classe(APRES[k])) for k in communes)
anciennes = ["Commune dense", "Densité intermédiaire", "Commune peu dense", None]
print(f"{'':40s}" + "".join(f"{str(a):>24s}" for a in anciennes))
for c in ORDRE:
    print(f"{c:40s}" + "".join(f"{tab[(a, c)]:24d}" for a in anciennes))
print("arrondissements, avant :", Counter(AVANT[k]["categorie"] for k in arrondissements), "→ après :", Counter(APRES[k]["categorie"] for k in arrondissements))

titre("3. Ce qui change à l'écran (carte d'identité, résumé, ligne « Rôle », phrase déterministe)")
for champ in ["resume", "role", "bloc1"]:
    print(f"{champ:8s} changé : {sum(1 for k in APRES if APRES[k][champ] != AVANT[k][champ]):6d} / {len(APRES)}")
ville_av = {k for k in APRES if (AVANT[k]["resume"] or "").startswith("Ville")}
ville_ap = {k for k in APRES if (APRES[k]["resume"] or "").startswith("Ville")}
print(f"résumé « Ville… » : avant {len(ville_av)}, après {len(ville_ap)} ; perdu {len(ville_av - ville_ap)}, gagné {len(ville_ap - ville_av)}")
dense_av = sum(1 for k in APRES if re.match(r"^(Ville|Commune|Arrondissement) dense", AVANT[k]["resume"] or ""))
print(f"résumé « … dense … » (palier 1 500 hab/km²) : avant {dense_av}, après {sum(1 for k in APRES if ' dense ' in (APRES[k]['resume'] or ''))}")
vc_av = {k for k in APRES if (AVANT[k]["role"] or "").startswith("Ville-centre")}
vc_ap = {k for k in APRES if (APRES[k]["role"] or "").startswith("Ville-centre")}
print(f"ligne « Ville-centre de… » : avant {len(vc_av)}, après {len(vc_ap)} (devenues « Commune-centre » : {len(vc_av - vc_ap)})")
TETE = re.compile(r"^(Ville|Commune|Arrondissement)( dense)?")
print("changement du résumé autre que « Ville » → « Commune » et le retrait de « dense » :",
      sum(1 for k in APRES if TETE.sub("X", AVANT[k]["resume"] or "") != TETE.sub("X", APRES[k]["resume"] or "")))

titre("4. Cohabitation « ville » (FUT-176) × grille rurale : les 1 374")
coh = [k for k in communes if AVANT[k]["resume"].startswith("Ville") and classe(APRES[k]) in RURALES]
print("communes « Ville » avant ET classées rurales :", len(coh))


def tranche(p):
    return "2 000-4 999" if p < 5000 else "5 000-9 999" if p < 10000 else "10 000-19 999" if p < 20000 else "20 000 ou plus"


motifs = Counter((classe(APRES[k]), APRES[k]["uu_statut"], tranche(APRES[k]["population"])) for k in coh)
for (c, st, t), n in sorted(motifs.items(), key=lambda x: (ORDRE.index(x[0][0]), x[0][1], x[0][2])):
    print(f"  {c:38s} statut {st}  {t:14s} {n:5d}")
print("par classe :", Counter(classe(APRES[k]) for k in coh), "| par statut :", Counter(APRES[k]["uu_statut"] for k in coh))
print("après : résumé « Ville » :", sum(1 for k in coh if APRES[k]["resume"].startswith("Ville")),
      "| ligne « Ville-centre » :", sum(1 for k in coh if (APRES[k]["role"] or "").startswith("Ville-centre")),
      "| statut toujours dit (ligne Rôle non vide) :", sum(1 for k in coh if APRES[k]["role"]))
for k in sorted(coh, key=lambda k: -APRES[k]["population"])[:6]:
    print(f"  {APRES[k]['nom']} ({k}) : « {APRES[k]['resume']} » | {APRES[k]['role']} | grille : {APRES[k]['carte_grille']}")

titre("5. Contradictions à l'écran après FUT-184 (attendu : 0 partout)")
def mots_ville(d):
    # Le nom de la commune retiré d'abord : Puget-Ville, Dambach-la-Ville, Ville-sur-Arce ne sont pas des qualificatifs.
    t = (d["bloc1"] or "").replace(d["nom"], "")
    return re.search(r"\b(une|cette|la|petite|grande) ville\b(?!-)|^Ville\b", t, re.I)
print("résumé « Ville » sous une grille rurale :", sum(1 for k in communes if classe(APRES[k]) in RURALES and APRES[k]["resume"].startswith("Ville")))
print("« Ville-centre » sous une grille rurale :", sum(1 for k in communes if classe(APRES[k]) in RURALES and (APRES[k]["role"] or "").startswith("Ville-centre")))
print("phrase déterministe disant « ville » sous une grille rurale :", sum(1 for k in communes if classe(APRES[k]) in RURALES and mots_ville(APRES[k])))
print("ancien palier encore écrit (« commune dense », « peu dense », « densité intermédiaire ») :",
      sum(1 for d in APRES.values() if re.search(r"commune (peu )?dense|densité intermédiaire|arrondissement (peu )?dense", " ".join(filter(None, [d["resume"], d["role"], d["bloc1"], d["carte_grille"], d["carte_densite"]])), re.I)))
print("« habitat dispersé » écrit :", sum(1 for d in APRES.values() if re.search(r"dispers", " ".join(filter(None, [d["resume"], d["bloc1"], d["carte_grille"]])), re.I)))
print("arrondissement avec la classe de sa ville sans le nom de la ville :", sum(1 for k in arrondissements if not re.search(r"à l'échelle de (Paris|Lyon|Marseille)$", APRES[k]["carte_grille"] or "")))

titre("6. Synthèse déterministe : contrôles de cohérence (toutes les entrées)")
for nom, D in [("avant", AVANT), ("après", APRES)]:
    v = Counter(r for d in D.values() for r in d["violations"])
    print(f"{nom} : {sum(1 for d in D.values() if d['violations'])} textes refusés ; règles : {dict(v.most_common(8))}")

titre("7. Classe et densité moyenne affichées côte à côte : écarts apparents")
for c, cond, lib in [(RURALES, lambda d: d >= 150, "classée rurale, 150 hab/km² ou plus en moyenne"),
                     ({"Commune rurale de faible densité", "Commune rurale de très faible densité"}, lambda d: d >= 300, "« faible densité » (6-7), 300 hab/km² ou plus"),
                     (set(ORDRE[:4]), lambda d: d < 150, "classée urbaine, moins de 150 hab/km²")]:
    ks = [k for k in communes if classe(APRES[k]) in c and APRES[k]["densite"] is not None and cond(APRES[k]["densite"])]
    ex = ", ".join(f"{APRES[k]['nom']} ({round(APRES[k]['densite'])})" for k in sorted(ks, key=lambda k: -APRES[k]["population"])[:6])
    print(f"{lib} : {len(ks)} ; ex. {ex}")
print("communes sans densité dans l'index (densité ADEME en production) :", sum(1 for k in communes if APRES[k]["densite"] is None))

titre("8. Panel FUT-184 : ce qui est réellement rendu")
PANEL = ["2B096", "13004", "84007", "30189", "68078", "28199", "05082", "44212", "02100", "34301", "29232", "13005",
         "49301", "79049", "22093", "69114", "49126", "22278", "2A247", "42127", "44129", "17094", "75056", "69123", "13055", "75111", "69389", "13209"]
for k in PANEL:
    a, b = AVANT.get(k), APRES.get(k)
    if not b:
        print(f"{k} : absent de l'index"); continue
    print(f"\n{b['nom']} ({k}) · {b['population']} hab. · statut UU {b['uu_statut']}")
    print(f"  avant  catégorie : {a['categorie']} | résumé : {a['resume']} | rôle : {a['role']}")
    print(f"  après  grille    : {b['carte_grille']} | densité : {b['carte_densite']}")
    print(f"         résumé    : {b['resume']} | rôle : {b['role']}")
    print(f"         phrase    : {b['bloc1']}")
    if b["violations"]:
        print(f"         CONTRÔLES : {b['violations']}")
