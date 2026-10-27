"""FUT-83 : lecture du RNIC et index de rattachement (adresse déclarée, parcelle). Pur, sans réseau.

Le registre déclare, pour chaque copropriété, une adresse de référence (« 1re adresse figurant au règlement »),
jusqu'à trois adresses complémentaires (plages de numéros admises) et jusqu'à trois références cadastrales.
Ce module ramène ces déclarations et une adresse BAN à une même forme, sans jamais interpréter au-delà :
une adresse ou une parcelle partagée donne PLUSIEURS candidats, jamais un choix.
"""
import csv, re, unicodedata

csv.field_size_limit(10**7)

ABREV = {
    "r": "rue", "av": "avenue", "ave": "avenue", "bd": "boulevard", "bld": "boulevard", "boul": "boulevard",
    "pl": "place", "all": "allee", "imp": "impasse", "rte": "route", "ch": "chemin", "che": "chemin",
    "chem": "chemin", "crs": "cours", "sq": "square", "qu": "quai", "fg": "faubourg", "fbg": "faubourg",
    "pass": "passage", "pas": "passage", "res": "residence", "lot": "lotissement", "cite": "cite", "cit": "cite",
    "prom": "promenade", "sen": "sente", "sent": "sentier", "trav": "traverse", "rpt": "rond point",
    "mte": "montee", "hle": "halle", "quar": "quartier", "vla": "villa", "ham": "hameau", "esp": "esplanade",
    "pkg": "parking", "zac": "zac", "za": "za", "plt": "placette", "car": "carrefour", "gal": "galerie",
    "st": "saint", "ste": "sainte", "pt": "petit", "gd": "grand", "gde": "grande", "dr": "docteur",
    "gal.": "general", "gen": "general", "mal": "marechal", "pdt": "president", "prof": "professeur",
}
VIDES = {"de", "du", "des", "la", "le", "les", "l", "d", "au", "aux", "et", "a", "en"}
SUFFIXES = {"bis": "b", "b": "b", "ter": "t", "t": "t", "quater": "q", "q": "q", "a": "a", "c": "c", "d": "d"}

def sans_accents(s):
    return "".join(c for c in unicodedata.normalize("NFD", s) if unicodedata.category(c) != "Mn")

def voie_norm(voie):
    s = sans_accents(voie.lower())
    s = re.sub(r"[’'`\-\.,/()]", " ", s)
    mots = []
    for m in s.split():
        m = ABREV.get(m, m)
        for x in m.split():
            if x not in VIDES:
                mots.append(x)
    return " ".join(mots)

NUM = re.compile(r"^\s*(\d+)\s*(bis|ter|quater|[abcdqt])?\b\s*(?:(?:-|a|à|au|et)\s*(\d+)\s*(bis|ter|quater|[abcdqt])?\b)?\s*(.*)$", re.I)

def decouper(adresse, code_postal=None):
    """« 2-10 r auguste keufer 42100 saint etienne » -> ([(2,''),(4,''),…,(10,'')], 'rue auguste keufer').
    Une adresse sans numéro rend une liste vide : elle ne rattache rien au numéro près."""
    if not adresse:
        return [], ""
    a = adresse.strip()
    a = re.split(r",?\s+\d{5}\b", a)[0]  # tout ce qui suit le code postal (commune)
    m = NUM.match(sans_accents(a.lower()))
    if not m:
        return [], voie_norm(a)
    n1, s1, n2, s2, voie = m.groups()
    s1 = SUFFIXES.get((s1 or "").lower(), "")
    n1 = int(n1)
    nums = [(n1, s1)]
    if n2:
        n2 = int(n2)
        if n2 > n1 and n2 - n1 <= 400:
            pas = 2 if (n2 - n1) % 2 == 0 else 1
            nums = [(k, "") for k in range(n1, n2 + 1, pas)]
        else:
            nums.append((n2, SUFFIXES.get((s2 or "").lower(), "")))
    return nums, voie_norm(voie)

def parcelle_norm(ref):
    """« 75056102AG0011 » et « 75102000AG0011 » désignent la même parcelle : on ramène la commune à
    l'arrondissement, et la section sur deux caractères, le numéro sur quatre."""
    ref = (ref or "").strip().upper()
    m = re.match(r"^(\d[\dAB]\d{3})(\d{3})([0-9A-Z]{1,2})(\d{1,4})$", ref)
    if not m:
        return None
    insee, pref, sec, num = m.groups()
    # Paris et Lyon : la commune unique et le préfixe d'arrondissement (102, 385) valent le code de
    # l'arrondissement (75102, 69385). Marseille n'est pas ramenée : son préfixe désigne un quartier
    # cadastral, pas l'arrondissement, et deviner la correspondance serait affirmer.
    if insee == "75056" and pref.startswith("1"):
        insee, pref = "75" + pref, "000"
    elif insee == "69123" and pref.startswith("38"):
        insee, pref = "69" + pref, "000"
    return f"{insee}{pref}{sec.rjust(2, '0')}{num.rjust(4, '0')}"

def lire_rnic(chemin):
    """Les copropriétés, une par numéro : le fichier quotidien répète 8 233 lignes à l'identique."""
    vues = {}
    with open(chemin, encoding="utf-8", errors="replace", newline="") as f:
        for r in csv.DictReader(f):
            vues.setdefault(r["numero_immatriculation"], r)
    return vues

def adresses_declarees(r):
    sortie = []
    for champ in ("adresse_reference", "adresse_complementaire_1", "adresse_complementaire_2", "adresse_complementaire_3"):
        if r.get(champ):
            sortie.append((champ, r[champ]))
    return sortie

def construire_index(copros):
    par_adresse, par_parcelle = {}, {}
    for num, r in copros.items():
        insee = r.get("commune") or ""
        for champ, adr in adresses_declarees(r):
            nums, voie = decouper(adr)
            for n, s in nums:
                # Le « bis » n'est jamais confondu avec le numéro nu : à La Rochelle, le 32 et le 32 bis de
                # l'avenue du Général-Leclerc sont deux copropriétés distinctes (mesure du 27/10/2026).
                par_adresse.setdefault((insee, n, s, voie), set()).add(num)
        for i in (1, 2, 3):
            p = parcelle_norm(r.get(f"reference_cadastrale_{i}"))
            if p:
                par_parcelle.setdefault(p, set()).add(num)
    return par_adresse, par_parcelle

def cle_ban(label, insee):
    nums, voie = decouper(label)
    if not nums:
        return None
    n, s = nums[0]
    return (insee, n, s, voie)
