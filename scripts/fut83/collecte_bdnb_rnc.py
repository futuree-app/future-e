"""FUT-83 : pour les groupes de bâtiments BDNB rencontrés par FUT-80, les copropriétés que la BDNB leur relie
(`rel_batiment_groupe_rnc`, API ouverte, millésime 2026-02a). Lecture seule, bornée : 5 groupes par appel,
une pause entre deux appels (quota annoncé : 120 par minute, 10 000 par mois).

Usage : python3 -I scripts/fut83/collecte_bdnb_rnc.py <mesure-fut80.json.gz> > bdnb_rnc.json
"""
import gzip, json, sys, time, urllib.request, urllib.parse

API = "https://api.bdnb.io/v1/bdnb/donnees/rel_batiment_groupe_rnc"

def appeler(groupes):
    q = urllib.parse.urlencode({"batiment_groupe_id": f"in.({','.join(groupes)})", "limit": "100"})
    with urllib.request.urlopen(f"{API}?{q}", timeout=20) as r:
        return json.load(r), r.headers.get("x-quota-remaining")

def main(chemin):
    d = json.load(gzip.open(chemin))
    groupes = sorted({b["groupe"]["batiment_groupe_id"] for b in d["bdnb"] if b.get("groupe")})
    lignes, erreurs, quota = [], [], None
    for i in range(0, len(groupes), 5):
        lot = groupes[i:i + 5]
        for essai in range(3):
            try:
                res, quota = appeler(lot)
                lignes.extend(res)
                break
            except Exception as e:  # noqa: BLE001 — on garde la trace, on ne conclut rien d'un échec
                if essai == 2:
                    erreurs.append({"groupes": lot, "erreur": str(e)})
                time.sleep(2 + essai * 3)
        time.sleep(0.6)
    json.dump({"date": time.strftime("%Y-%m-%d"), "groupes_interroges": len(groupes), "lignes": lignes,
               "erreurs": erreurs, "quota_restant": quota}, sys.stdout, ensure_ascii=False, indent=0)

if __name__ == "__main__":
    main(sys.argv[1])
