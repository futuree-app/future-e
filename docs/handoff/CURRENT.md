# Passation — session en cours

**Horodatage** : 2026-07-09 · **Branche courante** : `main` (3 commits d'avance sur `origin/main`, NON poussés) · **Arbre NON propre** : 2 fichiers modifiés non commités (voir État git).

## Objectif en cours
Itération **design + éditorial + data** sur le **rapport du module Logement** (`/rapport/logement`), pilotée par les retours du porteur en boucle courte (il regarde le rendu réel, renvoie des retours, on corrige). Suite à la revue **Design Critic** (rapport `docs/rapports-agents/design-critic/2026-07-08-module-logement-design-ui-structure.md`). Le fil du moment : polissage de la **carte Sinistralité** et passe **langage non-expert** (« test de la mère : une aide ménagère doit comprendre sans perdre la finesse »).

## Fait dans cette session (tout sur `main`)
1. **v6 croisement climat × Territoire + ÎCU** (déjà poussés, antérieurs) : cf. mémoire.
2. **Design retours 1+2** (poussés : `e185ce2`, `c00929d`, `e6d04e7`) : synthèse compactée ; `FamilyHeading` colorée (accent/bleu) + agrandie ; tooltips sur les chips « Faire face à la chaleur » (`ChipTooltip` étendu d'un `color`) ; sinistralité décompressée ; **nouveau set d'icônes au trait** `src/components/report/logement/icons.tsx` (clock/soleil/onde sismique/strates — aucune icône n'existait dans le DS avant) ; Sismicité/RGA harmonisés (icône + tooltip `MetricTooltip` via `Block` étendu de `icon`+`tip`) ; **refonte sinistralité** (conclusion en titre, fréquence primaire, coût secondaire lisible en blanc).
3. **ÎCU déplacé + allégé** (`121f212`, NON poussé) : l'îlot de chaleur quitte « Autour » (jugé positif : services/verdure) pour la famille « ce à quoi l'adresse est exposée » (carte « Risques du bâti »). Composant `src/components/report/logement/IcuExposure.tsx` (titre + ⓘ tooltip portant garde-fou+méthode+source + le +X °C en héros). Retiré d'`AutourSection.tsx`.
4. **Risques recensés — fix DATA** (`0d66d3f`, NON poussé) : `georisques.ts` builder ADRESSE fetchait `/api/v2/gaspar/risques` (renvoie des PROCÉDURES, `risks.labels` VIDE) → bascule sur **v1 `/gaspar/risques?latlon=`** (`data[0].risques_detail[].libelle_risque_long`, propre, point-level). Affichage « Autres risques recensés à cette adresse : … » dans `LogementModule.tsx`, routé depuis `address.risks`, avec **filtre anti-doublon grossier** (écarte séisme/argile déjà gradés + frontière Santé radon/industriel/effet thermique/matières dangereuses + sous-détails « Par … », relabelle submersion marine + cavités).
5. **Passe langage non-expert** (`7cb64b2`, NON poussé) : confort d'été (« garde mal la fraîcheur quand il fait chaud »), réglementaire état C (« Aucune règle de construction particulière »), sinistralité (caveat en italique/plus petit, surprime CatNat glosée inline, « échantillon assurantiel » → « trop peu de logements assurés », fix bug d'espace « sécheressesont ») ; **prompt synthèse v7** : le vocabulaire d'expert n'apparaît JAMAIS même glosé (le vrai coupable était la règle d'attribution v4 qui ORDONNAIT « dites inertie légère », corrigée). `SYNTHESIS_PROMPT_VERSION` v6→v7. Vérif génération : jargon éliminé sauf « inertie » (9→3 résidus).
6. **NON COMMITÉ (le geste en cours)** : variation de la référence à la commune dans Sinistralité (« dans cette commune » répété 3× → nom réel dans l'eyebrow « Sinistres indemnisés à {commune} », pronom « y » dans l'intro, « dans la commune » dans la comparaison). Prop `commune` ajoutée à `SinistraliteBlock`, passée depuis `LogementModule` (`result.address.city`).

## Décisions prises (porteur) — pas encore gravées
- **Plus d'agent Editorial** : la passe éditoriale se fait à la main, étalon = « test de la mère ».
- **ÎCU = exposition, pas Autour** (l'Autour est positif).
- **Risques recensés SANS éviter les doublons finement** (porteur : montrer, juste écarter le doublon GROSSIER + la frontière Santé).
- **Bug PLM du gate de monétisation** (mémoire `project_module_logement`, HORS scope design, À PRIORISER) : `canAnalyzeCommune` ne matche pas home PLM (75056) vs adresse arrondissement (751xx) → Paris/Lyon/Marseille ne peuvent analyser aucun logement de leur ville.
- **Nappe ≠ simple** (mémoire corrigée) : aucun endpoint Géorisques, couche cartographique BRGM → vrai spike.

## État git
- Branche `main`, **3 commits non poussés** : `7cb64b2` (langage non-expert), `0d66d3f` (risques recensés data), `121f212` (ÎCU déplacé). Tout le reste est sur `origin/main`.
- **2 fichiers modifiés NON commités** : `src/components/report/LogementModule.tsx` + `src/components/report/logement/SinistraliteSection.tsx` (la variation nom-de-commune du point 6, prête, tsc/eslint pas encore rejoués car le commit a été interrompu).
- Aucune PR ouverte.

## Prochaine étape immédiate
Geste sinistralité **fini + commité + poussé** (tsc/eslint OK). Prod à jour (`e6d04e7..acaadce`). Chantiers en file, au choix du porteur :
1. **Réglementaire avec-plans** (« Zone soumise à prescriptions / PPR / Zone B2 » encore « trop ingénieur »).
2. **Spike nappe/TRI**.
3. **« Autour » : filtres + carte** (le plus gros). Aujourd'hui c'est une liste (BPE + espace vert). Cible = filtres (choisir les catégories) + **carte des points autour de l'adresse** = vraie feature data+UI. Donnée publique probable (points BPE déjà géolocalisés + OSM), mais carte interactive = ajout significatif → **spike avant engagement** (comme l'ÎCU). **Board d'agents lancé en background le 2026-07-09** pour cadrer AVANT le spike (data-curator + product-strategist + design-critic + software-architect) → rapports dans `docs/rapports-agents/<agent>/2026-07-09-autour-filtres-carte.md`, à relire à la reprise.
4. **Bug PLM du gate de monétisation** (hors design, à prioriser) : `canAnalyzeCommune` ne matche pas home PLM (75056) vs adresse arrondissement (751xx).

## Chantier de fond exploré (2026-07-09 soir) : « Le Fil »
Grosse session de CADRAGE (aucun code), pilotée par le porteur en dialogue avec ChatGPT. Le Fil = couche vivante/temporelle de futur•e. **7 rapports d'agents commités** dans `docs/rapports-agents/` (branche `main`, poussés) :
- Board initial (5) : `*/2026-07-09-le-fil-cadrage.md` (product, business, software-architect), `researcher/2026-07-09-le-fil-ouverture.md`, `data-curator/2026-07-09-le-fil-fiabilite-sources.md`.
- Volet classe B (2) : `data-curator/2026-07-09-le-fil-classe-b-detection.md`, `editorial-writer/2026-07-09-le-fil-classe-b-grammaire.md`.

**Convergence du board (5/5)** : NE PAS lancer un abonnement mensuel autonome. Le mensuel combat la discipline du silence. B2C = extension **incluse** (jamais mensuel) ; B2B = format portefeuille, après preuve B2C (ADR-0008). Moat = intégration au rapport payé + voix, PAS la donnée (flux publics copiables). **Bug PLM passe devant Le Fil** (unanime). Taux de déclenchement mesuré ~1-3 signaux/commune/an hors air (Data Curator, sur API) → **penche fonctionnalité incluse, pas abonnement**. MVP honnête = 2 flux (CatNat + sécheresse), pas 4 (Atmo → Santé ; diffs Géorisques → non diffable). Action no-regret : recadrer la page live `/le-fil` (vend encore « newsletter mensuelle » + « dashboard qui respire », promesses reniées). Product : strand déterministe « depuis votre rapport » (CatNat, sur API déjà appelées) pour tester le retour avant de construire.

**Doctrine « classe B » consolidée avec le porteur (à GRAVER en arbitrage vault, pas encore fait)** : 3 couches, pas 2.
- **A — structurée automatique** : CatNat, sécheresse (diff idempotent, zéro humain).
- **A½ — événements locaux à ancrage officiel** : inspections ICPE + arrêtés préfectoraux. **VÉRIFIÉ ce soir sur l'API Géorisques** `installations_classees?code_insee=` : expose `inspections` (dates + rapports PDF) et `documentsHorsInspection` (arrêtés préfectoraux datés), 119 ICPE à La Rochelle, MàJ quotidienne. Détection automatisable + géo-rattachée ; QUALIFICATION humaine (rapports = PDF scannés non normalisés). Corrige le « pas sourçable » du Data Curator. **Cas d'école = chantier dépollution rue Marcel Paul, La Rochelle** (ex. donné par le porteur via article Vert.eco + rapport DREAL Géorisques).
- **B — éditoriale pure** : presse/science, contextuelle, non sourçable hors hasard, prudence max. **Cas d'école ÉCARTÉ = fûts radioactifs Atlantique NE** (échoue au test local-direct-décisionnel + ligne rouge Editorial : mot à charge irréversible + effet local non établi).
- **Règle d'admission** (test produit du porteur) : « un habitant/parent/acheteur aurait-il pu mieux décider s'il avait su plus tôt ? » + ancrage sur acte d'autorité + grammaire établi/rapporté/non conclu + validation humaine. « Un média déclenche l'attention, futur•e ne publie qu'après retour à la source primaire. »
- **Restes à instruire (sans agent, le porteur économise ses tokens)** : fréquence réelle A½/commune/an (compter sur l'API), présence fiable des mises en demeure dans `documentsHorsInspection`. ADR/arbitrages prêts à graver listés en fin de chaque rapport (Business : pricing ; Product : vigilance-pas-alerte + atmo-hors-fil ; Data : inventaire-sources ; Architect : système séparé).

## À lire d'abord à la reprise
1. `/memory/MEMORY.md` puis `/memory/project_module_logement.md` (état module, très à jour ; note la ligne bug PLM + la correction nappe) et `/memory/icu_ilot_chaleur_data.md` (ÎCU, corrigé : iuhi EST en °C).
2. Rapport Design Critic : `docs/rapports-agents/design-critic/2026-07-08-module-logement-design-ui-structure.md` (feuille de route design : quick wins faits, restent réglementaire + carte Autour filtres/map).
3. Specs : `docs/superpowers/specs/2026-07-07-logement-rehydratation-design.md` (rehydratation livrée).
4. `docs/handoff/AUTO-SNAPSHOT.md` (fraîcheur ; possiblement périmé).

## Pièges / fils ouverts
- **Vérification visuelle en session payante** : le compte de test `bonjourfuturee@gmail.com` (le porteur devait **changer le mot de passe** — vérifier) a `home_insee_code = 75056` (Paris) donc **ne peut analyser AUCUNE adresse** (bug PLM). Pour screenshoter un rapport peuplé, la technique employée = **bypass LOCAL TRANSITOIRE** de `canAnalyzeCommune` (`src/lib/active-territory.ts`, ajouter `if (insee) return true; // @@TEMP-SHOOT-BYPASS@@` en tête, **à RETIRER aussitôt**) + Playwright headless (`playwright-core` + Chrome, `scratchpad/shoot.mjs`) sur une adresse Toulouse (couverte ÎCU). **Toujours vérifier `git status` que le bypass est retiré après.** Ne jamais commiter le bypass.
- **Synthèse v7** : « inertie » subsiste 3×/10 (attracteur LLM). Si le porteur veut 0 : durcir encore le prompt ou post-traiter. `NEXT_PUBLIC_AUTO_SYNTHESIS` OFF en dev (bouton « Générer »), ON à cible.
- **Réglementaire avec-plans** pas encore passé au langage habitant (seul l'état C « aucune zone » l'a été).
- **Risques recensés** : le builder PARCELLE de `georisques.ts` reste sur la v2 cassée (risks.labels vide), mais l'affichage route depuis `address.risks` (fixé) — pas de régression, mais le **payload synthèse lit `parcel.risks`** (donc la synthèse ne voit toujours pas les risques recensés ; non demandé, à savoir).
- **Tout est poussé** sur `origin/main` (jusqu'à `0ccdbec` : geste sinistralité + handoff + 2 boards de rapports d'agents « Autour » et « Le Fil »). Prod à jour côté code ; les rapports d'agents sont des docs, pas du code livré.
