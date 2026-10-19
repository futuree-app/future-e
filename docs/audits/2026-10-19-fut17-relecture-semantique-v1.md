# FUT-17 : relecture sémantique finale des compositions V1

Date : 19/10/2026. Branche `fix/fut-17-relecture-semantique-v1`, partie de `origin/main` `5358667f` (FUT-20 fusionné).
Périmètre : ce que le dossier de décision **raconte** (titres, verdicts, résumés, gestes), composition par composition, sur le rendu réel de `DossierDecisionSection` (présentation classique, verdict déterministe) et les vraies données DRIAS.
Hors périmètre : fusion, déploiement, génération réelle de dossier, appel Anthropic, données de production.

**Verdict : NO GO**, levé par l'arbitrage de la règle transports × chaleur (B, A3). Tout le reste du périmètre est GO.

---

## A. Inventaire de couverture

| Composition / surface | Verdict | Note |
|---|---|---|
| `ambient_heat_housing` (niveaux de preuve A, B1, C) | Conforme | |
| `wildfire_exposure` | Conforme | Deux fondements ; le geste suit le grain. |
| `territory-size-multiple-consequences` | Conforme | |
| `clay_regulation_grouped` | Conforme | Cas négatif d'un plan inondation contrôlé. |
| Cartes condition (FUT-110) | Conforme | Le sens est préservé. |
| Côté logement FUT-20 | Conforme | Nîmes, La Rochelle sous le seuil, A, B1, C. |
| FUT-112 | Conforme | Aucune progression affirmée dans le dossier rendu. |
| Îlot de chaleur × espace vert | Conforme | |
| Lecture inondation à trois sources | Conforme | |
| Conclusion Autour | Conforme | |
| `seasonal_climate_tradeoff` | **Corrigé** | Sujet du verdict (A1). |
| `climate_comfort` | **Corrigé** | Titre sans logement (A2). |
| Règle transports × chaleur (D7, FUT-85) | **Incertain, arbitrage requis** | A3. |

**Limites de couverture :**
- La présentation « Relevé » n'a pas été contrôlée : elle est éteinte en production (`DECISION_RELEVE` absent des variables Vercel).
- La conclusion rédigée par l'IA et la synthèse IA du module Logement ne sont pas contrôlées : elles ne sont pas déterministes et l'appel Anthropic est hors périmètre. Seul le repli déterministe a été vérifié.
- Aucun artefact de production n'a été inspecté.
- L'outre-mer n'a pas été testé au-delà de l'absence de données DRIAS.

## B. Anomalies démontrées

### Corrigées dans cette branche

**A1. Sujet du compromis hivers doux / étés chauds. Gravité élevée.** `src/lib/decision/fact-compositions.ts`, `composeSeasonalClimateTradeoff`.
- Avant : « Nîmes répond moins bien à une de vos priorités : l'exposition aux fortes chaleurs. » La priorité déclarée du lecteur y était inversée.
- Après : « … : des étés supportables. » `headlineSubject` reprend celui du mismatch chaleur, comme `climate_comfort`.
- Atteignabilité : sur toutes les orientations atteignables, ce sujet n'est servi que dans les gabarits de priorité. Le gabarit « Le principal point à contrôler » est inatteignable pour ce compromis : un tradeoff structurant oriente toujours vers l'arbitrage, et un tradeoff secondaire est exclu.

**A2. Titre de la carte chaleur sans logement. Gravité faible.** Même fichier, `composeClimateComfort`.
- Avant : « Des étés plus difficiles à concilier avec votre projet ».
- Après : « De fortes chaleurs projetées à l'horizon 2050 » (via `CLIMAT_HORIZON_LABEL`).
- Motif : l'ancien titre affirmait une évolution que la classification ne lit pas (elle lit un niveau à 2050) et qualifiait une saison entière. À Montpellier, la carte est déclenchée par les seules nuits tropicales. Le nouveau titre suit la doctrine de la relecture éditoriale FUT-20 : nommer le niveau projeté.
- Portée historique : avant correction, ce titre n'apparaissait que dans les dossiers sans adresse et dans les artefacts d'avant FUT-20 (avec une adresse, `confortEte` est toujours fourni). Les données confirment l'évolution : les 5 461 communes défavorables ont une référence 1976-2005, et chaque axe retenu progresse d'au moins 5 jours ou nuits par an. Le défaut tenait à la seule formulation.

### Non corrigées, à arbitrer

**A3. Règle transports × chaleur (`materiality-rules.ts:99-120`, décision D7 de FUT-85). Gravité moyenne. Motif du NO GO.**
- La carte affirme « Votre priorité de faible exposition à la chaleur est moins bien satisfaite ici ». Elle s'appuie sur un indice interne sans valeur visible, alors que la règle chaleur du moteur classe la commune sous le seuil. 2 796 communes concernées, dont La Rochelle (vérifiée sur données réelles).
- Le verdict la nomme ensuite « Le principal point à contrôler : la tension entre transports et chaleur », puis enchaîne « Tant que ces points ne sont pas levés… » (`conclusion-plan.ts:1412`).
- Corriger exige de retirer ou modifier une règle, donc probablement de passer à engine-6. Hors mandat : décision porteur.

**A4. Module Territoire, cible des liens « Preuve » (`QuartierClimatData.tsx`). Hors registre. Correction recommandée avant le lancement, dans un ticket dédié.**
- `:288` : « La progression s'accélère, elle ne fait pas que monter. » s'affiche sur toutes les communes sans aucun calcul. Faux année par année sur 26 002 communes, faux par °C de réchauffement sur 12 018. Sur 373 communes, la phrase côtoie une face de carte qui dit « Restent rares » (Jausiers, par exemple).
- `:274` : « les nuits d'été gardent de plus en plus la chaleur du jour » s'affiche sans lire la donnée, alors que la hausse à 2050 est inférieure à une nuit sur 102 communes. Même classe de défaut que FUT-112.
- `buildParagraphs` (`:1021`, « plus difficiles à traverser ») est du code mort.

**A5. Défaut latent.** « Une trajectoire de danger d'incendie qui s'aggrave » (`fact-compositions.ts:200`) n'est pas conditionné à la hausse. Aucune commune concernée sur les données actuelles.

**A6. Repli sans données logement. Gravité faible.** Le dossier commune réutilisé demande « Renseignez votre adresse… » alors que l'adresse est connue (`assemble-address-dossier.ts:121`).

**Notes jugées conformes :**
- La douceur des hivers se lit deux fois quand elle est confirmée comme condition.
- Deux temporalités coexistent dans le compromis (douceur sur 1976-2005, chaleur en 2050) ; la période est donnée dans la preuve.
- `whyNotDecided` de la condition chaleur dit « lecture faite à l'échelle de la commune » à côté du bloc « À cette adresse ».
- Résumé argiles : « Le sol argileux expose le bâti ».

## C. Tests

- **Nouveau** `src/lib/fut17-relecture-semantique.test.ts` : 14 tests sur le rendu réel de `DossierDecisionSection`, avec les vraies données DRIAS. Ils vérifient ce que la carte **dit**, au-delà de sa présence.
- **Nouvelle fixture** `src/lib/__fixtures__/fut17-artefacts-avant.json` : quatre artefacts engine-5 générés par le code de `main` **avant** correction, avec rendu, verdict et hash attendus. Elle ne doit jamais être régénérée.
- `src/lib/fut20-chaleur-logement.test.ts` : le test « Artefact engine-5 d'avant FUT-20 » relit l'artefact figé au lieu de le régénérer.
- `conclusion-plan.test.ts`, `fut54-verdict-ecart.test.ts`, `decision-assembler.test.ts` : fixtures écrites à la main qui épinglaient l'ancien sujet ou l'ancien titre, alignées sur ce que produit réellement le générateur. Le test « héros : une composition en tête nomme son headlineSubject » (`conclusion-plan.test.ts:838`) garde un override explicite, commenté : son entrée est impossible pour le vrai moteur.
- **Détection :** sur le code de `main`, 5 des nouveaux tests échouent (les deux défauts et l'équivalence avant/après) ; les 9 autres passent sur les deux versions.
- **Suite complète lancée seule :** 2 768 / 2 768 (2 754 + 14). `tsc` OK, eslint 0 erreur sur les fichiers touchés, `npm run build` OK (277 pages).
- **Matrice avant/après** (sonde ponctuelle, non conservée) : 200 dossiers = 5 communes (Nîmes, Montpellier, La Rochelle, Briançon, Salers) × 4 situations de logement × 10 projets. Aucune différence métier (état, étiquette, ton, orientation, couverture, registre complet, sections et cartes, gestes prioritaires, minute). Le rendu change sur 24 dossiers, uniquement par les deux corrections : 8 titres, 16 verdicts.

## D. Compatibilité

- **Artefacts figés (vendus) :** relus mot pour mot. Le titre est figé dans chaque artefact et n'entre pas dans le hash du plan narratif ; verdict et hash de conclusion inchangés. Aucune réécriture, aucune régénération.
- **Dossiers vivants portant un compromis :** le verdict change, donc le hash du plan aussi. La conclusion rédigée sera régénérée une fois, à la prochaine ouverture, comme après FUT-20 et FUT-110.
- Pas de changement de version moteur (reste engine-5).

## E. Verdict

**NO GO.** Pour le lever :
1. Trancher D7 : retirer la règle transports × chaleur ou aligner sa convention sur celle de la règle chaleur, puis l'implémenter (probablement engine-6).
2. Recommandé : corriger les phrases non fondées du module Territoire (A4), dans un ticket dédié.

Tout le reste du périmètre est **GO**.
