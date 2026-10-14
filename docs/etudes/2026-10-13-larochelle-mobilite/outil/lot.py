#!/usr/bin/env python3
"""lot.py — Production par lots des articles mobilité : une liste de communes → dossiers, rédactions, contrôles, visuels.

Réutilise la chaîne existante, sans la réécrire : fiche_mobilite.py (faits), comparaison_voiture.py (repère),
dossier_redaction.py (dossier autonome), controle_article.py (contrôle déterministe), generer_visuels.py (cartes).
La rédaction, la relecture et la correction passent par Claude Code (`claude -p`) ou Codex (`codex exec`), une session
VIERGE par commune et par étape : dossier vide hors du dépôt, aucun outil, aucune mémoire, aucun réglage utilisateur,
aucune session conservée. Le contexte ne contient que les consignes communes et le dossier de la commune.

    python outil/lot.py preparer lots/2026-10-lot-01          # gratuit : faits, repère, pré-complément, dossier
    python outil/lot.py collecter lots/2026-10-lot-01 [--executer]  # facultatif : collecte documentaire par réseau
    python outil/lot.py rediger  lots/2026-10-lot-01          # simulation : commandes et estimation, AUCUN appel
    python outil/lot.py rediger  lots/2026-10-lot-01 --executer   # appels réels (plafond de lot.json appliqué)
    python outil/lot.py etat     lots/2026-10-lot-01

Reprise : chaque étape réussie est enregistrée dans etat.json avec l'empreinte de ses entrées ; une relance la saute.
Un appel de génération écrit un marqueur AVANT de partir : s'il n'a pas de réponse enregistrée (coupure), la relance
ne le renvoie pas et signale la commune « à relire » (appel possiblement consommé). Un verrou empêche deux lancements.
Une erreur sur une commune est enregistrée et n'arrête pas les autres. Aucune boucle : au plus une correction.

États d'une commune : à préparer, dossier prêt, rédigé, à corriger, prêt à relire, données insuffisantes.
Aucun état ne vaut autorisation de publication.
"""
import argparse, datetime as dt, gzip, hashlib, json, os, re, shutil, subprocess, sys, tempfile, time, zipfile, urllib.parse, urllib.request

ICI = os.path.dirname(os.path.abspath(__file__))
ETUDE = os.path.dirname(ICI)
ETATS = ("à préparer", "dossier prêt", "rédigé", "à corriger", "prêt à relire", "données insuffisantes")
ORIGINE_VOISINES = "automatique : communes de la même unité urbaine, au plus les 6 plus peuplées (REPRODUCTIBILITE.md §3)"


def maintenant():
    return dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def sha(*parts):
    h = hashlib.sha256()
    for p in parts:
        h.update(p if isinstance(p, bytes) else str(p).encode())
    return h.hexdigest()[:16]


def sha_fichier(p):
    return sha(open(p, "rb").read()) if os.path.exists(p) else None


def racine_depot():
    """Le checkout principal (data/ y vit) : parent du dossier git commun, même depuis un worktree."""
    commun = subprocess.run(["git", "rev-parse", "--git-common-dir"], cwd=ETUDE, capture_output=True, text=True).stdout.strip()
    return os.path.dirname(os.path.abspath(os.path.join(ETUDE, commun)))


class Lot:
    def __init__(self, dossier):
        self.dir = os.path.abspath(dossier)
        self.conf = json.load(open(os.path.join(self.dir, "lot.json")))
        self.racine = racine_depot()
        self.p_etat = os.path.join(self.dir, "etat.json")
        self.etat = json.load(open(self.p_etat)) if os.path.exists(self.p_etat) else {"communes": {}, "journal": []}

    def chemin(self, cle):
        p = self.conf["chemins"][cle].replace("<checkout>", self.racine)
        return p if os.path.isabs(p) else os.path.join(self.racine, p)

    def sauver(self):
        tmp = self.p_etat + ".tmp"
        json.dump(self.etat, open(tmp, "w"), ensure_ascii=False, indent=1)
        os.replace(tmp, self.p_etat)

    def c(self, insee):
        return self.etat["communes"][insee]

    def rep(self, insee, *sous):
        p = os.path.join(self.dir, insee, *sous)
        os.makedirs(os.path.dirname(p) if "." in os.path.basename(p) else p, exist_ok=True)
        return p


# ── Résolution des communes (données de référence : index du comparateur, aucun code deviné) ─────────────
def resoudre(lot):
    idx = json.load(gzip.open(lot.chemin("index")))["communes"]
    res = []
    for ligne in lot.conf["communes"]:
        m = re.match(r"^\s*(.+?)\s*(?:\((\w{2,3})\))?\s*$", ligne)
        nom, dep = m.group(1), m.group(2)
        if re.fullmatch(r"\d[\dAB]\d{3}", nom):
            cand = [c for c in idx if c["insee"] == nom]
        else:
            cand = [c for c in idx if c["nom"] == nom and (dep is None or c["dept"] == dep)]
        if len(cand) == 1:
            res.append((ligne, cand[0]["insee"], cand[0]["nom"], None))
        elif not cand:
            res.append((ligne, None, nom, "commune introuvable dans l'index : vérifier l'orthographe"))
        else:
            res.append((ligne, None, nom, "homonymes (" + ", ".join(f"{c['insee']} ({c['dept']})" for c in cand) + ") : préciser « Nom (département) »"))
    return res


# ── Étapes gratuites ─────────────────────────────────────────────────────────────────────────────────
def lancer(cmd, journal):
    t0 = time.time()
    r = subprocess.run(cmd, cwd=ETUDE, capture_output=True, text=True)
    open(journal, "w").write(f"$ {' '.join(cmd)}\n\n{r.stdout}\n{r.stderr}")
    if r.returncode:
        raise RuntimeError((r.stderr or r.stdout).strip().splitlines()[-1] if (r.stderr or r.stdout).strip() else f"code {r.returncode}")
    return round(time.time() - t0, 1)


def etape(lot, insee, nom, fonction, refaire=()):
    """Exécute une étape si elle n'a pas déjà réussi ; mesure sa durée ; enregistre l'erreur sans arrêter le lot."""
    E = lot.c(insee)["etapes"]
    if E.get(nom, {}).get("ok") and nom not in refaire:
        return True
    t0 = time.time()
    try:
        info = fonction() or {}
        E[nom] = {"ok": True, "fin": maintenant(), "duree_s": round(time.time() - t0, 1), **info}
        ok = True
    except Exception as e:  # une commune en échec n'arrête pas le lot
        E[nom] = {"ok": False, "fin": maintenant(), "duree_s": round(time.time() - t0, 1), "erreur": str(e)[:500]}
        ok = False
    lot.sauver()
    return ok


def sans_accents(s):
    import unicodedata
    return re.sub(r"[^a-z0-9]+", " ", unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode().lower()).strip()


def pre_complement(lot, insee, fiche):
    """Complément documentaire automatique et gratuit : identité du réseau urbain (transport.data.gouv.fr, Point d'accès
    national) et site déclaré dans ses horaires publiés (GTFS agency.txt). Mutualisé par réseau. Rien n'est attribué à la
    commune au-delà de ce que la source dit (couverture : l'intercommunalité)."""
    cache = lot.chemin("cache")
    epci = (fiche["commune"].get("epci") or {})
    tdg = json.load(open(os.path.join(cache, "tdg_gtfs.json")))
    cand = [x for x in tdg if any(c.get("type") == "epci" and c.get("insee") == epci.get("code") for c in x.get("covered_area", []))
            and "urban" in (x.get("sub_types") or [])]
    jour = dt.date.today().isoformat()
    faits, recherches, reseau = [], [], None
    if len(cand) == 1:
        x = cand[0]
        p_res = os.path.join(lot.dir, "reseaux", f"{x['id']}.json")
        os.makedirs(os.path.dirname(p_res), exist_ok=True)
        if os.path.exists(p_res):
            reseau = json.load(open(p_res))
        else:
            offre = (x.get("offers") or [{}])[0]
            aom = ", ".join(o["name"] for o in x.get("legal_owners", []) if o.get("type") == "aom") or offre.get("nom_aom") or epci.get("nom")
            agence = {}
            z = os.path.join(cache, f"gtfs_{epci.get('code')}.zip")
            if os.path.exists(z):
                with zipfile.ZipFile(z) as f:
                    if "agency.txt" in f.namelist():
                        import csv, io
                        rows = list(csv.DictReader(io.TextIOWrapper(f.open("agency.txt"), encoding="utf-8-sig")))
                        agence = {"agences": sorted({(r.get("agency_name", "").strip(), r.get("agency_url", "").strip()) for r in rows})}
            # Un site n'est attribué au réseau que si le nom de l'agence correspond à son nom commercial : un GTFS peut
            # mêler réseau régional, exploitant ou services voisins (une URL d'exploitant n'est pas le site du réseau).
            nc = sans_accents(offre.get("nom_commercial") or x["title"])
            corresp = [(n, u) for n, u in agence.get("agences", []) if u and n and (sans_accents(n) in nc or nc in sans_accents(n))]
            agence["retenue"] = corresp[0] if len({u for _, u in corresp}) == 1 else None
            accessibles = []
            for u in ([agence["retenue"][1]] if agence["retenue"] else []):
                try:
                    with urllib.request.urlopen(urllib.request.Request(u, headers={"User-Agent": "futur-e-lot/1.0"}), timeout=15) as r:
                        accessibles.append((u, r.status))
                except Exception as e:
                    accessibles.append((u, f"inaccessible ({type(e).__name__})"))
            reseau = {"id": x["id"], "titre": x["title"], "page": x["page_url"], "nom_commercial": offre.get("nom_commercial") or x["title"],
                      "aom": aom, "epci": epci, "mis_a_jour": (x.get("updated") or "")[:10], "agence": agence,
                      "sites_controles": accessibles, "consulte_le": jour}
            json.dump(reseau, open(p_res, "w"), ensure_ascii=False, indent=1)
        faits.append({"id": "doc.reseau.identite",
                      "information": f"Le réseau de transport urbain publié pour l'intercommunalité {epci.get('nom')} est « {reseau['nom_commercial']} » (autorité organisatrice : {reseau['aom']}).",
                      "source": f"transport.data.gouv.fr (Point d'accès national aux données de transport), jeu « {reseau['titre']} » : {reseau['page']}",
                      "consulte_le": reseau["consulte_le"], "validite": f"jeu de données mis à jour le {reseau['mis_a_jour']}",
                      "perimetre": f"intercommunalité {epci.get('nom')} ; la desserte de chaque commune et de chaque adresse n'est pas établie par cette source",
                      "usage": "oui", "statut_verification": "vérifié",
                      "consigne": "Ne dit ni quelles lignes passent dans la commune, ni à quelle fréquence, ni à quel tarif."})
        ok_sites = [u for u, s in reseau["sites_controles"] if s == 200]
        if ok_sites:
            faits.append({"id": "doc.reseau.site",
                          "information": f"Le site indiqué par le réseau dans ses horaires publiés est {ok_sites[0]}.",
                          "source": f"horaires théoriques du réseau (GTFS, fichier agency.txt), publiés sur {reseau['page']} ; site joint le {reseau['consulte_le']}",
                          "consulte_le": reseau["consulte_le"], "validite": "non précisée", "perimetre": f"réseau {reseau['nom_commercial']}",
                          "usage": "oui", "statut_verification": "vérifié",
                          "consigne": "Pour renvoyer le lecteur vérifier son trajet et ses horaires ; ne dit rien de la desserte."})
        else:
            recherches.append({"sujet": "site officiel du réseau", "statut": "inaccessible" if reseau["sites_controles"] else "non vérifié",
                               "source": reseau["page"], "consulte_le": reseau["consulte_le"],
                               "note": "; ".join(f"{u} : {s}" for u, s in reseau["sites_controles"]) or
                               "agences du GTFS sans correspondance univoque avec le nom du réseau : " + "; ".join(f"{n} ({u})" for n, u in reseau["agence"].get("agences", []))[:300]})
    else:
        recherches.append({"sujet": "réseau de transport urbain", "statut": "introuvable" if not cand else "non vérifié",
                           "source": "transport.data.gouv.fr", "consulte_le": jour,
                           "note": f"{len(cand)} jeu(x) urbain(s) couvrant l'intercommunalité {epci.get('code')} : identification à faire à la main"})
    col = (reseau or {}).get("collecte") if len(cand) == 1 else None
    if col:
        for f in col["faits"]:
            faits.append({"id": f["id"], "information": f["information"], "source": f"{f['url']} (extrait vérifié le {f['verifie_le'][:10]} : « {f['extrait']} »)",
                          "consulte_le": col["date"], "validite": f.get("validite") or "non précisée",
                          "perimetre": f"réseau {reseau['nom_commercial']} ; {f.get('perimetre') or 'périmètre non précisé'} ; application à chaque commune non établie",
                          "usage": f.get("usage") if f.get("usage") in ("oui", "avec ses conditions") else "avec ses conditions",
                          "statut_verification": "vérifié", "justificatif": {"url": f["url"], "extrait": f["extrait"]}})
        recherches += [{"sujet": r.get("sujet", ""), "statut": r.get("statut") if r.get("statut") in ("introuvable", "inaccessible", "non vérifié") else "non vérifié",
                        "source": r.get("url", ""), "consulte_le": col["date"], "note": r.get("note", "")} for r in col["recherches"]]
    for sujet, motif in (("tarification (gratuité, abonnements, exceptions)", r"tarif|gratu|abonn|prix"),
                         ("jours et périodes de circulation des lignes urbaines", r"dimanche|férié|circul|jour"),
                         ("calcul d'itinéraire ou fiches horaires officielles", r"itin|horaire|trajet|temps réel"),
                         ("vélo ou gare (seulement si directement utile au logement)", None)):
        couvert = col and motif and any(re.search(motif, f["information"], re.I) for f in faits if f["id"].startswith("doc.") and f["id"] not in ("doc.reseau.identite", "doc.reseau.site"))
        if couvert:
            continue
        recherches.append({"sujet": sujet, "statut": "introuvable" if col and motif else "non recherché", "source": "", "consulte_le": col["date"] if col else "",
                           "note": "rien de vérifiable trouvé lors de la collecte ; l'absence d'information ne veut pas dire absence de service" if col and motif
                           else "collecte automatique non lancée ; à rechercher sur les sources officielles (COMPLEMENT_DOCUMENTAIRE.md)"})
    return {"commune": insee, "consulte_le": jour, "origine": "automatique",
            "sources_officielles": ["https://transport.data.gouv.fr"], "faits": faits, "recherches": recherches, "ecartes": []}


def preparer_commune(lot, insee, refaire):
    py = lot.chemin("python")
    d_fiche, d_doss = lot.rep(insee, "fiche"), lot.rep(insee, "dossier")
    fiche_p = os.path.join(d_fiche, "fiche.json")
    j = lambda n: os.path.join(lot.rep(insee, "journaux"), f"{n}.log")
    if not etape(lot, insee, "fiche", lambda: {"duree_calcul_s": lancer(
            [py, "outil/fiche_mobilite.py", "--insee", insee, "--jour", lot.conf["jour_reference"], "--out", d_fiche,
             "--cache", lot.chemin("cache"), "--mobpro", lot.chemin("mobpro"), "--bpe", lot.chemin("bpe"), "--index", lot.chemin("index")], j("fiche"))}, refaire):
        return
    fiche = json.load(open(fiche_p))
    F = {f["id"]: f for f in fiche["faits"]}
    if "mobpro.modes" not in F or not (F["mobpro.modes"].get("valeur") or {}):
        lot.c(insee).update(statut="données insuffisantes", motif="pas de pratiques domicile-travail exploitables (MOBPRO)")
        return
    etape(lot, insee, "comparaison", lambda: {"duree_calcul_s": lancer(
        [py, "outil/comparaison_voiture.py", "--insee", insee, "--mobpro", lot.chemin("mobpro"), "--index", lot.chemin("index"),
         "--out", os.path.join(d_fiche, "comparaison_voiture.json")], j("comparaison"))}, refaire)

    def complement():
        p = os.path.join(d_doss, "complement.json")
        if os.path.exists(p) and json.load(open(p)).get("origine") != "automatique":
            return {"note": "complément manuel conservé"}
        json.dump(pre_complement(lot, insee, fiche), open(p, "w"), ensure_ascii=False, indent=1)
        return {}
    etape(lot, insee, "complement", complement, refaire)
    comp_sha = sha_fichier(os.path.join(d_doss, "complement.json"))
    if lot.c(insee)["etapes"].get("dossier", {}).get("complement_sha") != comp_sha:
        refaire = refaire | {"dossier"}  # le complément a changé : le dossier se régénère
    if not etape(lot, insee, "dossier", lambda: {"complement_sha": comp_sha, "duree_calcul_s": lancer(
            [py, "outil/dossier_redaction.py", "--fiche", fiche_p, "--out", d_doss, "--origine-voisines", ORIGINE_VOISINES], j("dossier")),
            "dossier_sha": sha_fichier(os.path.join(d_doss, "dossier.md"))}, refaire):
        return
    iris_hab = [r for r in fiche["tableaux"].get("iris") or [] if r.get("TYP_IRIS") == "H"]
    c = lot.c(insee)
    c["manuel"] = ["compléter le complément documentaire (tarifs, jours de circulation, où vérifier) : collecte non lancée",
                   "relire les libellés d'IRIS cités comme noms de quartiers", "relire l'intérêt du groupe de communes voisines (liste automatique)",
                   "réextraire les prix du carburant avant publication", "relecture humaine avant toute publication"]
    c["notes"] = [f"{len(iris_hab)} secteurs d'habitat (IRIS)" if len(iris_hab) >= 2 else "commune non découpée en IRIS d'habitat : pas de carte par secteur"]
    if c.get("statut") in (None, "à préparer"):
        c["statut"] = "dossier prêt"


def cmd_preparer(lot, a):
    refaire = set(a.refaire.split(",")) if a.refaire else set()
    for ligne, insee, nom, err in resoudre(lot):
        cle = insee or f"?{nom}"
        C = lot.etat["communes"].setdefault(cle, {"nom": nom, "insee": insee, "demande": ligne, "statut": "à préparer", "etapes": {}})
        if err:
            C.update(statut="à préparer", motif=err); lot.sauver(); print(f"✗ {ligne} : {err}"); continue
        if a.communes and insee not in a.communes.split(",") and nom not in a.communes.split(","):
            continue
        t0 = time.time()
        preparer_commune(lot, insee, refaire)
        C["duree_preparation_s"] = round(sum(e.get("duree_s", 0) for e in C["etapes"].values()), 1)
        lot.sauver()
        err = [f"{k} : {e['erreur']}" for k, e in C["etapes"].items() if not e.get("ok")]
        print(f"{'✓' if not err else '✗'} {nom} ({insee}) · {C['statut']} · {round(time.time() - t0)} s" + (f" · {err}" if err else ""))
    vue(lot)


# ── Génération par Claude Code ou Codex : une session vierge par appel ─────────────────────────────────────
class PlafondAtteint(Exception):
    pass


class LimiteUsage(Exception):
    """Limite d'usage de l'abonnement atteinte : on arrête proprement, sans nouvelle tentative."""


class AuthNonAbonnement(Exception):
    """La session ne tourne pas sur l'abonnement claude.ai : arrêt immédiat du lot (aucune clé API, aucun autre fournisseur)."""


# Variables qui feraient basculer Claude Code vers une clé API ou un autre fournisseur : retirées de chaque session.
ENV_INTERDITES = ("ANTHROPIC_API_KEY", "ANTHROPIC_AUTH_TOKEN", "ANTHROPIC_BASE_URL", "ANTHROPIC_MODEL", "CLAUDE_CODE_USE_BEDROCK",
                  "CLAUDE_CODE_USE_VERTEX", "CLAUDE_CODE_USE_FOUNDRY", "ANTHROPIC_PROFILE", "OPENAI_API_KEY")


def pieces_justificatives(lot, insee):
    """Pièces référencées par le dossier, copiées en lecture seule dans la session : complément documentaire, repère de
    comparaison, fiches des réseaux (extraits vérifiés). PAS la fiche brute ni dossier.json : ils contiennent les valeurs de
    bus en attente de validation, qui ne doivent pas atteindre le rédacteur."""
    P = []
    for rel in ("dossier/complement.json", "fiche/comparaison_voiture.json"):
        p = os.path.join(lot.dir, insee, rel)
        if os.path.exists(p):
            P.append(p)
    comp = os.path.join(lot.dir, insee, "dossier", "complement.json")
    if os.path.exists(comp):
        src = " ".join(f["source"] for f in json.load(open(comp)).get("faits", []))
        for fn in sorted(os.listdir(os.path.join(lot.dir, "reseaux"))) if os.path.isdir(os.path.join(lot.dir, "reseaux")) else []:
            if fn.endswith(".json") and json.load(open(os.path.join(lot.dir, "reseaux", fn)))["page"] in src:
                P.append(os.path.join(lot.dir, "reseaux", fn))
    return P


def depense_cumulee(lot):
    p = os.path.join(lot.dir, "depenses.jsonl")
    return sum(json.loads(l).get("cout_usd_equivalent") or 0 for l in open(p)) if os.path.exists(p) else 0.0


def generer(lot, insee, etape_nom, systeme, utilisateur, executer, d=None, domaines=None, pieces=()):
    """Un appel = une session vierge. Retourne le texte produit, ou None en simulation. `domaines` : seule la lecture de
    pages de ces domaines est autorisée (collecte) ; sinon aucun outil."""
    M = lot.conf["moteur"]; reglage = M["etapes"][etape_nom]
    d = d or lot.rep(insee, "generation"); os.makedirs(d, exist_ok=True)
    cle = sha(M["outil"], reglage, systeme, utilisateur, domaines)
    p_meta, p_sortie, p_marq = (os.path.join(d, f"{etape_nom}.json"), os.path.join(d, f"{etape_nom}.md"), os.path.join(d, f"{etape_nom}.en_cours"))
    if os.path.exists(p_meta):
        # Limite explicite : UN appel par commune et par étape (une collecte par réseau). Déjà fait, même avec des entrées
        # modifiées depuis : on réutilise ; un appel échoué n'est pas retenté automatiquement.
        if os.path.exists(p_sortie):
            return open(p_sortie).read()
        raise RuntimeError(f"« {etape_nom} » déjà tenté sans résultat ({json.load(open(p_meta)).get('motif', 'voir ' + p_meta)}) : pas de nouvelle tentative automatique")
    if os.path.exists(p_marq):
        raise RuntimeError(f"un appel « {etape_nom} » est parti sans réponse enregistrée ({open(p_marq).read().strip()}) : "
                           "vérifier à la main, puis supprimer le marqueur pour relancer")
    par_appel = float(reglage.get("plafond_appel_usd", 3))
    tmp = tempfile.mkdtemp(prefix="futuree-lot-")  # dossier vide hors du dépôt : ni CLAUDE.md, ni mémoire, ni fichiers
    sys_p = os.path.join(tmp, "consignes.md"); open(sys_p, "w").write(systeme)
    noms_pieces = []
    if pieces:
        os.makedirs(os.path.join(tmp, "pieces"))
        for p in pieces:
            q = os.path.join(tmp, "pieces", os.path.basename(p)); shutil.copy(p, q); os.chmod(q, 0o444); noms_pieces.append(os.path.basename(p))
        utilisateur += ("\n\n---\n\nPièces justificatives référencées par le dossier, en lecture seule dans ./pieces/ : "
                        + ", ".join(noms_pieces) + ". Tu peux les lire pour vérifier une source ; elles n'apportent aucun fait "
                        "qui ne soit déjà dans le dossier, et ne t'autorisent ni recherche extérieure ni autre fichier.")
    if M["outil"] == "claude-code":
        if domaines:
            outils = ["--tools", "WebFetch", "--allowedTools", ",".join(f"WebFetch(domain:{x})" for x in domaines)]
        elif pieces:
            outils = ["--tools", "Read,Glob", "--allowedTools", "Read(./pieces/**),Glob(./pieces/**)",
                      "--disallowedTools", "Read(//Users/**),Read(~/**),Glob(//Users/**)"]
        else:
            outils = ["--tools", ""]
        cmd = ["claude", "-p", "--model", reglage["modele"], "--effort", reglage.get("effort", "high"),
               "--system-prompt-file", sys_p, "--strict-mcp-config", "--setting-sources", "project", "--permission-mode", "dontAsk",
               *outils, "--no-session-persistence", "--output-format", "stream-json", "--verbose", "--max-budget-usd", str(par_appel)]
    elif M["outil"] == "codex" and domaines:
        raise RuntimeError("collecte : seul Claude Code permet de limiter la lecture web à des domaines ; utiliser moteur claude-code")
    elif M["outil"] == "codex":
        out = os.path.join(tmp, "sortie.md")
        utilisateur = f"{systeme}\n\n---\n\n{utilisateur}"  # codex exec n'a pas de prompt système séparé
        cmd = ["codex", "exec", "--ephemeral", "--ignore-user-config", "--ignore-rules", "--skip-git-repo-check",
               "-s", "read-only", "-C", tmp, "-m", reglage["modele"], "-o", out, "-"]
    else:
        raise RuntimeError(f"moteur inconnu : {M['outil']}")
    if not executer:
        shutil.rmtree(tmp)
        return None
    version = subprocess.run([cmd[0], "--version"], capture_output=True, text=True).stdout.strip()
    env = {k: v for k, v in os.environ.items() if k not in ENV_INTERDITES}
    open(p_marq, "w").write(f"{maintenant()} clé {cle}")
    t0 = time.time()
    try:
        r = subprocess.run(cmd, cwd=tmp, input=utilisateur, capture_output=True, text=True, env=env, timeout=int(reglage.get("delai_s", 1800)))
    except subprocess.TimeoutExpired:
        json.dump({"etape": etape_nom, "cle": cle, "motif": "délai dépassé", "debut": maintenant()}, open(p_meta, "w"), ensure_ascii=False)
        os.remove(p_marq); shutil.rmtree(tmp, ignore_errors=True)
        raise RuntimeError(f"« {etape_nom} » : délai dépassé ({reglage.get('delai_s', 1800)} s)")
    duree = round(time.time() - t0, 1)
    meta = {"etape": etape_nom, "cle": cle, "outil": M["outil"], "version_outil": version, "modele": reglage["modele"],
            "effort": reglage.get("effort"), "consignes_sha": sha(systeme), "entree_sha": sha(utilisateur), "debut": maintenant(),
            "duree_s": duree, "code_retour": r.returncode}
    texte, cout = None, None
    if M["outil"] == "claude-code":
        ev = []
        for l in r.stdout.splitlines():
            try:
                ev.append(json.loads(l))
            except json.JSONDecodeError:
                pass
        init = next((e for e in ev if e.get("type") == "system" and e.get("subtype") == "init"), {})
        res = next((e for e in reversed(ev) if e.get("type") == "result"), {})
        appels = [{"outil": b.get("name"), "entree": json.dumps(b.get("input"), ensure_ascii=False)[:200]}
                  for e in ev if e.get("type") == "assistant" for b in (e.get("message") or {}).get("content", []) if b.get("type") == "tool_use"]
        refus = [e for e in ev if e.get("type") == "user" and "denied" in json.dumps(e).lower()]
        texte, cout = res.get("result"), res.get("total_cost_usd")
        meta.update(session=res.get("session_id"), usage=res.get("usage"), cout_usd_equivalent=cout, est_erreur=res.get("is_error"),
                    sous_type=res.get("subtype"), modele_effectif=list((res.get("modelUsage") or {}).keys()), tours=res.get("num_turns"),
                    contexte={"source_auth": init.get("apiKeySource"), "outils": init.get("tools"), "mcp": init.get("mcp_servers"),
                              "modele": init.get("model"), "cwd": init.get("cwd"), "permissions": init.get("permissionMode"),
                              "memoire_projet": init.get("memory_paths"), "plugins": init.get("plugins"), "pieces": noms_pieces},
                    appels_outils=appels, refus=len(refus))
        if not ev:
            meta["sortie_brute"] = (r.stdout + r.stderr)[-2000:]
    else:
        texte = open(out).read() if os.path.exists(out) else None
        meta["sortie_brute"] = r.stderr[-2000:]
    shutil.rmtree(tmp, ignore_errors=True)
    with open(os.path.join(lot.dir, "depenses.jsonl"), "a") as f:
        f.write(json.dumps({"date": maintenant(), "commune": insee, "etape": etape_nom, "outil": M["outil"], "modele": reglage["modele"],
                            "cout_usd_equivalent": cout, "duree_s": duree, "cle": cle}, ensure_ascii=False) + "\n")
    brut = ((texte or "") + r.stderr + json.dumps(meta.get("sortie_brute", ""))).lower()
    if M["outil"] == "claude-code" and meta.get("contexte", {}).get("source_auth") not in (None, "none"):
        meta["motif"] = f"session hors abonnement (source d'authentification : {meta['contexte']['source_auth']})"
    elif (not texte or meta.get("est_erreur")) and re.search(r"usage limit|rate limit|limit reached|reached your|quota|429|overloaded", brut):
        meta["motif"] = "limite d'usage"
    json.dump(meta, open(p_meta, "w"), ensure_ascii=False, indent=1)
    os.remove(p_marq)
    if meta.get("motif", "").startswith("session hors abonnement"):
        raise AuthNonAbonnement(meta["motif"])
    if meta.get("motif") == "limite d'usage":
        raise LimiteUsage(f"« {etape_nom} » : {(texte or r.stderr or '')[:200]}")
    if not texte or r.returncode or meta.get("est_erreur"):
        raise RuntimeError(f"génération « {etape_nom} » sans texte exploitable (code {r.returncode}, {meta.get('sous_type')})")
    open(p_sortie, "w").write(texte)
    return texte


def texte_page(url):
    import html as H
    with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "futur-e-lot/1.0"}), timeout=20) as r:
        brut = r.read().decode(r.headers.get_content_charset() or "utf-8", errors="replace")
    brut = re.sub(r"<script[\s\S]*?</script>|<style[\s\S]*?</style>", " ", brut)
    return norm_txt(H.unescape(re.sub(r"<[^>]+>", " ", brut)))


def norm_txt(s):
    return re.sub(r"\s+", " ", s.replace("\u2019", "'").replace("\u00a0", " ").replace("\u202f", " ")).strip().lower()


def domaine(u):
    return re.sub(r"^www\.", "", urllib.parse.urlparse(u).netloc.lower())


def cmd_collecter(lot, a):
    """Collecte documentaire par réseau (mutualisée), puis vérification déterministe de chaque extrait sur sa page."""
    syst = open(os.path.join(ETUDE, "redaction", "COLLECTE.md")).read()
    reseaux = {}
    for insee, C in lot.etat["communes"].items():
        p = os.path.join(lot.dir, insee, "dossier", "complement.json")
        if C.get("insee") and os.path.exists(p) and (not a.communes or insee in a.communes.split(",")):
            for f in json.load(open(p))["faits"]:
                if f["id"] == "doc.reseau.identite":
                    rid = re.search(r"datasets/([^ ]+)", f["source"])
                    for fn in sorted(f for f in os.listdir(os.path.join(lot.dir, "reseaux")) if f.endswith(".json")):
                        R = json.load(open(os.path.join(lot.dir, "reseaux", fn)))
                        if R["page"] in f["source"]:
                            reseaux.setdefault(R["id"], (R, []))[1].append(insee)
    for rid, (R, communes) in reseaux.items():
        sites = [u for u, st in R.get("sites_controles", []) if st == 200]
        if not sites:
            print(f"· {R['nom_commercial']} : aucun site joignable, collecte impossible"); continue
        doms = sorted({domaine(u) for u in sites} | {"www." + domaine(u) for u in sites})
        user = (f"Réseau : {R['nom_commercial']}\nAutorité organisatrice : {R['aom']}\nIntercommunalité : {R['epci'].get('nom')}\n"
                f"Site officiel : {sites[0]}\nDate du jour : {dt.date.today().isoformat()}")
        if a.executer and not lot.conf.get("execution_autorisee"):
            sys.exit("execution_autorisee absent de lot.json : aucun appel")
        if not a.executer:
            print(f"SIMULATION · collecte {R['nom_commercial']} ({', '.join(doms)}) pour {len(communes)} commune(s)"); continue
        try:
            texte = generer(lot, communes[0], "collecte", syst, user, True, d=os.path.join(lot.dir, "reseaux", rid), domaines=doms)
        except (PlafondAtteint, LimiteUsage, AuthNonAbonnement) as e:
            print(f"■ arrêt propre de la collecte : {e}"); break
        except Exception as e:
            print(f"✗ collecte {R['nom_commercial']} : {e}"); continue
        res = json_dans(texte)
        faits, rech = [], list(res.get("recherches", []))
        for f in res.get("faits", []):
            u = f.get("url", "")
            if domaine(u) not in {domaine(x) for x in sites}:
                rech.append({"sujet": f.get("information", "")[:80], "statut": "non vérifié", "url": u, "note": "URL hors du domaine officiel"}); continue
            try:
                trouve = norm_txt(f.get("extrait", "")) in texte_page(u) and len(f.get("extrait", "")) >= 20
            except Exception as e:
                rech.append({"sujet": f.get("information", "")[:80], "statut": "inaccessible", "url": u, "note": type(e).__name__}); continue
            if trouve:
                faits.append({**f, "statut_verification": "vérifié", "verifie_le": maintenant()})
            else:
                rech.append({"sujet": f.get("information", "")[:80], "statut": "non vérifié", "url": u, "note": "extrait introuvable sur la page"})
        R["collecte"] = {"date": dt.date.today().isoformat(), "faits": faits, "recherches": rech}
        json.dump(R, open(os.path.join(lot.dir, "reseaux", f"{rid}.json"), "w"), ensure_ascii=False, indent=1)
        print(f"✓ {R['nom_commercial']} : {len(faits)} information(s) vérifiée(s), {len(rech)} recherche(s) sans résultat vérifié")
        for insee in communes:
            preparer_commune(lot, insee, {"complement"}); lot.sauver()
    vue(lot)


def json_dans(texte):
    m = re.search(r"\{[\s\S]*\}", texte or "")
    return json.loads(m.group(0)) if m else {"anomalies": [{"categorie": "format", "gravite": "bloquante", "probleme": "relecture illisible"}]}


def controle(lot, insee, nom_fichier):
    d = lot.rep(insee, "generation")
    sys.path.insert(0, ICI)
    from controle_article import controler
    A, nature = controler(json.load(open(os.path.join(lot.dir, insee, "dossier", "dossier.json"))), open(os.path.join(d, nom_fichier)).read())
    res = {"nature": nature, "anomalies": A, "bloquantes": sum(1 for x in A if x["gravite"] == "bloquante")}
    json.dump(res, open(os.path.join(d, nom_fichier.replace(".md", ".controle.json")), "w"), ensure_ascii=False, indent=1)
    return res


def visuels(lot, insee, texte):
    """Seulement les visuels annoncés par l'article retenu. Carte : repères numérotés pour les secteurs cités (aucun placement manuel)."""
    if not re.search(r"^\[(?:VISUEL|CARTE|GRAPHIQUE)", texte, re.M):
        return {"visuels": []}
    fiche_p = os.path.join(lot.dir, insee, "fiche", "fiche.json")
    codes = sorted(set(re.findall(r"`iris\.(\d{9})\.", texte)), key=texte.index)
    veut_barres = bool(re.search(r"^\[(?:VISUEL|GRAPHIQUE)[^\]]*(lieu de travail|commune de travail|travailler)", texte, re.M | re.I))
    cmd = [lot.chemin("python"), "visuels/generer_visuels.py", "--insee", insee, "--fiche", fiche_p,
           "--contours", os.path.join(lot.chemin("cache"), f"iris_ign_{insee}.json"), "--classes", "auto", "--communes", "",
           "--reperes", ",".join(codes), "--out", lot.rep(insee, "visuels")] + ([] if veut_barres else ["--sans-barres"])
    lancer(cmd, os.path.join(lot.rep(insee, "journaux"), "visuels.log"))
    return {"visuels": sorted(os.listdir(lot.rep(insee, "visuels"))), "reperes": codes}


def rediger_commune(lot, insee, executer, plan):
    C = lot.c(insee)
    if C["statut"] not in ("dossier prêt", "rédigé", "à corriger"):
        return
    R = os.path.join(ETUDE, "redaction")
    dossier = open(os.path.join(lot.dir, insee, "dossier", "dossier.md")).read()
    prompt, relec, corr = (open(os.path.join(R, f)).read() for f in ("PROMPT_REDACTION.md", "RELECTURE.md", "CORRECTION.md"))
    C["versions"] = {"prompt_redaction": sha(prompt), "relecture": sha(relec), "correction": sha(corr), "dossier": sha(dossier),
                     "moteur": lot.conf["moteur"]["outil"], "modeles": {k: v["modele"] for k, v in lot.conf["moteur"]["etapes"].items()}}
    if not executer:
        plan.append((insee, len(prompt) + len(dossier)))
        return
    pj = pieces_justificatives(lot, insee)
    texte = generer(lot, insee, "redaction", prompt, f"Dossier de la commune (dossier.md) :\n\n{dossier}", True, pieces=pj)
    C["statut"] = "rédigé"; lot.sauver()
    ctl = controle(lot, insee, "redaction.md")
    if ctl["nature"] == "non_publication":
        C.update(statut="prêt à relire", motif="recommandation de ne pas publier (section de décision)"); lot.sauver(); return
    rel = json_dans(generer(lot, insee, "relecture", relec,
                            f"Dossier (dossier.md) :\n\n{dossier}\n\n---\n\nRendu de la rédaction :\n\n{texte}", True, pieces=pj))
    json.dump(rel, open(os.path.join(lot.rep(insee, "generation"), "relecture.anomalies.json"), "w"), ensure_ascii=False, indent=1)
    bloq = [a for a in ctl["anomalies"] if a["gravite"] == "bloquante"] + [a for a in rel.get("anomalies", []) if a.get("gravite") == "bloquante"]
    final = "redaction.md"
    if bloq:
        C["statut"] = "à corriger"; lot.sauver()
        generer(lot, insee, "correction", corr, f"Dossier (dossier.md) :\n\n{dossier}\n\n---\n\nRendu de la rédaction :\n\n{texte}"
                f"\n\n---\n\nAnomalies :\n\n{json.dumps(bloq + [a for a in rel.get('anomalies', []) if a.get('gravite') != 'bloquante'], ensure_ascii=False, indent=1)}", True)
        final = "correction.md"
        apres = controle(lot, insee, "correction.md")
        C["anomalies_restantes"] = apres["anomalies"]
        C["motif"] = (f"{apres['bloquantes']} anomalie(s) déterministe(s) après la correction unique" if apres["bloquantes"]
                      else "corrigé une fois ; vérifier que les anomalies de relecture sont traitées (section E)")
    C["article"] = final
    C["visuels"] = visuels(lot, insee, open(os.path.join(lot.rep(insee, "generation"), final)).read())
    C["statut"] = "prêt à relire"; lot.sauver()


def cmd_controler(lot, a):
    """Relance le contrôle déterministe (gratuit) sur les articles déjà produits et met à jour leur motif."""
    for insee, C in lot.etat["communes"].items():
        if C.get("article") and (not a.communes or insee in a.communes.split(",")):
            r = controle(lot, insee, C["article"])
            C["anomalies_restantes"] = r["anomalies"]
            C["motif"] = (f"{r['bloquantes']} anomalie(s) déterministe(s)" if r["bloquantes"] else
                          ("corrigé une fois ; vérifier la section E" if C["article"] == "correction.md" else ""))
    lot.sauver(); vue(lot)


def cmd_rediger(lot, a):
    verrou = os.path.join(lot.dir, ".verrou")
    try:
        fd = os.open(verrou, os.O_CREAT | os.O_EXCL | os.O_WRONLY); os.write(fd, maintenant().encode()); os.close(fd)
    except FileExistsError:
        sys.exit(f"lot déjà en cours ({open(verrou).read()}) : attendre ou supprimer {verrou} si le lancement précédent est mort")
    plan = []
    try:
        if a.executer and not lot.conf.get("execution_autorisee"):
            sys.exit("execution_autorisee absent de lot.json : aucun appel (accord du porteur requis)")
        for insee, C in lot.etat["communes"].items():
            if C.get("insee") and (not a.communes or insee in a.communes.split(",")):
                try:
                    rediger_commune(lot, insee, a.executer, plan)
                except (PlafondAtteint, LimiteUsage, AuthNonAbonnement) as e:
                    C.update(motif=f"arrêt du lot : {str(e)[:300]}"); lot.sauver(); print(f"■ arrêt propre du lot : {e}"); break
                except Exception as e:
                    C.update(motif=f"erreur : {str(e)[:300]}"); lot.sauver(); print(f"✗ {C['nom']} : {e}")
    finally:
        os.remove(verrou)
    if not a.executer:
        M = lot.conf["moteur"]
        print(f"SIMULATION · moteur {M['outil']} · {len(plan)} communes à rédiger · aucun appel lancé")
        for insee, n in plan:
            print(f"  {lot.c(insee)['nom']} ({insee}) : consignes + dossier ≈ {n // 1000} k caractères")
        print("Lancer réellement : ajouter --executer (limite : une rédaction, une relecture, au plus une correction par commune)")
    vue(lot)


# ── Vue du lot (le détail est dans /dev/lot côté site) ───────────────────────────────────────────────────
def vue(lot):
    print(f"\n{'Commune':<22} {'INSEE':<6} {'État':<22} Préparation  Motif")
    for k, C in lot.etat["communes"].items():
        print(f"{C['nom']:<22} {str(C.get('insee') or '?'):<6} {C['statut']:<22} {str(C.get('duree_preparation_s', '')):>9} s  {C.get('motif', '')}")
    print(f"Coût « équivalent API » rapporté par Claude Code (information, non facturé, n'est pas une mesure du quota) : {depense_cumulee(lot):.2f} $")


def main():
    p = argparse.ArgumentParser()
    p.add_argument("commande", choices=["preparer", "collecter", "rediger", "controler", "etat"]); p.add_argument("lot")
    p.add_argument("--communes", default="", help="restreindre à ces codes INSEE ou noms (virgules)")
    p.add_argument("--refaire", default="", help="étapes à refaire même si réussies (fiche,comparaison,complement,dossier)")
    p.add_argument("--executer", action="store_true", help="rediger : lancer réellement les sessions Claude Code / Codex")
    a = p.parse_args()
    lot = Lot(a.lot)
    {"preparer": cmd_preparer, "collecter": cmd_collecter, "rediger": cmd_rediger, "controler": cmd_controler, "etat": lambda l, a: vue(l)}[a.commande](lot, a)


if __name__ == "__main__":
    main()
