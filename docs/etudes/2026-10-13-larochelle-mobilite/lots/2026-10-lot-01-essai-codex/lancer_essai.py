#!/usr/bin/env python3
"""Essai Codex sur Angers (49007) : UNE rédaction, mêmes consignes et même dossier que la première rédaction Claude.

Entrées figées, reprises de l'historique git (et non de l'état courant du lot 01, retouché depuis) :
  consignes  = redaction/PROMPT_REDACTION.md au commit 21968244   (empreinte 7dc2ca0c244ec27a, = redaction.json Claude)
  dossier    = lots/2026-10-lot-01/49007/dossier/dossier.md à 834de6d8 (entrée 47175bc2cd29cbd6, = redaction.json Claude)
  pièces     = complement.json (empreinte 015fbae26d0ef794, celle dont le dossier a été construit), comparaison_voiture.json,
               fiche du réseau 6178cee254e3b3f0744a1318.json, toutes à 834de6d8.

Session : dossier vide hors du dépôt ; pièces en lecture seule ; profil de permissions qui n'autorise la lecture QUE de ce
dossier (et du minimum système), aucune écriture, aucun réseau ; recherche web désactivée ; config utilisateur, règles,
plugins, applications, mémoire et sous-agents non chargés ; session éphémère. Abonnement ChatGPT exigé : arrêt sinon.

    python lancer_essai.py            # vérifie et affiche la commande, AUCUN appel
    python lancer_essai.py --executer # un appel ; refuse de repartir si un résultat ou un marqueur existe
"""
import datetime as dt, hashlib, json, os, shutil, subprocess, sys, tempfile, time

ICI = os.path.dirname(os.path.abspath(__file__))
INSEE = "49007"
MODELE, EFFORT = "gpt-6.1-sol", "high"  # modèle le plus récent proposé par l'abonnement ; effort aligné sur Claude (high)
GEN = os.path.join(ICI, INSEE, "generation")
PIECES = [os.path.join(ICI, INSEE, "dossier", "complement.json"), os.path.join(ICI, INSEE, "fiche", "comparaison_voiture.json"),
          os.path.join(ICI, "reseaux", "6178cee254e3b3f0744a1318.json")]
ATTENDU = {"consignes": "7dc2ca0c244ec27a", "entree": "47175bc2cd29cbd6", "complement": "015fbae26d0ef794"}
ENV_INTERDITES = ("OPENAI_API_KEY", "CODEX_API_KEY", "OPENAI_BASE_URL", "OPENAI_ORG_ID", "OPENAI_PROJECT", "AZURE_OPENAI_API_KEY")
DESACTIVER = ("plugins", "remote_plugin", "apps", "multi_agent", "image_generation", "browser_use", "computer_use", "in_app_browser",
              "skill_search", "tool_suggest", "goals", "memories")


def sha(*parts):
    h = hashlib.sha256()
    for p in parts:
        h.update(p if isinstance(p, bytes) else str(p).encode())
    return h.hexdigest()[:16]


def maintenant():
    return dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def verifier_abonnement():
    st = subprocess.run(["codex", "login", "status"], capture_output=True, text=True)
    a = json.load(open(os.path.expanduser("~/.codex/auth.json")))
    env = [k for k in ENV_INTERDITES if os.environ.get(k)]
    ok = "ChatGPT" in (st.stdout + st.stderr) and a.get("auth_mode") == "chatgpt" and not a.get("OPENAI_API_KEY")
    return ok, {"login_status": (st.stdout + st.stderr).strip(), "auth_mode": a.get("auth_mode"),
                "cle_api_dans_auth": bool(a.get("OPENAI_API_KEY")), "variables_cle_presentes": env}


def main():
    executer = "--executer" in sys.argv
    systeme = open(os.path.join(ICI, "consignes", "PROMPT_REDACTION.md")).read()
    dossier = open(os.path.join(ICI, INSEE, "dossier", "dossier.md")).read()
    noms = [os.path.basename(p) for p in PIECES]
    # Message utilisateur construit exactement comme outil/lot.py (rediger_commune puis generer) : même texte, même suffixe.
    utilisateur = (f"Dossier de la commune (dossier.md) :\n\n{dossier}"
                   + "\n\n---\n\nPièces justificatives référencées par le dossier, en lecture seule dans ./pieces/ : " + ", ".join(noms)
                   + ". Tu peux les lire pour vérifier une source ; elles n'apportent aucun fait qui ne soit déjà dans le dossier, "
                     "et ne t'autorisent ni recherche extérieure ni autre fichier.")
    vu = {"consignes": sha(systeme), "entree": sha(utilisateur), "complement": sha(open(PIECES[0], "rb").read())}
    if vu != ATTENDU:
        sys.exit(f"entrées différentes de la première rédaction Claude : {vu} ≠ {ATTENDU}")
    # codex exec n'a pas de prompt système séparé : consignes puis dossier dans un seul message (convention de outil/lot.py).
    message = f"{systeme}\n\n---\n\n{utilisateur}"
    ok, auth = verifier_abonnement()
    print("authentification :", json.dumps(auth, ensure_ascii=False))
    if not ok:
        sys.exit("ARRÊT : Codex n'est pas authentifié par l'abonnement ChatGPT (ou une clé API est présente).")
    p_meta, p_sortie, p_marq = (os.path.join(GEN, f) for f in ("redaction.json", "redaction.md", "redaction.en_cours"))
    if any(os.path.exists(p) for p in (p_meta, p_sortie, p_marq)):
        sys.exit("une rédaction a déjà été lancée pour cet essai : pas de seconde tentative")
    tmp = tempfile.mkdtemp(prefix="futuree-essai-codex-")
    os.makedirs(os.path.join(tmp, "pieces"))
    for p in PIECES:
        q = os.path.join(tmp, "pieces", os.path.basename(p)); shutil.copy(p, q); os.chmod(q, 0o444)
    out = os.path.join(tempfile.mkdtemp(prefix="futuree-essai-codex-sortie-"), "sortie.md")  # hors de la zone lisible par le modèle
    racine = os.path.realpath(tmp)
    cmd = ["codex", "exec", "--ephemeral", "--ignore-user-config", "--ignore-rules", "--skip-git-repo-check", "--json",
           "-C", tmp, "-m", MODELE, "-c", f'model_reasoning_effort="{EFFORT}"', "-c", 'web_search="disabled"',
           "-c", 'default_permissions="essai"',
           "-c", f'permissions.essai.filesystem={{":minimal"="read", "{racine}"="read"}}',
           "-c", 'approval_policy="never"', *[x for f in DESACTIVER for x in ("--disable", f)], "-o", out, "-"]
    print(" ".join(cmd))
    if not executer:
        shutil.rmtree(tmp); return
    version = subprocess.run(["codex", "--version"], capture_output=True, text=True).stdout.strip()
    env = {k: v for k, v in os.environ.items() if k not in ENV_INTERDITES}
    os.makedirs(GEN, exist_ok=True)
    open(p_marq, "w").write(maintenant())
    debut, t0 = maintenant(), time.time()
    r = subprocess.run(cmd, cwd=tmp, input=message, capture_output=True, text=True, env=env, timeout=1800)
    duree = round(time.time() - t0, 1)
    open(os.path.join(GEN, "redaction.evenements.jsonl"), "w").write(r.stdout)
    ev = []
    for l in r.stdout.splitlines():
        try:
            ev.append(json.loads(l))
        except json.JSONDecodeError:
            pass
    usage = [e.get("usage") for e in ev if e.get("type") == "turn.completed"]
    commandes = [(e.get("item") or {}).get("command") for e in ev if (e.get("item") or {}).get("type") == "command_execution"
                 and e.get("type") == "item.completed"]
    texte = open(out).read() if os.path.exists(out) else None
    meta = {"etape": "redaction", "outil": "codex", "version_outil": version, "modele_demande": MODELE, "effort": EFFORT,
            "authentification": auth, "consignes_sha": vu["consignes"], "entree_sha": vu["entree"], "message_sha": sha(message),
            "debut": debut, "duree_s": duree, "code_retour": r.returncode, "usage": usage,
            "types_evenements": sorted({e.get("type", "?") for e in ev}), "commandes_executees": commandes,
            "stderr": r.stderr[-3000:], "pieces": [os.path.basename(p) for p in PIECES]}
    json.dump(meta, open(p_meta, "w"), ensure_ascii=False, indent=1)
    os.remove(p_marq)
    shutil.rmtree(tmp, ignore_errors=True)
    if not texte or r.returncode:
        sys.exit(f"rédaction sans texte exploitable (code {r.returncode}) : voir {p_meta}")
    open(p_sortie, "w").write(texte)
    print(f"fait en {duree} s → {p_sortie}")


if __name__ == "__main__":
    main()
