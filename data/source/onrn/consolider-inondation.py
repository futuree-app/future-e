import openpyxl, json, os

HERE = os.path.dirname(os.path.abspath(__file__))

def read_sheet(fname, sheet):
    wb = openpyxl.load_workbook(os.path.join(HERE, fname), read_only=True, data_only=True)
    ws = wb[sheet]; rows = []
    for i, r in enumerate(ws.iter_rows(values_only=True)):
        if i == 0: continue
        insee, name, val = r[0], r[1], r[2]
        if insee is None: continue
        rows.append((str(insee).strip(), (name or "").strip(),
                     val.strip() if isinstance(val, str) else val))
    wb.close(); return rows

cout = read_sheet("ONRN_CoutMoyen_INON_9521.xlsx", "Coût moy. sinistres")
rep  = read_sheet("ONRN_CoutMoyen_INON_9521.xlsx", "Représentativité")
freq = read_sheet("ONRN_Frequence_INON_9521.xlsx", "Fréq. moy. sinistres")

cout_m = {i: v for i, n, v in cout}
rep_m  = {i: v for i, n, v in rep}
freq_m = {i: v for i, n, v in freq}
name_m = {i: n for i, n, v in cout}

# Garde-fou anti-corruption : le couplage 'no sinistre' coût<->représentativité doit être ~100 %.
def is_no(v): return isinstance(v, str) and v.startswith("Pas de sinistre")
both = [i for i in cout_m if i in rep_m]
couple = sum(1 for i in both if is_no(cout_m[i]) == is_no(rep_m[i]))
pct = 100 * couple / len(both)
print("couplage cout<->repr 'no sinistre': %.3f%%" % pct)
assert pct > 99.9, "ALIGNEMENT SUSPECT : le fichier coût inondation est peut-être désaligné, arrêt."

out = {i: {"nom": name_m.get(i, ""), "cout_moyen": cout_m.get(i),
           "frequence": freq_m.get(i), "representativite": rep_m.get(i)} for i in cout_m}
with open(os.path.join(HERE, "onrn_inondation_consolide.json"), "w", encoding="utf-8") as f:
    json.dump(out, f, ensure_ascii=False)
print("ecrit onrn_inondation_consolide.json :", len(out), "communes")
