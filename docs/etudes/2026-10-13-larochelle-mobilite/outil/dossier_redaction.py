#!/usr/bin/env python3
"""dossier_redaction.py — Adaptateur léger : fiche factuelle (fiche_mobilite.py) → dossier d'entrée de rédaction.

Ne calcule AUCUNE donnée nouvelle. Il relit `fiche.json` et :
  1. éclate chaque fait composite en faits atomiques à identifiant stable (`mobpro.modes.voiture`…), avec valeur, unité,
     population, dénominateur, périmètre géographique EXACT (listes de communes nommées), source, millésime, limites,
     un statut (utilisable / fragile / en attente de validation / absent, règles ci-dessous, appliquées mécaniquement)
     et la permission d'usage qui en découle (USAGE) ;
  2. pré-calcule les seules opérations dont l'IA de rédaction aurait besoin (écarts en points, scénario de carburant à
     hypothèses fixes), pour qu'il n'ait jamais à calculer ;
  3. liste les faits ABSENTS de la fiche (pour qu'ils ne soient pas reconstitués de mémoire) ;
  4. joint les paramètres éditoriaux (`redaction/parametres_editoriaux.md`) et la voix (section 2 de NOTE_EDITORIALE.md) ;
  5. joint, s'il existe, le complément documentaire de la commune (`<out>/complement.json`, informations publiées par
     des sources officielles, datées, NON calculées ; format et procédure : redaction/COMPLEMENT_DOCUMENTAIRE.md).
     Le format est contrôlé : un fait sans source, date, périmètre ou usage valide arrête la génération.

Statut :
  - MOBPRO : ≥ 150 lignes d'échantillon → utilisable ; 40 à 149 → fragile ; < 40 → absent (masqué). Seuils de la fiche.
  - IRIS : secteur d'habitat ≥ 300 actifs → utilisable ; < 300 → fragile ; secteur d'activité → exclu (absent).
  - Bus (GTFS) : en attente de validation tant que la vérification humaine du réseau et du jour de référence n'est pas
    faite. Ce n'est pas une faible précision : le fait ne s'écrit pas, même arrondi (valeur gardée dans le JSON seulement).
  - Carburant : ≥ 8 stations → utilisable, à réextraire avant publication.
  « fragile » = faible précision statistique → usage « ordre de grandeur » ; « en attente » et « absent » → usage « non ».

Accès aux équipements : parts d'ADRESSES BAN (distances à vol d'oiseau). Dans un secteur, chaque adresse compte pareil ;
à la commune, chaque adresse pèse ménages de son IRIS / adresses de son IRIS (calcul de fiche_mobilite.py), si bien que
chaque secteur compte selon son nombre de ménages. Ce n'est pas une part de ménages mesurée.

    python outil/dossier_redaction.py --fiche fiches/79191/fiche.json --out redaction/79191 \
        --origine-voisines "automatique : communes de la même unité urbaine, au plus les 6 plus peuplées"

Le complément entre dans la section « 2 bis » ; ses informations écartées rejoignent les faits absents (section 8).

Sorties : dossier.md (à donner seul à l'IA de rédaction) et dossier.json (mêmes faits, pour un contrôle machine).
"""
import argparse, datetime as dt, hashlib, json, os, re
from decimal import Decimal, ROUND_HALF_UP

ICI = os.path.dirname(os.path.abspath(__file__))
ETUDE = os.path.dirname(ICI)
MODES = {"voiture": "en voiture", "velo": "à vélo", "tc": "en transports en commun", "marche": "à pied",
         "deux_roues_mot": "en deux-roues motorisé", "pas_de_transport": "sans déplacement (travail à domicile)"}
ACCES = {"commerce_alim_500m": "un commerce alimentaire à moins de 500 m", "grande_surface_500m": "une grande surface à moins de 500 m",
         "pharmacie_500m": "une pharmacie à moins de 500 m", "medecin_generaliste_500m": "un médecin généraliste à moins de 500 m",
         "ecole_elementaire_500m": "une école élémentaire à moins de 500 m", "college_1km": "un collège à moins de 1 km",
         "gare_2km": "une gare à moins de 2 km",
         "panier_quotidien_500m": "à la fois un commerce alimentaire, une pharmacie et une école élémentaire à moins de 500 m",
         "bus_8h_7_9h": "au moins 8 passages de bus par heure entre 7 h et 9 h à moins de 400 m",
         "aucun_bus_7_9h": "aucun passage de bus entre 7 h et 9 h à moins de 400 m",
         "bus_4h_20_22h": "au moins 4 passages de bus par heure entre 20 h et 22 h à moins de 400 m"}
USAGE = {"utilisable": "oui", "fragile": "ordre de grandeur", "en attente de validation": "non", "absent": "non"}
STATUT_OCC = {"proprietaires": "propriétaires", "locataires_prive": "locataires du privé", "locataires_hlm": "locataires HLM"}
# Limites de la fiche reformulées pour la rédaction (texte seulement, valeurs inchangées).
LIMITES_REVUES = {"Exploitation complémentaire : précision de quelques points par IRIS ; ne commenter que des écarts > 10 points.":
                  "Exploitation complémentaire, estimations par sondage ; les petits écarts entre secteurs ne doivent pas être "
                  "surinterprétés (aucune marge d'erreur par secteur n'est fournie : ne pas en écrire)."}
VOL = " (à vol d'oiseau)"
MOTIF_BUS = "réseau de bus et jour de référence non validés : ne pas écrire, même arrondi"
ADR_COMMUNE = ("toutes les adresses BAN de {nom}, chaque secteur (IRIS) pesant selon son nombre de ménages "
               "(poids d'une adresse = ménages de son IRIS / adresses de son IRIS)")
USAGES_DOC = ("oui", "avec ses conditions", "non")
# Statut d'une RECHERCHE documentaire. Une absence d'information n'est jamais une absence de service.
STATUTS_RECHERCHE = ("vérifié", "non vérifié", "introuvable", "inaccessible", "non recherché")
CHAMPS_DOC = ("id", "information", "source", "consulte_le", "validite", "perimetre", "usage")


def complement(chemin):
    """Relit et contrôle le complément documentaire (format : redaction/COMPLEMENT_DOCUMENTAIRE.md). Ne calcule rien."""
    if not chemin or not os.path.exists(chemin):
        return None
    brut = open(chemin, "rb").read(); c = json.loads(brut)
    erreurs = []
    for i, f in enumerate(c.get("faits", [])):
        manque = [k for k in CHAMPS_DOC if not str(f.get(k, "")).strip()]
        if manque: erreurs.append(f"fait {f.get('id', i)} : champ(s) vide(s) {', '.join(manque)}")
        if not str(f.get("id", "")).startswith("doc."): erreurs.append(f"fait {f.get('id', i)} : l'identifiant doit commencer par « doc. »")
        if f.get("usage") not in USAGES_DOC: erreurs.append(f"fait {f.get('id', i)} : usage « {f.get('usage')} » hors de {USAGES_DOC}")
        if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", str(f.get("consulte_le", ""))): erreurs.append(f"fait {f.get('id', i)} : consulte_le au format AAAA-MM-JJ")
    for r in c.get("recherches", []):
        if r.get("statut") not in STATUTS_RECHERCHE or not r.get("sujet"):
            erreurs.append(f"recherche {r.get('sujet')} : statut « {r.get('statut')} » hors de {STATUTS_RECHERCHE}")
    for f in c.get("faits", []):
        if f.get("statut_verification", "vérifié") != "vérifié":
            erreurs.append(f"fait {f.get('id')} : seul un fait vérifié entre au dossier ; les autres vont dans « recherches »")
    for e in c.get("ecartes", []):
        if not (e.get("sujet") and e.get("raison")): erreurs.append(f"écarté sans sujet ou sans raison : {e}")
    if erreurs:
        raise SystemExit(f"{chemin} : complément documentaire invalide\n  " + "\n  ".join(erreurs))
    c["chemin"] = chemin; c["sha256"] = hashlib.sha256(brut).hexdigest()
    return c


# Scénario de carburant : MÊMES hypothèses que l'article pilote (scripts/11_scenarios_carburant.py).
JOURS, CONSO, KMS = 200, 6.0, (5, 15, 35)


def arrondi(x):
    """Arrondi au plus proche, 0,5 vers le haut (round() de Python arrondit au pair : 10,5 → 10)."""
    return int(Decimal(repr(x)).quantize(Decimal("1"), rounding=ROUND_HALF_UP))


def pct(p):
    """Part en %, arrondie à l'unité. Aux bornes, l'arrondi ne doit pas fabriquer « toutes » ou « aucune » : une valeur
    qui s'arrondirait à 0 % ou 100 % sans valoir exactement 0 ou 1 garde une décimale (0,998 → « 99,8 % »). Affichage
    seulement : la valeur du JSON est inchangée."""
    a = arrondi(p * 100)
    if a in (0, 100) and p not in (0, 1):
        return f"{Decimal(repr(p * 100)).quantize(Decimal('0.1'), rounding=ROUND_HALF_UP)} %".replace(".", ",")
    return f"{a} %"


def statut_lignes(lignes):
    if lignes is None:
        return "utilisable", ""
    if lignes < 40:
        return "absent", f"masqué : {lignes} lignes d'échantillon (< 40)"
    if lignes < 150:
        return "fragile", f"{lignes} lignes d'échantillon (< 150) : ordre de grandeur seulement"
    return "utilisable", ""


def liste(d):
    """{insee: nom} → « Chauray (79081), Aiffres (79003) et Bessines (79034) »."""
    items = [f"{n} ({c})" for c, n in d.items()]
    return items[0] if len(items) == 1 else ", ".join(items[:-1]) + " et " + items[-1]


def section_note(titre_re):
    txt = open(os.path.join(ETUDE, "NOTE_EDITORIALE.md")).read()
    m = re.search(rf"^## {titre_re}.*?$(.*?)(?=^## |\Z)", txt, re.S | re.M)
    if not m:
        raise SystemExit(f"NOTE_EDITORIALE.md : section « {titre_re} » introuvable")
    return m.group(1).strip()


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--fiche", required=True); p.add_argument("--out", required=True)
    p.add_argument("--origine-voisines", default="non enregistrée dans la fiche : à préciser avant rédaction",
                   help="comment la liste des voisines a été choisie (la fiche ne le dit pas)")
    p.add_argument("--complement", help="complément documentaire (défaut : <out>/complement.json s'il existe)")
    p.add_argument("--comparaison", help="repère de comparaison (défaut : comparaison_voiture.json à côté de la fiche, s'il existe)")
    a = p.parse_args()
    brut = open(a.fiche, "rb").read(); fiche = json.loads(brut)
    C = fiche["commune"]; nom, insee = C["nom"], C["insee"]
    F = {f["id"]: f for f in fiche["faits"]}
    T = fiche["tableaux"]
    vois = C.get("voisines") or {}
    commune = f"{nom} ({insee})"
    faits, absents = [], []

    def ajoute(id, fait, valeur, unite, population, denominateur, perimetre, parent, statut="utilisable", motif="",
               intervalle=None, limites_propres=()):
        f = F[parent]
        if isinstance(valeur, float) and unite == "part":
            aff = pct(valeur)
        elif unite == "nombre":
            aff = f"environ {arrondi(valeur / 100) * 100:,.0f}".replace(",", " ")
        elif unite == "€/L":
            aff = f"{valeur:.2f} €/L".replace(".", ",")
        elif unite == "points":
            aff = f"{valeur:+d} points"
        else:
            aff = str(valeur)
        faits.append({"id": id, "fait": fait, "valeur": valeur, "unite": unite, "affichage": aff, "intervalle_95": intervalle,
                      "population": population, "denominateur": denominateur, "perimetre": perimetre,
                      "source": f["source"], "millesime": f["millesime"], "statut": statut, "motif_statut": motif,
                      "usage": USAGE[statut],
                      "limites": list(limites_propres) + [LIMITES_REVUES.get(l, l) for l in f["limites"]], "fait_de_la_fiche": parent})

    actifs_res = f"actifs occupés de 15 ans ou plus résidant à {nom}"
    # ── MOBPRO ───────────────────────────────────────────────────────────────────────────────
    if "mobpro.modes" in F:
        for k, v in F["mobpro.modes"]["valeur"].items():
            s, m = statut_lignes(v["lignes"])
            libelle = ("Part des actifs qui ne se déplacent pas pour travailler (travail à domicile)" if k == "pas_de_transport"
                       else f"Part des actifs qui vont travailler principalement {MODES[k]}")
            ajoute(f"mobpro.modes.{k}", libelle, v["p"], "part",
                   actifs_res, f"tous les {actifs_res}, y compris ceux qui ne se déplacent pas", f"commune de résidence : {commune}",
                   "mobpro.modes", s, m, [v["bas"], v["haut"]])
    if "mobpro.travaille_dans_commune" in F:
        v = F["mobpro.travaille_dans_commune"]["valeur"]; s, m = statut_lignes(v["lignes"])
        ajoute("mobpro.travaille_dans_commune", f"Part des actifs résidents qui travaillent à {nom} même", v["p"], "part",
               actifs_res, f"tous les {actifs_res}", f"commune de résidence et de travail : {commune}",
               "mobpro.travaille_dans_commune", s, m, [v["bas"], v["haut"]])
    if "mobpro.voiture_selon_destination" in F:
        V = F["mobpro.voiture_selon_destination"]["valeur"]
        groupes = {"meme_commune": (f"qui travaillent à {nom}", f"commune de travail : {commune}")}
        if vois:  # commune seule dans son unité urbaine, ou hors unité urbaine : pas de groupe de voisines
            groupes["communes_voisines"] = (f"qui travaillent dans l'une de ces communes : {liste(vois)}",
                                            f"commune de travail : {liste(vois)} (exactement ; origine de la liste : {a.origine_voisines})")
            groupes["ailleurs"] = (f"qui travaillent hors de {nom} et hors de {liste(vois)}",
                                   f"commune de travail : toute commune autre que {nom}, {liste(vois)}")
        else:
            groupes["ailleurs"] = (f"qui travaillent hors de {nom}", f"commune de travail : toute commune autre que {nom}")
        for k, (qui, perim) in groupes.items():
            if k not in V:
                continue
            v = V[k]; s, m = statut_lignes(v["lignes"])
            ajoute(f"mobpro.voiture_selon_destination.{k}", f"Part allant travailler en voiture, parmi les actifs résidents {qui}",
                   v["p"], "part", f"{actifs_res} {qui}", f"{actifs_res} {qui}", perim, "mobpro.voiture_selon_destination", s, m,
                   [v["bas"], v["haut"]], ["Groupes distincts de personnes : l'écart décrit des pratiques, pas l'effet d'un changement d'emploi."])
        if "meme_commune" in V and "communes_voisines" in V and vois:
            s = "utilisable" if all(statut_lignes(V[g]["lignes"])[0] == "utilisable" for g in ("meme_commune", "communes_voisines")) else "fragile"
            ajoute("ecart.voiture_destination.voisines_moins_meme_commune",
                   f"Écart de part de la voiture : travail dans {liste(vois)} moins travail à {nom}",
                   arrondi(V["communes_voisines"]["p"] * 100) - arrondi(V["meme_commune"]["p"] * 100), "points",
                   actifs_res, "deux groupes distincts (voir les deux faits)", groupes["communes_voisines"][1],
                   "mobpro.voiture_selon_destination", s, "écart des valeurs arrondies")
    if "mobpro.posseder_utiliser" in F:
        V = F["mobpro.posseder_utiliser"]["valeur"]
        lib = {"actifs_menage_sans_voiture": ("Part des actifs dont le ménage n'a pas de voiture", f"tous les {actifs_res}"),
               "actifs_menage_2_voitures_plus": ("Part des actifs dont le ménage a deux voitures ou plus", f"tous les {actifs_res}"),
               "menage_motorise_mais_pas_en_voiture": ("Part des actifs dont le ménage a au moins une voiture et qui ne la déclarent pas comme mode principal pour aller travailler (y compris sans déplacement)",
                                                        f"{actifs_res} dont le ménage a au moins une voiture")}
        for k, (t, d) in lib.items():
            v = V[k]; s, m = statut_lignes(v["lignes"])
            ajoute(f"mobpro.posseder_utiliser.{k}", t, v["p"], "part", actifs_res, d, f"commune de résidence : {commune}",
                   "mobpro.posseder_utiliser", s, m, [v["bas"], v["haut"]], ["Parts d'ACTIFS, pas de ménages."])
    if "mobpro.statut_occupation" in F:
        for g, V in F["mobpro.statut_occupation"]["valeur"].items():
            for k, v in V.items():
                s, m = statut_lignes(v["lignes"])
                t = {"voiture": "vont travailler en voiture", "velo": "vont travailler à vélo",
                     "menage_sans_voiture": "ont un ménage sans voiture", "menage_2_voitures_plus": "ont un ménage à deux voitures ou plus"}[k]
                ajoute(f"mobpro.statut_occupation.{g}.{k}", f"Part des actifs {STATUT_OCC[g]} qui {t}", v["p"], "part",
                       f"{actifs_res}, {STATUT_OCC[g]}", f"{actifs_res}, {STATUT_OCC[g]} de leur logement", f"commune de résidence : {commune}",
                       "mobpro.statut_occupation", s, m, [v["bas"], v["haut"]])
    if "mobpro.qui_vient_travailler" in F:
        V = F["mobpro.qui_vient_travailler"]["valeur"]
        travail = f"actifs occupés qui travaillent à {nom}, quel que soit leur lieu de résidence"
        ajoute("mobpro.qui_vient_travailler.total", f"Nombre d'actifs qui travaillent à {nom}", V["actifs_travaillant_ici"], "nombre",
               travail, "—", f"commune de travail : {commune}", "mobpro.qui_vient_travailler")
        orig = {"habitent_la_commune": f"habitent {nom}",
                "reste_unite_urbaine": f"habitent une autre commune de l'unité urbaine INSEE {C.get('uu')} (liste des communes non exposée par la fiche)",
                "hors_unite_urbaine": f"habitent hors de l'unité urbaine INSEE {C.get('uu')}"}
        for k, qui in orig.items():
            v = V.get(k) or {}
            if not v.get("voiture") and not v.get("part_des_emplois"):
                continue  # unité urbaine d'une seule commune : pas d'« autre commune de l'unité urbaine »
            ajoute(f"mobpro.qui_vient_travailler.{k}.part_des_emplois", f"Part, parmi les actifs qui travaillent à {nom}, de ceux qui {qui}",
                   v["part_des_emplois"], "part", travail, travail, f"commune de travail : {commune}", "mobpro.qui_vient_travailler")
            for mode in ("voiture", "tc"):
                w = v.get(mode)
                if not w:
                    continue
                s, m = statut_lignes(w["lignes"])
                ajoute(f"mobpro.qui_vient_travailler.{k}.{mode}", f"Part allant travailler {MODES[mode]}, parmi les actifs qui travaillent à {nom} et {qui}",
                       w["p"], "part", travail, f"{travail} et qui {qui}", f"commune de travail : {commune}", "mobpro.qui_vient_travailler",
                       s, m, [w["bas"], w["haut"]])
    # ── IRIS ─────────────────────────────────────────────────────────────────────────────────
    secteurs = []
    AI = T.get("acces_iris") or {}
    for r in T.get("iris") or []:
        if r["TYP_IRIS"] != "H":
            secteurs.append({"code": r["IRIS"], "nom": r["nom"], "type": "activité", "statut": "absent", "usage": "non", "motif": "secteur d'activité, exclu"})
            continue
        s = "utilisable" if r["actifs"] >= 300 else "fragile"
        acc = AI.get(r["IRIS"]) or {}
        secteurs.append({"code": r["IRIS"], "nom": r["nom"], "type": "habitat", "statut": s, "usage": USAGE[s],
                         "motif": "" if s == "utilisable" else f"{r['actifs']:.0f} actifs (< 300)",
                         "actifs": round(r["actifs"]), "voiture": r["voiture"], "velo": r["velo"], "tc": r["tc"], "marche": r["marche"],
                         "menages_sans_voiture": r["menages_sans_voiture"], "menages_stationnement_reserve": r["menages_stationnement_reserve"],
                         "panier_quotidien_500m": acc.get("panier_quotidien_500m"),
                         "bus_8h_7_9h": acc.get("bus_8h_7_9h"), "bus_8h_7_9h_statut": "en attente de validation"})
    hab = [x for x in secteurs if x["type"] == "habitat" and x["statut"] == "utilisable"]
    if hab:
        lo, hi = min(hab, key=lambda x: x["voiture"]), max(hab, key=lambda x: x["voiture"])
        perim = f"secteurs statistiques (IRIS) d'habitat de {commune}, au moins 300 actifs"
        ajoute("iris.voiture.min", f"Part de la voiture la plus basse parmi les secteurs : {lo['nom']} (IRIS {lo['code']})", lo["voiture"], "part",
               f"actifs occupés résidant dans le secteur", "actifs occupés de 15 ans ou plus du secteur", perim, "iris.ecart_voiture")
        ajoute("iris.voiture.max", f"Part de la voiture la plus élevée parmi les secteurs : {hi['nom']} (IRIS {hi['code']})", hi["voiture"], "part",
               f"actifs occupés résidant dans le secteur", "actifs occupés de 15 ans ou plus du secteur", perim, "iris.ecart_voiture")
        ajoute("ecart.iris.voiture.max_moins_min", "Écart entre le secteur le plus haut et le plus bas (part de la voiture)",
               arrondi(hi["voiture"] * 100) - arrondi(lo["voiture"] * 100), "points", "actifs occupés", "deux secteurs distincts", perim,
               "iris.ecart_voiture", "utilisable", "écart des valeurs arrondies")
    if "iris.menages_commune" in F:
        lib = {"menages_sans_voiture": "Part des ménages sans voiture", "menages_2_voitures_plus": "Part des ménages à deux voitures ou plus",
               "menages_stationnement_reserve": "Part des ménages disposant d'un emplacement réservé au stationnement"}
        for k, v in F["iris.menages_commune"]["valeur"].items():
            ajoute(f"iris.menages_commune.{k}", lib[k], v, "part", f"ménages (résidences principales) de {nom}",
                   f"toutes les résidences principales de {nom}", f"commune : {commune}", "iris.menages_commune")
    # ── Accès depuis les adresses ─────────────────────────────────────────────────────────────
    if "acces.adresses" in F:
        for k, v in F["acces.adresses"]["valeur"].items():
            bus = k.startswith("bus") or k.startswith("aucun_bus")
            t = (f"Part des adresses de {nom} sans aucun passage de bus entre 7 h et 9 h à moins de 400 m" if k == "aucun_bus_7_9h"
                 else f"Part des adresses de {nom} qui ont {ACCES[k]}{'' if bus else VOL}")
            ajoute(f"acces.{insee}.{k}", t, v, "part",
                   f"adresses BAN de {nom}", ADR_COMMUNE.format(nom=nom),
                   f"adresses de {commune}", "acces.adresses",
                   "en attente de validation" if bus else "utilisable", MOTIF_BUS if bus else "",
                   limites_propres=["Part d'adresses, pas de ménages ni d'habitants.", "Proximité d'un équipement ≠ son usage."])
    # ── Carburant + scénario ──────────────────────────────────────────────────────────────────
    scen = []
    if "carburant.evolution" in F:
        km = re.search(r"([\d,.]+) km", F["carburant.evolution"]["maille"]).group(1)
        rayon = f"stations situées dans un rayon de {km} km (à vol d'oiseau) autour du centre de {nom} (centre communal de geo.api.gouv.fr : {C.get('centre')})"
        for c, v in F["carburant.evolution"]["valeur"].items():
            nomc = "gazole" if c == "Gazole" else "SP95-E10"
            s = "utilisable" if v["stations"] >= 8 else "fragile"
            for champ, t in (("prix", f"Prix médian du {nomc}, semaine du {v['semaine_ref']}"),
                             ("prix_un_an_avant", f"Prix médian du {nomc}, semaine du {v['semaine_un_an_avant']}"),
                             ("ecart", f"Hausse du prix médian du {nomc} en un an")):
                ajoute(f"carburant.{c.lower()}.{champ}", t, v[champ], "€/L", f"{v['stations']} stations déclarantes",
                       "médiane entre stations du dernier prix déclaré dans la semaine", rayon, "carburant.evolution", s,
                       "réextraire la veille de la publication",
                       limites_propres=["Le contrôle sur les mêmes stations (scripts/13) n'est pas fait par l'outil."])
            hausse = arrondi(v["ecart"] * 20) / 20  # arrondie à 5 centimes, comme dans l'article pilote
            for km in KMS:
                litres = 2 * km * JOURS * CONSO / 100
                scen.append({"id": f"scenario.carburant.{c.lower()}.{km}km", "carburant": nomc, "km_aller": km,
                             "hausse_retenue_eur_l": hausse, "surcout_an_eur": arrondi(litres * hausse / 10) * 10})
    # ── Faits absents (ne pas reconstituer) ───────────────────────────────────────────────────
    cmp_path = a.comparaison or os.path.join(os.path.dirname(a.fiche), "comparaison_voiture.json")
    cmp = json.load(open(cmp_path)) if os.path.exists(cmp_path) else None
    if cmp:
        if cmp["commune"]["insee"] != insee:
            raise SystemExit(f"{cmp_path} : repère calculé pour {cmp['commune']['insee']}, pas pour {insee}")
        cmp["chemin"] = cmp_path
        if cmp["disponible"]:
            g = cmp["groupe"]
            cmp["faits"] = [
                {"id": "comparaison.voiture.commune", "fait": f"Part des actifs résidant à {nom} qui vont travailler principalement en voiture (valeur comparée)",
                 "affichage": pct(cmp["commune"]["voiture"]), "usage": "oui"},
                {"id": "comparaison.voiture.mediane_groupe", "fait": f"Médiane des parts de la voiture des {g['n']} communes du groupe (chaque commune compte une fois)",
                 "affichage": pct(g["mediane_voiture"]), "usage": "oui"},
                {"id": "comparaison.voiture.ecart", "fait": f"Écart : {nom} moins la médiane du groupe (valeurs arrondies)",
                 "affichage": f"{cmp['ecart_points']:+d} points", "usage": "oui"},
                {"id": "comparaison.voiture.groupe_n", "fait": "Nombre de communes du groupe", "affichage": str(g["n"]), "usage": "oui"}]
    absents = [
        (("Rang, palmarès ou toute comparaison avec d'autres communes que ni la section 4 bis ni un autre fait du dossier ne fournit" if cmp and cmp["disponible"]
          else "Rang ou comparaison avec d'autres communes françaises (vélo, voiture, « taille comparable »)"),
         ("seules les comparaisons calculées et documentées dans le dossier s'écrivent" if cmp and cmp["disponible"]
          else (cmp["raison"] if cmp else "repère non calculé pour cette commune (outil/comparaison_voiture.py)"))),
        ("Population totale de la commune, nombre de ménages de la commune", "non exposés par la fiche"),
        ("Composition de l'unité urbaine (liste et nombre de communes)", "la fiche ne donne que son code"),
        ("Part de la voiture pour un groupe de communes de travail autre que ceux listés", "recalcul MOBPRO nécessaire (cf. scripts/10_incertitude.py)"),
        ("Temps de trajet, kilomètres routiers, itinéraires à vélo", "exploration seulement, résultats divergents selon le calcul"),
        ("Autopartage, vélos en libre-service", "flux GBFS propres à chaque réseau, non collectés"),
        ("Usage réel des équipements (où l'on fait ses courses, où vont les enfants)", "aucune source"),
        ("Réaction des habitants à la hausse du carburant", "les pratiques datent de 2022, les prix de 2025-2026"),
        ("Contrôle de la hausse sur les mêmes stations", "non fait par l'outil (scripts/13 pour La Rochelle)"),
    ]
    # ── Visuels ───────────────────────────────────────────────────────────────────────────────
    vals = [x["voiture"] for x in secteurs if x["type"] == "habitat"]
    visuels = []
    if vals:
        lo_c = min(vals)
        bas = round(int(lo_c * 100 // 5 * 5) / 100, 2)  # borne basse arrondie à 5 points en dessous du minimum
        tient = max(vals) < bas + 0.5
        visuels.append({"visuel": "Carte de la part de la voiture par secteur (IRIS)", "etat": "réalisable" if tient else "réalisable avec classes à revoir",
                        "faits": "secteurs (tableau), iris.voiture.min/max",
                        "commande": f"python visuels/generer_visuels.py --insee {insee} --fiche {a.fiche} --contours <cache>/iris_ign_{insee}.json --incertitudes resultats/incertitudes_mobpro.csv --out <dossier> --classes {bas}",
                        "manuel": "aucun pour la production : classes automatiques (--classes auto) et secteurs cités repérés par des numéros avec leur liste (--reperes) ; libellés posés à la main seulement pour une version soignée"})
        visuels.append({"visuel": "Tableau accessible des secteurs (HTML et Markdown)", "etat": "produit avec la carte", "faits": "secteurs", "commande": "idem", "manuel": "aucun"})
    if T.get("modes_par_destination"):
        visuels.append({"visuel": "Barres : part de la voiture selon la commune de travail", "etat": "réalisable automatiquement",
                        "faits": "mobpro.voiture_selon_destination.* (groupes utilisables seulement)",
                        "commande": "generer_visuels.py (sans --sans-barres)",
                        "manuel": "aucun : la liste exacte des communes figure dans l'intitulé de la barre"})
        if vois:
            visuels.append({"visuel": f"Carte de situation : {nom} et {liste(vois)}", "etat": "réalisable, seulement à côté du graphique précédent",
                            "faits": "aucun (contours IGN)",
                            "commande": f"generer_visuels.py … --communes {','.join(vois)}",
                            "manuel": "le sous-titre parle de « la seconde barre » : à n'utiliser qu'avec ce graphique, même liste exacte"})
    if scen:
        visuels.append({"visuel": "Tableau du scénario de surcoût de carburant", "etat": "disponible (données ci-dessus)", "faits": "scenario.carburant.*",
                        "commande": "aucune (tableau en Markdown dans l'article)", "manuel": "aucun"})
    # ── Vérifications humaines en attente ─────────────────────────────────────────────────────
    # Chaque vérification dit quels faits du dossier elle concerne, et si elle les bloque (en attente) ou non.
    CONCERNE = {"mobpro.voiture_selon_destination": ("mobpro.voiture_selon_destination.*, ecart.voiture_destination.*", "non bloquante : la liste est nommée et exacte ; relire l'intérêt du choix"),
                "iris.ecart_voiture": ("noms de secteurs (section 3), iris.voiture.min/max", "non bloquante : relire avant d'écrire un libellé comme nom de quartier"),
                "acces.adresses": ("colonnes et faits bus (acces.*.bus_*, acces.*.aucun_bus_*)", "BLOQUANTE : ces faits sont en attente de validation et ne s'écrivent pas ; les équipements ne sont pas concernés")}
    verifs = [f"`{f['id']}` : {f['verification_humaine']} Concerne : {CONCERNE.get(f['id'], ('n.d.', 'n.d.'))[0]}. {CONCERNE.get(f['id'], ('', 'à qualifier'))[1].capitalize()}."
              for f in fiche["faits"] if f.get("verification_humaine")]
    if "carburant.evolution" in F:
        verifs.append("`carburant.evolution` : réextraire les prix la veille de la publication et contrôler la hausse sur les mêmes stations. "
                      "Concerne : carburant.*, scenario.carburant.*. Non bloquante pour la rédaction, obligatoire avant publication.")
    sources_gtfs = F.get("acces.adresses", {}).get("source", "")
    doc = complement(a.complement or os.path.join(a.out, "complement.json"))
    if doc:
        absents += [(f"Information documentaire non retenue : {e['sujet']}", e["raison"]) for e in doc.get("ecartes", [])]

    dossier = {"commune": {"insee": insee, "nom": nom, "departement": C.get("dep"), "epci": C.get("epci"), "unite_urbaine": C.get("uu"),
                           "voisines": vois, "origine_voisines": a.origine_voisines},
               "fiche": {"chemin": a.fiche, "sha256": hashlib.sha256(brut).hexdigest(), "generee_le": fiche["genere_le"],
                         "jour_reference": fiche["jour_reference"]},
               "dossier_genere_le": dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
               "faits": faits, "secteurs": secteurs, "destinations": T.get("modes_par_destination") or [],
               "voisines": T.get("voisines") or [], "acces_communes": T.get("acces_communes") or {},
               "scenario_carburant": {"hypotheses": {"jours_trajet_an": JOURS, "litres_100km": CONSO, "km_aller": KMS,
                                                     "hausse": "hausse médiane de la fiche arrondie à 5 centimes"}, "lignes": scen},
               "absents": [{"fait": x, "raison": y} for x, y in absents], "visuels": visuels, "verifications_humaines": verifs,
               "complement_documentaire": doc, "comparaison": cmp}
    os.makedirs(a.out, exist_ok=True)
    json.dump(dossier, open(os.path.join(a.out, "dossier.json"), "w"), ensure_ascii=False, indent=1)
    open(os.path.join(a.out, "dossier.md"), "w").write(rendu_md(dossier, sources_gtfs))
    print(f"✓ {a.out}/dossier.md, dossier.json · {len(faits)} faits, {len(secteurs)} secteurs, {len(absents)} absents"
          + (f", {len(doc['faits'])} informations documentaires ({doc['chemin']})" if doc else ", sans complément documentaire"))


NOMBRES = {2: "deux", 3: "trois", 4: "quatre", 5: "cinq", 6: "six"}


def rendu_md(d, sources_gtfs):
    C = d["commune"]; nom = C["nom"]; vois = C["voisines"]
    L = [f"# Dossier d'entrée de rédaction · {nom} ({C['insee']})", "",
         f"Fiche source : `{d['fiche']['chemin']}` (générée le {d['fiche']['generee_le']}, jour de référence {d['fiche']['jour_reference']}, "
         f"sha256 `{d['fiche']['sha256'][:16]}`). Dossier généré le {d['dossier_genere_le']} par `outil/dossier_redaction.py`.", "",
         "Ce dossier est **la seule matière** de la rédaction. Chaque fait a un identifiant stable (colonne `id`) : c'est lui que cite la "
         "correspondance interne du brouillon. Un fait qui n'est pas ici n'existe pas pour l'article.", "",
         "**Statut et usage.** La colonne « Usage » dit ce que l'on peut écrire :", "",
         "| Statut | Ce que cela veut dire | Usage |", "|---|---|---|",
         "| `utilisable` | donnée exploitable, population, source et périmètre identifiés | `oui` : à écrire tel quel (valeur arrondie de la colonne « Valeur ») |",
         "| `fragile` | faible précision statistique (petit échantillon) | `ordre de grandeur` : jamais en chiffre de titre ni comme seul appui de la réponse, avec la précision du motif |",
         "| `en attente de validation` | dépend d'une vérification humaine non faite (réseau de bus, jour de référence) | `non` : ne pas écrire, même arrondi ou en termes vagues ; la valeur n'est pas donnée |",
         "| `absent` | pas de donnée, ou secteur exclu | `non` |", "",
         "**Valeurs aux bornes.** « 0 % » et « 100 % » sont des valeurs exactes : elles s'écrivent « aucun » ou « tous ». Une valeur proche d'une borne "
         "est donnée au dixième (« 99,8 % », « 0,4 % ») : elle s'écrit « la quasi-totalité » ou « presque aucun », jamais « tous » ou « aucun », ni « 100 % » ou « 0 % ».", "",
         *(["Les **informations documentaires** (section 2 bis, identifiants `doc.*`) ne sont pas des résultats calculés : elles ont leur propre colonne Usage "
            "(`oui`, `avec ses conditions`, `non`).", ""] if d.get("complement_documentaire") else []),
         "**Populations.** Trois populations distinctes, à ne pas mélanger : les **actifs** occupés (pratiques domicile-travail, fichier MOBPRO "
         "et base IRIS Activité), les **ménages** (voiture, stationnement, base IRIS Logement), les **adresses** (proximité des équipements, "
         "Base adresse nationale). Une part d'adresses n'est pas une part de ménages ni d'habitants.", "",
         "## 1. Périmètres exacts", "",
         f"- **Commune étudiée** : {nom} ({C['insee']}), département {C['departement']}, intercommunalité {(C.get('epci') or {}).get('nom', 'n.d.')}.",
         f"- **Groupe de communes nommé** : {liste(vois) if vois else 'aucun'}. Origine de cette liste : {C['origine_voisines']}. "
         f"Présenter ce groupe avec cette liste exacte la première fois qu'il apparaît ; ensuite « ces {NOMBRES.get(len(vois), len(vois))} communes » suffit. "
         "Ce groupe n'est pas « toutes les communes limitrophes » ni « les communes voisines » en général.",
         f"- **Unité urbaine INSEE** : code {C['unite_urbaine']} ; sa composition n'est pas dans la fiche.",
         f"- **Secteurs** : IRIS de l'INSEE ; leurs noms ne sont pas toujours ceux des quartiers d'usage.",
         f"- **Bus** : {sources_gtfs.split(';')[-1].strip() if sources_gtfs else 'n.d.'}. Réseau et jour de référence non validés : "
         "tous les faits bus sont en attente de validation et ne s'écrivent pas."
         + (" Les informations publiées par le réseau (section 2 bis) ne les valident pas et n'en tiennent pas lieu." if d.get("complement_documentaire") else ""), ""]
    L += ["## 2. Faits", "",
          "| id | Fait | Valeur | Population / dénominateur | Périmètre | Source, millésime | Statut | Usage |", "|---|---|---|---|---|---|---|---|"]
    for f in d["faits"]:
        st = f["statut"] + (f" ({f['motif_statut']})" if f["motif_statut"] else "")
        iv = f" [IC 95 % : {pct(f['intervalle_95'][0])} à {pct(f['intervalle_95'][1])}]" if f.get("intervalle_95") else ""
        val = "— (non donnée : en attente de validation)" if f["statut"] == "en attente de validation" else f"{f['affichage']}{iv}"
        L.append(f"| `{f['id']}` | {f['fait']} | {val} | {f['denominateur']} | {f['perimetre']} | {f['source']}, {f['millesime']} | {st} | `{f['usage']}` |")
    L += ["", "### Limites par famille de faits", ""]
    vus = {}
    for f in d["faits"]:
        vus.setdefault(f["fait_de_la_fiche"], [])
        for l in f["limites"]:
            if l not in vus[f["fait_de_la_fiche"]]:
                vus[f["fait_de_la_fiche"]].append(l)
    for k, ls in vus.items():
        L.append(f"- `{k}.*` : " + " ".join(ls))
    doc = d.get("complement_documentaire")
    if doc:
        L += ["", "## 2 bis. Informations documentaires (non calculées)", "",
              f"Informations publiées par des sources officielles, recopiées à la main et datées (consultation : {doc['consulte_le']} ; fichier `{doc['chemin']}`). "
              "Ce ne sont **pas** des résultats calculés. Une fréquence ou une desserte n'y figure que si la source la donne explicitement, avec son périmètre (ligne ou service, sens, jours, période) : tu l'écris dans ce périmètre, sans la généraliser à d'autres lignes ni au réseau, et tu n'en tires ni temps de trajet, ni desserte d'une adresse. "
              "Elles servent la question « utiliser moins sa voiture » ; elles ne permettent de conclure ni sur la faisabilité d'un trajet, ni sur la possibilité "
              "de se passer d'une deuxième voiture ou de vivre sans voiture.", "",
              "Usage : `oui` = à écrire tel quel, avec sa date ou sa période de validité si elle est utile ; `avec ses conditions` = à n'écrire qu'avec toutes "
              "ses conditions (public, horaires, réservation), sinon à laisser ; `non` = ne pas écrire. La colonne « À ne pas en déduire » s'applique toujours.", "",
              "| id | Information | Source | Consulté le | Validité | Périmètre | Usage | À ne pas en déduire |", "|---|---|---|---|---|---|---|---|"]
        for f in doc["faits"]:
            L.append(f"| `{f['id']}` | {f['information']} | {f['source']} | {f['consulte_le']} | {f['validite']} | {f['perimetre']} | `{f['usage']}` | {f.get('consigne', '')} |")
        if doc.get("recherches"):
            L += ["", "**État des recherches documentaires.** `vérifié` : information trouvée et contrôlée (ci-dessus) ; `non vérifié` : trouvée mais non "
                  "contrôlée, ne s'écrit pas ; `introuvable` : cherchée sans résultat ; `inaccessible` : source hors d'atteinte ; `non recherché` : pas cherchée. "
                  "Seul `vérifié` s'écrit. **Une information absente, introuvable ou non recherchée ne veut pas dire que le service n'existe pas** : "
                  "n'écris ni « pas de bus le dimanche », ni « pas de réseau gratuit », ni rien d'équivalent.", "",
                  "| Sujet | Statut | Source, date | Note |", "|---|---|---|---|"]
            L += [f"| {r['sujet']} | `{r['statut']}` | {r.get('source', '')} {r.get('consulte_le', '')} | {r.get('note', '')} |" for r in doc["recherches"]]
    L += ["", "## 3. Secteurs (IRIS)", "",
          "Part de la voiture, du vélo, des transports en commun et de la marche : **actifs** occupés de 15 ans ou plus **qui habitent le secteur, quelle que soit "
          "leur commune de travail** (la commune étudiée ou une autre). Ce tableau et celui de la section 4 (actifs de toute la commune, selon leur commune de travail) "
          "ne se croisent pas : le dossier ne donne aucune part par secteur **et** commune de travail. On peut rapprocher les deux observations, pas attribuer "
          "la part d'un secteur aux seuls actifs qui travaillent dans la commune, ni l'inverse. Ménages sans voiture, stationnement réservé : "
          "**ménages** (résidences principales) du secteur. Panier 500 m : part des **adresses** du secteur (chaque adresse compte pareil) qui ont à la fois un commerce "
          "alimentaire, une pharmacie et une école élémentaire à moins de 500 m à vol d'oiseau. Les fréquences de bus par secteur sont en attente de validation : "
          "elles ne sont pas données. Identifiant d'une cellule : `iris.<code>.<colonne>`, colonne parmi `actifs`, `voiture`, `velo`, `tc`, `marche`, "
          "`menages_sans_voiture`, `stationnement_reserve`, `panier_500m`. Estimations par sondage : les petits écarts entre secteurs ne doivent pas être surinterprétés.", "",
          "| Code | Secteur | Statut | Usage | Actifs | Voiture | Vélo | TC | Marche | Ménages sans voiture | Stationnement réservé | Panier 500 m (adresses) |",
          "|---|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|"]
    P = lambda v: "n.d." if v is None else pct(v)
    for s in sorted(d["secteurs"], key=lambda s: (s["type"] != "habitat", s.get("voiture") or 0)):
        if s["type"] != "habitat":
            L.append(f"| {s['code']} | {s['nom']} | absent ({s['motif']}) | `non` | | | | | | | | |"); continue
        st = s["statut"] + (f" ({s['motif']})" if s["motif"] else "")
        L.append(f"| {s['code']} | {s['nom']} | {st} | `{s['usage']}` | {s['actifs']} | {P(s['voiture'])} | {P(s['velo'])} | {P(s['tc'])} | {P(s['marche'])} | "
                 f"{P(s['menages_sans_voiture'])} | {P(s['menages_stationnement_reserve'])} | {P(s['panier_quotidien_500m'])} |")
    if d["destinations"]:
        L += ["", f"## 4. Mode selon la commune de travail (actifs résidant à {nom})", "",
              f"Actifs qui habitent l'ensemble de {nom}, tous secteurs confondus, selon leur commune de travail ; aucune répartition par secteur de résidence (voir section 3). "
              "Chaque ligne est un groupe distinct de personnes. Identifiant : `destination.<insee>.<colonne>`, colonne parmi `part_des_actifs`, `voiture`, `velo`, `tc`, `marche`. Statut d'après le nombre de lignes d'échantillon.", "",
              "| Commune de travail (code) | Part des actifs résidents | Voiture | Vélo | TC | Marche | Lignes | Statut | Usage |", "|---|---:|---:|---:|---:|---:|---:|---|---|"]
        for r in d["destinations"]:
            st, m = statut_lignes(r["lignes"])
            L.append(f"| {r['nom']} ({r['travail']}) | {P(r['part_des_actifs'])} | {P(r['voiture'])} | {P(r['velo'])} | {P(r['tc'])} | {P(r['marche'])} | {r['lignes']} | {st} | `{USAGE[st]}` |")
    cmp = d.get("comparaison")
    if cmp and cmp["disponible"]:
        g = cmp["groupe"]
        L += ["", "## 4 bis. Repère de comparaison avec d'autres communes (calculé)", "",
              f"Règle de sélection, fixée avant de regarder les résultats et identique pour toutes les communes : {cmp['regle']['texte']}. "
              f"Indicateur : {cmp['definition']['indicateur']} ; population : {cmp['definition']['population']} ; {cmp['definition']['source']}, {cmp['definition']['millesime']}. "
              f"Le rôle est une approximation ({cmp['regle']['approximation_role']}).", "",
              "C'est la référence commune de la série pour comparer l'usage de la voiture. Comment l'écrire : dans le récit, la valeur locale et la médiane, avec un nom court "
              "(« les villes de taille proche ») et un renvoi à la méthode, où la règle est donnée en entier ; jamais « comparables sur tous les plans ». "
              "Le seuil de 150 lignes est un critère d'inclusion, pas une garantie de précision. La médiane est celle des parts communales, chaque commune comptant "
              "une fois : ce n'est pas la part de voiture de l'ensemble de leurs habitants. Pas de rang, pas de palmarès, pas de liste de villes dans l'article. "
              "Un écart de quelques points dit seulement que la commune est proche de la médiane ; s'il n'apporte rien à la question, le repère reste dehors.", "",
              "| id | Fait | Valeur | Usage |", "|---|---|---|---|"]
        L += [f"| `{f['id']}` | {f['fait']} | {f['affichage']} | `{f['usage']}` |" for f in cmp["faits"]]
        L += ["", f"Communes du groupe ({g['n']}, pour la vérification ; ne pas les citer) : " + ", ".join(x["nom"] for x in g["communes"]) + "."]
    elif cmp:
        L += ["", "## 4 bis. Repère de comparaison avec d'autres communes", "", f"Indisponible : {cmp['raison']}. Ne pas écrire de comparaison."]
    if d["voisines"]:
        L += ["", "## 5. Les communes du groupe « voisines »", "",
              f"Résidents de chaque commune (tous lieux de travail) et, parmi eux, ceux qui viennent travailler à {nom}. Identifiant : `voisine.<insee>.<colonne>`, colonne parmi `voiture`, `velo`, `tc` (tous résidents) et `voiture_vers_commune` (venant travailler).", "",
              f"| Commune (code) | Voiture, tous résidents | Vélo | TC | Voiture, venant travailler à {nom} | Lignes (vers {nom}) | Statut (vers {nom}) | Usage (vers {nom}) |", "|---|---:|---:|---:|---:|---:|---|---|"]
        for r in d["voisines"]:
            w = r.get("vers_commune_etudiee") or {}
            st, m = statut_lignes(w.get("lignes", 0))
            L.append(f"| {r['nom']} ({r['insee']}) | {P(r.get('voiture'))} | {P(r.get('velo'))} | {P(r.get('tc'))} | {P((w.get('voiture') or {}).get('p'))} | {w.get('lignes', 'n.d.')} | {st} | `{USAGE[st]}` |")
        L += ["", "*Les parts « tous résidents » viennent de la base IRIS agrégée à la commune ; celles « venant travailler » du fichier détail.*"]
    if d["acces_communes"]:
        keys = ["commerce_alim_500m", "pharmacie_500m", "ecole_elementaire_500m", "panier_quotidien_500m", "gare_2km"]
        L += ["", "## 6. Accès depuis les adresses, par commune", "",
              "Part des **adresses** BAN de chaque commune, distances à vol d'oiseau ; chaque secteur (IRIS) pèse selon son nombre de ménages "
              "(poids d'une adresse = ménages de son IRIS / adresses de son IRIS). Ce n'est ni une part de ménages mesurée, ni une simple part des adresses : "
              "l'écrire avec cette qualification (par exemple « des adresses, chaque secteur pesant selon son nombre de ménages »), ne pas la comparer telle quelle "
              "aux parts par secteur (section 3, non pondérées), ou l'écarter si elle alourdit l'article. "
              "Identifiant : `acces.<insee>.<colonne>` (nom de colonne du tableau). Usage : `oui`. Les colonnes bus sont en attente de validation et ne sont pas données.", "",
              "| Commune (code) | " + " | ".join(keys) + " |", "|---" * (len(keys) + 1) + "|"]
        for c, v in d["acces_communes"].items():
            if v:
                n = vois.get(c, nom if c == C["insee"] else c)
                L.append(f"| {n} ({c}) | " + " | ".join(P(v.get(k)) for k in keys) + " |")
        L += ["", "Libellés : " + " ; ".join(f"`{k}` = {ACCES[k]}" for k in keys) + "."]
    sc = d["scenario_carburant"]
    if sc["lignes"]:
        h = sc["hypotheses"]
        L += ["", "## 7. Scénario pré-calculé : surcoût de carburant par an", "",
              f"Hypothèses (à écrire dans l'article) : {h['litres_100km']:g} L/100 km, {h['jours_trajet_an']} allers-retours domicile-travail par an, "
              f"{h['hausse']}. Carburant seul. Le scénario ne s'attribue à aucun quartier ni à aucune commune.", "",
              "| id | Carburant | Trajet aller | Hausse retenue | Surcoût par an |", "|---|---|---:|---:|---:|"]
        for r in sc["lignes"]:
            hausse = f"{r['hausse_retenue_eur_l']:.2f}".replace(".", ",")
            L.append(f"| `{r['id']}` | {r['carburant']} | {r['km_aller']} km | +{hausse} €/L | environ {r['surcout_an_eur']} € |")
    L += ["", "## 8. Faits absents : ne pas les écrire, ne pas les reconstituer", ""]
    L += [f"- {x['fait']} : {x['raison']}." for x in d["absents"]]
    L += ["", "## 9. Visuels disponibles ou réalisables", "", "| Visuel | État | Faits | Étape manuelle |", "|---|---|---|---|"]
    L += [f"| {v['visuel']} | {v['etat']} | {v['faits']} | {v['manuel']} |" for v in d["visuels"]]
    L += ["", "## 10. Vérifications humaines en attente (avant publication)", ""]
    L += ["Ne reprendre dans le rendu que celles qui concernent un fait utilisé.", ""]
    L += [f"- {v}" for v in d["verifications_humaines"]] or ["- aucune"]
    L += ["", "## 11. Paramètres éditoriaux", "", re.sub(r"^## ", "### ", open(os.path.join(ETUDE, "redaction", "parametres_editoriaux.md")).read().strip(), flags=re.M),
          "", "## 12. Voix futur•e", "", "*(Recopié de `NOTE_EDITORIALE.md`, section 2, à la génération du dossier.)*", "",
          re.sub(r"^### ", "#### ", section_note(r"2\. Voix générale"), flags=re.M), ""]
    return "\n".join(L) + "\n"


if __name__ == "__main__":
    main()
