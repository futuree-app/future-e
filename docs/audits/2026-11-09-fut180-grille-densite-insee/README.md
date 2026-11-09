# FUT-180 · Reproduire l'étude de la grille de densité Insee

Rapport : [`../2026-11-09-fut180-grille-densite-insee.md`](../2026-11-09-fut180-grille-densite-insee.md).

## Rejouer

```bash
python3 -m venv /tmp/fut180-venv && source /tmp/fut180-venv/bin/activate
pip install -r requirements.txt
./lancer_tout.sh /tmp/fut180-travail          # index de main au 09/11/2026 (51a493d0)
./lancer_tout.sh /tmp/fut180-travail <rev>    # ou un autre état de l'index
```

Le dossier de travail est hors dépôt. Rien n'est écrit dans le dépôt, l'index ou une base.
`00_preparer.sh` télécharge les sources Insee et **refuse de continuer** si une empreinte diffère de `SHA256-source.txt`.
L'index est lu par `git show <rev>:data/comparateur-index.json.gz`, jamais dans la copie de travail.

Comparer sa sortie à `sortie-attendue.txt` (même ordre, chemins remplacés par `<dossier_de_travail>`).

## Fichiers

| Script | Ce qu'il prouve | Section du rapport |
|---|---|---|
| `00_preparer.sh` | sources, empreintes, index figé | §1 |
| `01_charger_grille.py` | lecture de la feuille « Maille communale » (en-têtes en ligne 5) | §1 |
| `02_jointure.py` | couverture, 45 arrondissements et 3 communes PLM non appariés ; reproduit `densityCategory` | §2 |
| `03_tableau_croise.py` | distribution nationale, tableau croisé, 3 postes × nos catégories (3 026), densités absentes | §2 |
| `04_ecarts_et_libelles.py` | groupes A à F, seuils de cluster lus comme seuils communaux, croisement unités urbaines | §2, §3, §6 |
| `05_coherence_et_millesimes.py` | 80 communes où P1/P2/P3 contredisent la classe ; 2025 = 2026 | §1, §3 |
| `06_panel_et_voisins.py` | panel par code Insee, PLM, 738 communes `rural_peri_urbain` | §2, §3, §6 |

## Points à contre-vérifier en priorité

1. `cat()` dans `02_jointure.py` reproduit-il fidèlement `densityCategory` (`src/lib/territoire/facts.ts`) ?
2. Le décompte `rural_peri_urbain` (§6) suppose la règle de `src/lib/comparateur-vie.ts` l. 817 ; il ne mesure pas quelle phrase d'accueil s'affiche (d'autres catégories passent avant).
3. Les définitions des 7 classes viennent de la publication Insee `pa_ind_16_12.pdf` (2025) ; la feuille « Documentation » du xlsx est vide.
4. `hors_uu` est lu tel quel dans l'index ; sa fiabilité relève de FUT-176.
