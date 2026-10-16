#!/usr/bin/env python3
"""campagne.py — Campagne de 80 communes supplémentaires (série mobilité, 20 → 100 communes distinctes), mesurée.

Ne change pas la chaîne : chaque lot est un lot ordinaire de `outil/lot.py` (préparer, collecter, rédiger). Ce script
ajoute seulement ce que la campagne demande autour : la sélection traçable des communes, la composition des quatre lots
de vingt (une commune inexploitable est consignée et remplacée par la suivante), le journal de campagne (début, fin,
suspensions, reprises, interventions du terminal pilote), le CSV des mesures et le bilan cumulatif.

    python outil/campagne.py selection              # liste ordonnée des candidates, exclusions motivées
    python outil/campagne.py preparer 1             # compose et prépare le lot 1 (gratuit, aucun appel de modèle)
    python outil/campagne.py produire 1             # collecte puis rédaction du lot 1 (abonnements) ; code 3 si suspendu
    python outil/campagne.py intervention "texte" --minutes 4 [--estime]
    python outil/campagne.py bilan                  # mesures.csv + BILAN.md cumulatif

Données de la campagne : `campagne-100/` (hors de `lots/`, que /dev/lot lit comme des lots).
"""
import argparse, csv, datetime as dt, gzip, json, os, shutil, statistics, subprocess, sys, time

ICI = os.path.dirname(os.path.abspath(__file__))
ETUDE = os.path.dirname(ICI)
LOTS = os.path.join(ETUDE, "lots")
CAMP = os.path.join(ETUDE, "campagne-100")
NB_LOTS, PAR_LOT = 4, 20
NOM_LOT = "2026-10-lot-{:02d}-campagne"  # lots 04 à 07, à la suite des lots 01 à 03
MODELE_LOT = os.path.join(LOTS, "2026-10-lot-03-codex", "lot.json")  # chaîne actuelle : mêmes outils, modèles et réglages
# Les vingt communes déjà préparées (pilotes et lots 01 à 03) : hors campagne.
PILOTES = {"17300": "La Rochelle (article/article-v3.md)", "79191": "Niort (redaction/79191/article.md)"}
LOTS_ANTERIEURS = ("2026-10-lot-01", "2026-10-lot-02-codex", "2026-10-lot-03-codex")
# Paris, Lyon et Marseille : l'index et la chaîne travaillent par arrondissement municipal ; la commune entière n'y existe pas.
PLM = {"75056": ("Paris", "751"), "13055": ("Marseille", "132"), "69123": ("Lyon", "6938")}


def maintenant():
    return dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def racine_depot():
    commun = subprocess.run(["git", "rev-parse", "--git-common-dir"], cwd=ETUDE, capture_output=True, text=True).stdout.strip()
    return os.path.dirname(os.path.abspath(os.path.join(ETUDE, commun)))


def journal(evt, **kw):
    os.makedirs(CAMP, exist_ok=True)
    with open(os.path.join(CAMP, "journal.jsonl"), "a") as f:
        f.write(json.dumps({"t": maintenant(), "evt": evt, **kw}, ensure_ascii=False) + "\n")


def lire_journal():
    p = os.path.join(CAMP, "journal.jsonl")
    return [json.loads(l) for l in open(p)] if os.path.exists(p) else []


def deja_preparees():
    s = dict(PILOTES)
    for nom in LOTS_ANTERIEURS:
        for k, c in json.load(open(os.path.join(LOTS, nom, "etat.json")))["communes"].items():
            if c.get("article"):
                s.setdefault(k, f"{c['nom']} ({nom})")
    return s


# ── Sélection ───────────────────────────────────────────────────────────────────────────────────────
def cmd_selection(a):
    """Communes de France métropolitaine (Corse comprise) par population décroissante. Source unique : l'index du
    comparateur, celui que la chaîne lit déjà pour résoudre les communes."""
    os.makedirs(CAMP, exist_ok=True)
    p_sel = os.path.join(CAMP, "selection.json")
    if os.path.exists(p_sel) and not a.forcer:
        sys.exit("selection.json existe déjà : la liste est figée (--forcer pour la reconstruire, raison à documenter)")
    idx = json.load(gzip.open(os.path.join(racine_depot(), "data", "comparateur-index.json.gz")))
    meta, C = idx["meta"], idx["communes"]
    deja = deja_preparees()
    lignes, arr = [], {k: [] for k in PLM}
    for c in C:
        plm = next((k for k, (_, pre) in PLM.items() if c["insee"].startswith(pre) and c["insee"] != k), None)
        if plm:
            arr[plm].append(c)
            continue
        lignes.append({"insee": c["insee"], "nom": c["nom"], "dept": c["dept"], "population": c.get("population")})
    for k, (nom, _) in PLM.items():
        lignes.append({"insee": k, "nom": nom, "dept": k[:2], "population": sum(x.get("population") or 0 for x in arr[k]),
                       "exclusion": f"commune découpée en {len(arr[k])} arrondissements municipaux : l'index et la chaîne actuelle "
                                    "ne traitent que les arrondissements ; un article sur la commune entière demanderait une "
                                    "nouvelle architecture (population : somme des arrondissements, même source)"})
    lignes = [l for l in lignes if l["population"]]
    lignes.sort(key=lambda l: -l["population"])
    for r, l in enumerate(lignes, 1):
        l["rang"] = r
        if l["insee"] in deja:
            l["exclusion"] = f"déjà préparée : {deja[l['insee']]}"
    sel = {"cree_le": maintenant(),
           "source_population": {"fichier": "data/comparateur-index.json.gz (index du comparateur, lu par outil/lot.py)",
                                 "champ": "population", "origine": next((x for x in meta.get("approximations", []) if x.startswith("population")), ""),
                                 "millesime": "2021 (population totale, champ population_totale_2021 du jeu ADEME data_communes)",
                                 "perimetre": meta.get("perimetre")},
           "regle": "rang de population décroissant ; toute commune, principale ou non dans son agglomération ; hors communes "
                    "déjà préparées ; une commune inexploitable est consignée avec son motif et remplacée par la suivante",
           "candidates": lignes[:400]}
    json.dump(sel, open(p_sel, "w"), ensure_ascii=False, indent=1)
    ecrire_candidats()
    n = sum(1 for l in sel["candidates"] if not l.get("exclusion"))
    print(f"{n} candidates ordonnées (sur les 400 premières communes) ; exclusions : "
          f"{sum(1 for l in sel['candidates'] if l.get('exclusion'))}")


def charger_selection():
    return json.load(open(os.path.join(CAMP, "selection.json")))


def ecrire_candidats():
    """Vue CSV de la sélection et du sort de chaque candidate (retenue dans un lot, inexploitable, en réserve)."""
    sel = charger_selection()
    sort = {}
    for n in range(1, NB_LOTS + 1):
        d = os.path.join(LOTS, NOM_LOT.format(n + 3))
        if os.path.exists(os.path.join(d, "etat.json")):
            for k, c in json.load(open(os.path.join(d, "etat.json")))["communes"].items():
                sort[k] = (NOM_LOT.format(n + 3), c)
    with open(os.path.join(CAMP, "candidats.csv"), "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["rang", "insee", "commune", "departement", "population_2021", "sort", "lot", "motif"])
        for l in sel["candidates"]:
            lot, c = sort.get(l["insee"], (None, None))
            if l.get("exclusion"):
                s, m = "exclue d'office", l["exclusion"]
            elif c is None:
                s, m = "en réserve", ""
            elif c.get("inexploitable"):
                s, m = "inexploitable", c["inexploitable"]
            else:
                s, m = "retenue", c.get("statut", "")
            w.writerow([l["rang"], l["insee"], l["nom"], l["dept"], l["population"], s, lot or "", m])


# ── Composition et préparation d'un lot ───────────────────────────────────────────────────────────────
def lot_py(*args):
    py = os.path.join(racine_depot(), ".venv-etudes", "bin", "python")
    return subprocess.run([py, os.path.join(ICI, "lot.py"), *args], cwd=ETUDE).returncode


def assignees():
    vu = set()
    for n in range(1, NB_LOTS + 1):
        p = os.path.join(LOTS, NOM_LOT.format(n + 3), "lot.json")
        if os.path.exists(p):
            vu |= set(json.load(open(p))["communes"])
    return vu


def inexploitable(c):
    """Motif d'une commune que la chaîne ne peut pas préparer, ou None si son dossier est prêt."""
    if c.get("statut") == "dossier prêt":
        return None
    err = [f"{k} : {e.get('erreur')}" for k, e in (c.get("etapes") or {}).items() if not e.get("ok")]
    return "; ".join(filter(None, [c.get("statut"), c.get("motif"), *err])) or "dossier non produit"


def cmd_preparer(a):
    n = a.lot
    d = os.path.join(LOTS, NOM_LOT.format(n + 3))
    os.makedirs(d, exist_ok=True)
    p_conf = os.path.join(d, "lot.json")
    if not os.path.exists(p_conf):
        conf = json.load(open(MODELE_LOT))
        conf.update(nom=os.path.basename(d), communes=[], delai_visuels_s=600,
                    objet=f"Campagne 20 → 100 communes (15/10/2026), lot {n} sur {NB_LOTS} : vingt communes, chaîne actuelle "
                          "(rédaction Codex, une relecture Claude, au plus une correction Codex). Aucune publication.",
                    execution_autorisee={"par": "porteur", "le": "2026-10-15",
                                         "perimetre": "campagne de 80 communes en quatre lots de vingt : collecte bornée et relecture "
                                                      "Claude (abonnement claude.ai), rédaction et correction Codex (abonnement ChatGPT) ; "
                                                      "sans clé API ni bascule ; suspension au premier refus ; sans publication"})
        json.dump(conf, open(p_conf, "w"), ensure_ascii=False, indent=1)
    journal("preparation_debut", lot=n)
    sel = [l for l in charger_selection()["candidates"] if not l.get("exclusion")]
    for tour in range(60):  # borne : au plus 60 compositions successives
        conf = json.load(open(p_conf))
        etat = json.load(open(os.path.join(d, "etat.json")))["communes"] if os.path.exists(os.path.join(d, "etat.json")) else {}
        prets = [k for k in conf["communes"] if etat.get(k, {}).get("statut") == "dossier prêt"]
        hors = [k for k in conf["communes"] if etat.get(k, {}).get("inexploitable")]
        manque = PAR_LOT - len(prets) - (len(conf["communes"]) - len(prets) - len(hors))  # en attente : comptées comme à venir
        if len(prets) >= PAR_LOT:
            break
        if manque > 0:
            pris = assignees()
            nouvelles = [l["insee"] for l in sel if l["insee"] not in pris][:manque]
            if not nouvelles:
                print("■ plus aucune candidate dans la sélection"); break
            conf["communes"] += nouvelles
            json.dump(conf, open(p_conf, "w"), ensure_ascii=False, indent=1)
        a_faire = [k for k in conf["communes"] if etat.get(k, {}).get("statut") != "dossier prêt" and not etat.get(k, {}).get("inexploitable")]
        lot_py("preparer", d, "--communes", ",".join(a_faire))
        etat_doc = json.load(open(os.path.join(d, "etat.json")))
        for k in a_faire:
            c = etat_doc["communes"].get(k)
            if c is None or c.get("statut") == "dossier prêt":
                continue
            m = inexploitable(c)
            if c.get("reprise_preparation"):
                c["inexploitable"] = m  # deuxième échec : consigné, la commune suivante prend sa place
                journal("inexploitable", lot=n, insee=k, motif=m)
            else:
                c["reprise_preparation"] = {"le": maintenant(), "motif": f"échec au premier passage ({m}) : une reprise, au cas où l'erreur serait passagère"}
        json.dump(etat_doc, open(os.path.join(d, "etat.json"), "w"), ensure_ascii=False, indent=1)
    journal("preparation_fin", lot=n)
    ecrire_candidats()
    lot_py("etat", d)


def cmd_produire(a):
    """Collecte (mutualisée par réseau) puis rédaction, relecture, correction et visuels du lot. Code de sortie 3 si un refus
    d'accès ou de quota a suspendu le lot : le message est dans SUSPENDU.json, la reprise ne fera que le reste."""
    d = os.path.join(LOTS, NOM_LOT.format(a.lot + 3))
    p_susp = os.path.join(d, "SUSPENDU.json")
    if os.path.exists(p_susp):
        s = json.load(open(p_susp))
        os.makedirs(os.path.join(CAMP, "suspensions"), exist_ok=True)
        shutil.move(p_susp, os.path.join(CAMP, "suspensions", f"lot{a.lot}-{s['le'].replace(':', '')}.json"))
        journal("reprise", lot=a.lot, suspension_du=s["le"])
    journal("production_debut", lot=a.lot)
    for etape in ("collecter", "rediger"):
        code = lot_py(etape, d, "--executer")
        if code == 3 or os.path.exists(p_susp):
            s = json.load(open(p_susp))
            journal("suspension", lot=a.lot, etape=etape, message=s["message"], ou=s["ou"])
            print(f"■ campagne suspendue ({etape}) : {s['message'][:300]}")
            sys.exit(3)
        if code:
            journal("erreur_lot", lot=a.lot, etape=etape, code=code)
            sys.exit(code)
    journal("production_fin", lot=a.lot)
    cmd_bilan(a)


def cmd_intervention(a):
    journal("intervention", texte=a.texte, minutes=a.minutes, mesure="estimée" if a.estime else "mesurée")
    print("intervention consignée")


# ── Mesures ─────────────────────────────────────────────────────────────────────────────────────────
NM = "non mesuré"


def compteurs(r):
    """Compteurs d'un appel, selon la définition de chaque outil (aucun double compte) :
    - Codex (`turn.completed.usage`) : input_tokens INCLUT cached_input_tokens ; output_tokens INCLUT reasoning_output_tokens.
    - Claude Code (`result.usage`, `modelUsage`) : input_tokens, cache_creation_input_tokens et cache_read_input_tokens sont
      DISJOINTS (l'entrée totale est leur somme) ; output_tokens INCLUT la réflexion (output_tokens_details.thinking_tokens).
    Pour une session de plusieurs tours (collecte), les totaux viennent de modelUsage, cumulé sur la session."""
    u = r.get("usage_brut") or r.get("jetons")
    if r["outil"] == "codex":
        if not u or u.get("input_tokens") is None:
            return dict(entree=NM, cache_lu=NM, cache_ecrit=NM, sortie=NM, raisonnement=NM)
        return dict(entree=u["input_tokens"], cache_lu=u.get("cached_input_tokens", NM), cache_ecrit="sans objet (Codex)",
                    sortie=u["output_tokens"], raisonnement=u.get("reasoning_output_tokens", NM))
    mu = r.get("model_usage_brut") or {}
    if mu:
        e = sum((m.get("inputTokens") or 0) for m in mu.values())
        cl = sum((m.get("cacheReadInputTokens") or 0) for m in mu.values())
        ce = sum((m.get("cacheCreationInputTokens") or 0) for m in mu.values())
        s = sum((m.get("outputTokens") or 0) for m in mu.values())
        th = ((u or {}).get("output_tokens_details") or {}).get("thinking_tokens")
        un_tour = len((u or {}).get("iterations") or []) <= 1
        return dict(entree=e + cl + ce, cache_lu=cl, cache_ecrit=ce, sortie=s,
                    raisonnement=th if th is not None and un_tour else NM)
    if u and u.get("output_tokens") is not None:
        cl, ce = u.get("cache_read_input_tokens") or 0, u.get("cache_creation_input_tokens") or 0
        return dict(entree=(u.get("input_tokens") or 0) + cl + ce, cache_lu=cl, cache_ecrit=ce, sortie=u["output_tokens"],
                    raisonnement=(u.get("output_tokens_details") or {}).get("thinking_tokens", NM))
    return dict(entree=NM, cache_lu=NM, cache_ecrit=NM, sortie=NM, raisonnement=NM)


def lots_campagne():
    return [(n, os.path.join(LOTS, NOM_LOT.format(n + 3))) for n in range(1, NB_LOTS + 1) if os.path.exists(os.path.join(LOTS, NOM_LOT.format(n + 3), "etat.json"))]


def lignes_mesures():
    L = []
    for n, d in lots_campagne():
        etat = json.load(open(os.path.join(d, "etat.json")))["communes"]
        nom = lambda k: (etat.get(k) or {}).get("nom", k)
        for k, c in etat.items():
            for e in [*(c.get("tentatives") or []), *[{"etape": x, **v} for x, v in (c.get("etapes") or {}).items()]]:
                L.append(dict(lot=n, insee=k, commune=c["nom"], etape=f"préparation : {e['etape']}", outil="local (python)",
                              modele_demande="sans objet", modele_confirme="sans objet", debut=e.get("debut", NM), fin=e.get("fin", NM),
                              duree_s=e.get("duree_s", NM), issue="réussi" if e.get("ok") else f"échec : {e.get('erreur', '')[:120]}",
                              entree="sans objet", cache_lu="sans objet", cache_ecrit="sans objet", sortie="sans objet",
                              raisonnement="sans objet", equivalent_api_usd="sans objet"))
            v = c.get("visuels")
            if v:
                L.append(dict(lot=n, insee=k, commune=c["nom"], etape="visuels", outil="local (python, Chrome sans interface)",
                              modele_demande="sans objet", modele_confirme="sans objet", debut=v.get("debut", NM), fin=v.get("fin", NM),
                              duree_s=v.get("duree_s", NM), issue="réussi" if v.get("ok", True) else v.get("erreur", "échec"),
                              entree="sans objet", cache_lu="sans objet", cache_ecrit="sans objet", sortie="sans objet",
                              raisonnement="sans objet", equivalent_api_usd="sans objet"))
        p = os.path.join(d, "depenses.jsonl")
        for l in (open(p) if os.path.exists(p) else []):
            r = json.loads(l)
            mc = r.get("modele_confirme")
            L.append(dict(lot=n, insee=r["commune"], commune=nom(r["commune"]),
                          etape=r["etape"] + (" (par réseau)" if r["etape"] == "collecte" else ""), outil=r["outil"],
                          modele_demande=r.get("modele_demande") or r.get("modele"),
                          modele_confirme=", ".join(mc) if mc else ("non renvoyé par l'outil" if r["outil"] == "codex" else NM),
                          debut=r.get("debut", NM), fin=r.get("fin") or r.get("date", NM), duree_s=r.get("duree_s", NM),
                          issue=r.get("issue", NM), **compteurs(r),
                          equivalent_api_usd=r["cout_usd_equivalent"] if r.get("cout_usd_equivalent") is not None else NM))
    return L


CHAMPS = ["lot", "insee", "commune", "etape", "outil", "modele_demande", "modele_confirme", "debut", "fin", "duree_s", "issue",
          "entree", "cache_lu", "cache_ecrit", "sortie", "raisonnement", "equivalent_api_usd"]
ENTETES = ["lot", "insee", "commune", "etape", "outil", "modele_demande", "modele_confirme", "debut_utc", "fin_utc", "duree_s",
           "issue", "jetons_entree_total", "dont_cache_lu", "dont_cache_ecrit", "jetons_sortie_total", "dont_raisonnement",
           "equivalent_api_usd_information"]


def num(x):
    return isinstance(x, (int, float)) and not isinstance(x, bool)


def t(s):
    return dt.datetime.strptime(s, "%Y-%m-%dT%H:%M:%SZ").replace(tzinfo=dt.timezone.utc)


def hm(s):
    s = int(round(s))
    return f"{s // 3600} h {s % 3600 // 60:02d} min" if s >= 3600 else f"{s // 60} min {s % 60:02d} s"


def k(x):
    return f"{x:,}".replace(",", " ") if num(x) else str(x)


def bloquantes(dj, article):
    sys.path.insert(0, ICI)
    from controle_article import controler
    if not os.path.exists(article):
        return []
    return [x for x in controler(dj, open(article).read())[0] if x["gravite"] == "bloquante"]


def cmd_bilan(a):
    L = lignes_mesures()
    with open(os.path.join(CAMP, "mesures.csv"), "w", newline="") as f:
        w = csv.writer(f); w.writerow(ENTETES)
        for l in L:
            w.writerow([l[c] for c in CHAMPS])
    ecrire_candidats()
    J = lire_journal()
    deja = deja_preparees()
    communes, exceptions, niv1, niv2, visuels_ko, faux, fragiles = {}, [], [], 0, [], [], []
    for n, d in lots_campagne():
        for kk, c in json.load(open(os.path.join(d, "etat.json")))["communes"].items():
            if c.get("article"):
                communes[kk] = (n, c)
                g = os.path.join(d, kk, "generation")
                dj = json.load(open(os.path.join(d, kk, "dossier", "dossier.json")))
                F = {f["id"]: f for f in dj.get("faits", [])}
                u = (F.get("carburant.gazole.ecart") or {}).get("usage")
                if u not in ("oui", "ordre de grandeur") or not (dj.get("scenario_carburant") or {}).get("lignes"):
                    exceptions.append(f"{c['nom']} ({kk}) : faits carburant absents ou inutilisables dans le dossier")
                elif u != "oui" or (F.get("carburant.e10.ecart") or {}).get("usage") not in ("oui",):
                    fragiles.append(f"{c['nom']} ({kk}) : hausse du gazole en ordre de grandeur"
                                    + ("" if (F.get("carburant.e10.ecart") or {}).get("usage") else ", sans SP95-E10") + " ; entrée carburant présente")
                rel = json.load(open(os.path.join(g, "relecture.anomalies.json"))) if os.path.exists(os.path.join(g, "relecture.anomalies.json")) else {}
                b = [x for x in rel.get("anomalies", []) if x.get("gravite") == "bloquante"]
                niv2 += sum(1 for x in rel.get("anomalies", []) if x.get("gravite") == "a_revoir")
                # Contrôle déterministe recalculé avec sa version actuelle (gratuit, rien n'est régénéré) : une anomalie de
                # l'époque qu'il ne reproduit plus était un faux positif, corrigé depuis dans controle_article.py.
                bc = bloquantes(dj, os.path.join(g, "redaction.md"))
                ancien = [x for x in (json.load(open(os.path.join(g, "redaction.controle.json"))) if os.path.exists(os.path.join(g, "redaction.controle.json")) else {}).get("anomalies", [])
                          if x.get("gravite") == "bloquante" and x.get("detail") not in {y.get("detail") for y in bc}]
                if ancien and not (b or bc) and os.path.exists(os.path.join(g, "correction.md")):
                    faux.append(f"{c['nom']} ({kk}) : " + " ; ".join(x.get("detail", "")[:100] for x in ancien))
                if b or bc:
                    reste = bloquantes(dj, os.path.join(g, c["article"]))
                    niv1.append((c["nom"], kk, [f"{x.get('categorie', '')} : {x.get('probleme', '')[:160]}" for x in b]
                                 + [f"contrôle {x.get('type', '')} : {x.get('detail', '')[:160]}" for x in bc],
                                 "corrigé" if os.path.exists(os.path.join(g, "correction.md")) and not reste
                                 else f"après correction, {len(reste)} anomalie(s) du contrôle" if reste else "non corrigé"))
                if c.get("visuels") and not c["visuels"].get("ok", True):
                    visuels_ko.append(f"{c['nom']} : {c['visuels'].get('erreur')}")
    appels = [l for l in L if l["outil"] in ("codex", "claude-code")]
    # Totaux par outil et étape
    par = {}
    for l in appels:
        p = par.setdefault((l["outil"], l["etape"]), {"n": 0, "nm": 0, "entree": 0, "cache_lu": 0, "cache_ecrit": 0, "sortie": 0, "raisonnement": 0, "rais_nm": 0, "duree": 0.0, "echecs": 0})
        p["n"] += 1
        p["echecs"] += l["issue"] != "réussi"
        p["duree"] += l["duree_s"] if num(l["duree_s"]) else 0
        if not num(l["entree"]):
            p["nm"] += 1; continue
        for c in ("entree", "cache_lu", "sortie"):
            p[c] += l[c] if num(l[c]) else 0
        p["cache_ecrit"] += l["cache_ecrit"] if num(l["cache_ecrit"]) else 0
        if num(l["raisonnement"]):
            p["raisonnement"] += l["raisonnement"]
        else:
            p["rais_nm"] += 1
    # Par commune (hors collecte, mutualisée par réseau)
    pc = {}
    for l in appels:
        if l["etape"].startswith("collecte"):
            continue
        x = pc.setdefault(l["insee"], {"nom": l["commune"], "codex": 0, "claude": 0, "nm": 0, "duree_ia": 0.0})
        if num(l["entree"]):
            x["codex" if l["outil"] == "codex" else "claude"] += l["entree"] + l["sortie"]
        else:
            x["nm"] += 1
        x["duree_ia"] += l["duree_s"] if num(l["duree_s"]) else 0
    for l in L:
        if l["outil"].startswith("local") and l["insee"] in pc and num(l["duree_s"]):
            pc[l["insee"]]["duree_ia"] += l["duree_s"]
    traitement = sum(l["duree_s"] for l in L if num(l["duree_s"]))
    debut = min((t(e["t"]) for e in J if e["evt"] in ("preparation_debut", "production_debut")), default=None)
    fins = [t(e["t"]) for e in J if e["evt"] != "intervention"] + [t(l["fin"]) for l in L if isinstance(l["fin"], str) and l["fin"][:2] == "20"]
    fin = max(fins, default=None)
    pauses, ouverte = 0.0, None
    for e in J:
        if e["evt"] == "suspension" and ouverte is None:  # plusieurs lots suspendus par la même limite : une seule pause
            ouverte = t(e["t"])
        elif e["evt"] == "reprise" and ouverte:
            pauses += (t(e["t"]) - ouverte).total_seconds(); ouverte = None
    inter = [e for e in J if e["evt"] == "intervention"]
    total = len(deja) + len(communes)
    o = [f"# Campagne 20 → 100 communes : bilan cumulatif\n",
         f"Mis à jour le {maintenant()} par `outil/campagne.py bilan`. Mesures détaillées : `campagne-100/mesures.csv` (une ligne par "
         "étape et par appel). Sélection : `campagne-100/candidats.csv`. Aucune publication ; les vérifications avant publication restent à faire.\n",
         f"**Communes distinctes préparées : {total}** ({len(deja)} avant la campagne, {len(communes)} pendant).\n",
         "## Lots\n", "| Lot | Communes retenues | Inexploitables remplacées | Prêtes à relire | Suspendu |", "|---|---|---|---|---|"]
    for n, d in lots_campagne():
        e = json.load(open(os.path.join(d, "etat.json")))["communes"]
        o.append(f"| {os.path.basename(d)} | {sum(1 for c in e.values() if not c.get('inexploitable'))} | "
                 f"{', '.join(c['nom'] + ' (' + kk + ')' for kk, c in e.items() if c.get('inexploitable')) or 'aucune'} | "
                 f"{sum(1 for c in e.values() if c.get('statut') == 'prêt à relire')} | {'oui' if os.path.exists(os.path.join(d, 'SUSPENDU.json')) else 'non'} |")
    o += ["\n## Exceptions carburant\n", "\n".join(f"- {x}" for x in exceptions) or "Aucune : toutes les communes rédigées ont des faits carburant utilisables.",
          *(["\nDonnées carburant plus fragiles, écrites comme telles :"] + [f"- {x}" for x in fragiles] if fragiles else []),
          f"\n## Articles corrigés pour une anomalie de niveau 1 : {len(niv1)}\n",
          "Un article peut avoir reçu plusieurs anomalies ; leur gravité varie (une recommandation explicite de quartier n'a pas le poids d'une invitation générale à examiner son trajet).\n"]
    o += [f"- {nom} ({kk}), {issue} : " + " ; ".join(x) for nom, kk, x, issue in niv1] or ["Aucune."]
    if faux:
        o += ["\nCorrections déclenchées seulement par un faux positif du contrôle (corrigé depuis ; l'appel a bien eu lieu et est compté) :"] + [f"- {x}" for x in faux]
    o += [f"\nNiveau 2 (noté, sans nouvelle génération) : {niv2} remarque(s), détail dans `relecture.anomalies.json` de chaque commune.",
          "\n## Jetons par outil et par étape\n",
          "Compteurs tels que chaque outil les rapporte, sans double compte : chez Codex, l'entrée inclut le cache et la sortie inclut le "
          "raisonnement ; chez Claude Code, l'entrée totale est la somme des entrées non mises en cache, écrites en cache et lues en cache, "
          "et la sortie inclut la réflexion. **Ces jetons ne mesurent pas la consommation du quota des abonnements**, que ni Codex ni "
          "Claude Code n'exposent.\n",
          "| Outil | Étape | Appels | Échecs ou refus | Entrée totale | dont cache lu | dont cache écrit | Sortie totale | dont raisonnement | Durée cumulée | Non mesurés |",
          "|---|---|---|---|---|---|---|---|---|---|---|"]
    for (outil, et), p in sorted(par.items()):
        o.append(f"| {outil} | {et} | {p['n']} | {p['echecs']} | {k(p['entree'])} | {k(p['cache_lu'])} | "
                 f"{k(p['cache_ecrit']) if outil != 'codex' else 'sans objet'} | {k(p['sortie'])} | {k(p['raisonnement'])}"
                 + (f" ({p['rais_nm']} non mesuré)" if p["rais_nm"] else "") + f" | {hm(p['duree'])} | {p['nm'] or ''} |")
    if any(e.startswith("collecte") for _, e in par):
        o.append("\nCollecte : entrée et sortie comprennent les lectures de pages que Claude Code confie à Haiku (modèle confirmé "
                 "dans le CSV) ; le raisonnement compté est celui de Sonnet seul, **celui de Haiku n'est pas rapporté : non mesuré**.")
    for outil, cle in (("Codex", "codex"), ("Claude", "claude")):
        v = sorted(x[cle] for x in pc.values())
        if v:
            pire = max(pc.items(), key=lambda kv: kv[1][cle])
            o.append(f"\n{outil}, par commune (entrée + sortie, hors collecte) : total {k(sum(v))}, médiane {k(int(statistics.median(v)))}, "
                     f"maximum {k(v[-1])} ({pire[1]['nom']}).")
    nm = sum(x["nm"] for x in pc.values())
    if nm:
        o.append(f"\n**{nm} appel(s) sans compteur : non mesurés** (détail dans le CSV).")
    d_ia = sorted(x["duree_ia"] for x in pc.values())
    o += ["\n## Durées\n",
          f"- Temps cumulé des traitements (préparation, collecte, rédaction, relecture, correction, visuels) : {hm(traitement)}.",
          f"- Par commune (hors collecte) : médiane {hm(statistics.median(d_ia))}, les trois plus longues : "
          + ", ".join(f"{x['nom']} {hm(x['duree_ia'])}" for x in sorted(pc.values(), key=lambda x: -x['duree_ia'])[:3]) + "." if d_ia else "",
          f"- Durée réelle de la campagne : {hm((fin - debut).total_seconds()) if debut and fin else NM} (du premier lancement à la dernière étape enregistrée)"
          + (f", dont pauses de quota : {hm(pauses)} (de la suspension à la reprise ; la limite se levait à l'heure annoncée par le message, la reprise dépend du pilote)." if pauses else " ; aucune pause de quota.")
          + (" Une pause est en cours." if ouverte else ""),
          f"- Interventions du terminal pilote : {sum(e['minutes'] for e in inter):g} min "
          f"({sum(e['minutes'] for e in inter if e['mesure'] == 'mesurée'):g} mesurées, {sum(e['minutes'] for e in inter if e['mesure'] == 'estimée'):g} estimées)."]
    o += [f"  - {e['t'][:16].replace('T', ' ')} UTC, {e['minutes']:g} min ({e['mesure']}) : {e['texte']}" for e in inter]
    if visuels_ko:
        o += ["\n## Visuels non produits\n"] + [f"- {x}" for x in visuels_ko]
    susp = [e for e in J if e["evt"] == "suspension"]
    if susp:
        o += ["\n## Suspensions\n"] + [f"- {e['t']} (lot {e['lot']}, {e['etape']}) : {e['message'][:400]}" for e in susp]
    open(os.path.join(CAMP, "BILAN.md"), "w").write("\n".join(o) + "\n")
    print(f"bilan : {total} communes distinctes ; {len(L)} lignes de mesure")


def main():
    p = argparse.ArgumentParser()
    s = p.add_subparsers(dest="cmd", required=True)
    x = s.add_parser("selection"); x.add_argument("--forcer", action="store_true")
    x = s.add_parser("preparer"); x.add_argument("lot", type=int, choices=range(1, NB_LOTS + 1))
    x = s.add_parser("produire"); x.add_argument("lot", type=int, choices=range(1, NB_LOTS + 1))
    x = s.add_parser("intervention"); x.add_argument("texte"); x.add_argument("--minutes", type=float, required=True); x.add_argument("--estime", action="store_true")
    s.add_parser("bilan")
    a = p.parse_args()
    {"selection": cmd_selection, "preparer": cmd_preparer, "produire": cmd_produire, "intervention": cmd_intervention, "bilan": cmd_bilan}[a.cmd](a)


if __name__ == "__main__":
    main()
