# Passation : 2026-08-12, branche `main`

**Horodatage** : 2026-08-12, fin de session · **Branche** : `main`, **tout est poussé, rien en
attente**. Production déployée depuis `2756ccd` (build `future-3u6rfjuix`, Ready) ; les commits
postérieurs sont documentaires et ne changent rien à ce qui tourne.

> **Le chantier 5 est CLOS, poussé et déployé.** Le chantier 6 (premier écran) est **spécifié et
> planifié, pas commencé** : aucune ligne de code applicatif n'a été écrite pour lui. La reprise
> consiste à EXÉCUTER un plan déjà validé, tâche par tâche.

---

## Objectif en cours

**Chantier 6 : recomposer `/rapport` autour de la décision.** Le lecteur qui vient de payer voit
aujourd'hui une promesse commerciale en très grand, un panneau de navigation, un sélecteur d'horizon
qui ne change rien sur cette page, une carte projet, puis seulement la conclusion qu'il a achetée.
Le chantier remonte la conclusion en tête et fait de cet écran la seule surface où l'on modifie le
cadrage de l'analyse (objectif, intention, priorités, relation au lieu lu).

Contrainte qui gouverne tout le reste : quelques ventes RÉELLES encaissées avant le **20/08/2026**
(activité conservée au CSP, cf. `/memory/project_csp_activite_conservee.md`).

---

## Fait dans cette session

**Chantier 5, durcissement, MERGÉ ET DÉPLOYÉ** (`2756ccd`, treize fichiers, 1400 tests verts). Six
défauts fermés, tous vérifiés dans le code avant correction :

1. `versionPlusRecente` confondait `generating` et `failed` : après une v2 en échec, chaque clic sur
   « mettre à jour » répondait `ok` et aucune v3 ne naissait. Remplacé par `servedVersion` /
   `headVersion` + `headStatus`, pris sur LA MÊME ligne.
2. Un `generating` abandonné (fonction tuée après la réservation) verrouillait le dossier à vie.
   Bail de 15 min sur `created_at`, `maintenant` injecté pour être testable.
3. La lecture s'arrêtait à `.limit(5)` : au sixième échec, la v1 payée disparaissait de l'écran. La
   tête se lit seule, les versions prêtes se paginent jusqu'à une lisible.
4. `/api/dossier/actualiser` acceptait un `scopeKey` hors grammaire et ne vérifiait pas que le
   dossier appartenait à la commune. Grammaire validée, `communeParent` imposé des deux côtés.
5. L'identité d'artefact était l'arrondissement au webhook (`75101`) et la commune en lecture
   (`75056`) : sur Paris, Lyon, Marseille, l'artefact vendu n'était jamais retrouvé. Remonté à la
   commune aux deux bouts. **Vérifié en production : aucune ligne à migrer** (5 lignes en tout dans
   `decision_artifact`, sur `17300` et `44109`).
6. `signatureDecisionnelle` ratait de vrais changements (projet libre vers structuré, clé de
   préférence en double) et en inventait (contrainte inactive, ancre souple, `maxKm` sous un
   `maxMinutes`). Les règles d'activité sont désormais EMPRUNTÉES à `hard-constraints-hydrate.ts` et
   `project-view.ts`, jamais recopiées.

**Chantier 6, documentation, NON POUSSÉE** :

- `docs/superpowers/specs/2026-08-12-premier-ecran-decision-design.md` (`00a0ebf`, corrigé par
  `83223aa` et `89882e0`) : neuf sections, dix cas limites, neuf invariants vérifiables.
- `docs/superpowers/plans/2026-08-12-premier-ecran-decision.md` (`f32725e`, corrigé par `88c7cbc`) :
  **dix tâches**, avec le code à écrire, les tests, les commandes de vérification et les messages de
  commit.

Spec et plan ont chacun subi deux tours de revue externe (six puis quatre constats sur la spec, huit
sur le plan), tous traités.

---

## Décisions prises, pas encore dans le vault

1. **Porteur** : le H1 de `/rapport` devient la CONCLUSION. Le bloc verdict existant est promu ; le
   cadrage climat descend au niveau des modules, dont il est le sujet.
2. **Porteur** : le sélecteur d'horizon quitte le hub (il n'y change rien de visible) et reste sur
   Territoire, qui porte déjà son propre sélecteur inline.
3. **Porteur** : une seule surface d'ÉDITION, **sans fusionner les stockages**. `user_project` reste
   global au compte, `report_context.relation` reste attaché au lieu. Quelqu'un peut habiter Lorient
   et envisager La Rochelle : une posture, deux relations. La synthèse Territoire reçoit exactement
   la même valeur qu'aujourd'hui, aucun prompt n'est touché.
4. **Porteur** : les pages de résultat cessent de poser des questions. La sonde du Logement est
   supprimée, le bandeau de Territoire devient une ligne qui DIT le cadrage avec un lien vers
   `/rapport#projet`.
5. **Proposé, retenu** : `posture: habitant` avec `intent: achat` reste possible (le locataire qui
   achète son logement est un cas réel). L'intention est toujours demandée, son libellé suit
   l'objectif, et « ni l'un ni l'autre » écrit `null`. Effacer silencieusement une valeur déclarée
   est refusé.
6. **Proposé, retenu** : le panneau compact des échelles est SUPPRIMÉ en mode payant (il double la
   section `#modules`), conservé tel quel en gratuit où rien ne le double.
7. **Proposé, retenu** : les versions d'artefact nées de la recette du 12/08 restent en base. Une
   version ne se supprime pas, c'est la promesse de la migration 28.

---

## État git

- `main` = `origin/main`. **Rien en attente, rien à pousser** : la session s'est arrêtée ici
  volontairement, après la planification et avant la première ligne de code du chantier 6.
- Les sept derniers commits sont documentaires (spec, plan, ce brief). Le dernier commit de CODE est
  `2756ccd`, le durcissement du chantier 5, déjà en production.
- Aucun fichier applicatif modifié. `git status` propre hors non-suivis.
- Non suivis, volontairement hors dépôt : `CHARTE/`, `.impeccable/`, `Futur.e Design System.zip`.
- Aucune PR ouverte. Un push sur `main` déploie, **sans étape Preview**.
- **Piège vu deux fois** : le webhook Vercel n'a pas déclenché de build sur un push. Un commit vide
  le réveille. Ne PAS faire `vercel deploy` en CLI, il téléverserait les 92 Mo de `CHARTE/`.

---

## Prochaine étape immédiate

**Exécuter le plan `docs/superpowers/plans/2026-08-12-premier-ecran-decision.md`, tâche par tâche,
en commençant par la Task 1.**

Rien à récupérer, rien à rebaser, aucun travail en cours à retrouver : la session précédente s'est
arrêtée nette après la planification, tout est poussé, l'arbre de travail est propre. Le premier
geste est d'écrire le test de la Task 1.

Le plan est autoportant : chaque tâche liste ses fichiers, son code, ses commandes de vérification et
son message de commit. Deux modes possibles, au choix du porteur : un sous-agent neuf par tâche avec
revue entre chaque (recommandé, c'est aussi ce qui protège le contexte), ou une exécution en ligne
par lots avec points d'arrêt.

L'ordre des tâches n'est pas indifférent, deux dépendances sont réelles :

- la **Task 2** retire l'eyebrow « En une minute » AVANT que la **Task 3** n'en pose un dans
  l'en-tête, sinon l'écran en montre deux ;
- la **Task 9** réécrit le test du module Logement AVANT de changer la signature, pour le voir
  échouer.

Trois tâches contiennent une décision ou une mesure à ne pas escamoter :

- **Task 5** : la taille du titre se MESURE (headline déterministe le plus long, rendu à 360 px), et
  le résultat va dans le message de commit. Cinq lignes ou moins : `--text-display` partout. Plus :
  repli `--text-title` en mobile seul.
- **Task 6** : l'avertissement de parse ne s'affiche qu'APRÈS confirmation serveur, et il survit à la
  fermeture de l'éditeur. Il ne passe jamais par `error`.
- **Task 10** : deux des quatre captures demandent un projet dégradé. Compte jetable en premier
  choix ; à défaut, la procédure SQL de sauvegarde et de restauration vérifiée est écrite dans le
  plan. L'état non payant se lit avec un compte sans droit, jamais en retirant un droit payé.

Après les dix tâches : test navigateur, puis push (qui déploie).

---

## À lire d'abord à la reprise

1. `MEMORY.md`, puis `project_objet_central_dossier.md`, `project_csp_activite_conservee.md`,
   `audit_compte_reel_p0.md`, `feedback_text_maxwidth.md`, `feedback_no_em_dash.md`,
   `feedback_no_antithese.md`.
2. **`docs/superpowers/specs/2026-08-12-premier-ecran-decision-design.md`** : le POURQUOI de chaque
   décision du plan. À lire avant le plan, sans quoi certaines contraintes paraîtront arbitraires.
3. **`docs/superpowers/plans/2026-08-12-premier-ecran-decision.md`** : ce qu'il y a à faire.
4. `docs/vault/vision/objet-central-dossier-de-decision.md` : la thèse, les quatre niveaux
   (Profil → Projet → Candidat → Version), les huit invariants. Le chantier 6 est le point 5 de « L'ordre
   du prochain chantier », et le dernier.
5. `docs/audits/2026-08-11-sprint-confiance-dossier-de-revue.md` : les 17 premières étapes du sprint,
   ce qu'elles garantissent, où elles restent faibles.
6. Le code du sujet : `src/app/(account)/rapport/page.tsx`,
   `src/components/report/DossierDecisionSection.tsx`, `src/components/report/ConclusionBlock.tsx`,
   `src/components/report/ProjectSummaryCard.tsx`.
7. `docs/handoff/AUTO-SNAPSHOT.md` pour vérifier la fraîcheur (il date du 08/07, il est périmé).

---

## Pièges et fils ouverts

- **Ne JAMAIS remonter la date de l'analyse, son grain ou son obsolescence au-dessus du `Suspense`.**
  La page ne connaît que l'artefact COMMUNAL ; pour un dossier d'adresse, ces valeurs ne sont connues
  qu'après la lecture de l'artefact du scope `logement:<id>`, dans le composant streamé. Les remonter
  daterait le verdict d'adresse avec la date d'un autre artefact, et rouvrirait par une décision de
  mise en page le défaut que le chantier 5 vient de fermer. C'est la contrainte n°1 du plan.
- **Une seule fonction dérive la posture** : `bucketDuProjet` (`lib/decision/logement-gestes.ts:37`),
  qui teste l'intention AVANT la posture. Ne pas en écrire une seconde. Une première version du plan
  en proposait une, avec la priorité inverse.
- **Stripe n'est PAS vérifié en mode Live.** Seul verrou restant pour la vente, et il appartient au
  porteur : clé `sk_live_`, et un endpoint webhook **Live** vers `https://futur-e.fr/api/stripe/webhook`
  dont le `whsec_` est celui posé sur Vercel. Aucun achat RÉEL n'a encore eu lieu.
- **Les versions de recette restent en base.** Les deux scopes du compte de test portent des v2 et v3
  nées de la recette du 12/08. Elles ne sont pas servies, elles ne se nettoient pas. À savoir le jour
  où le nombre de versions d'un dossier deviendra une donnée d'analyse : sur ce compte, il raconte une
  recette.
- **Les artefacts vendus avant le 11/08 n'ont pas de `dataSnapshot`** : leur carte du module Territoire
  retombe sur l'index courant. Décision porteur en attente : hors garantie, backfill, ou adaptateur.
- **`comparateur-index.json` ne porte AUCUNE date de génération** dans son `meta`. Sans elle, aucun
  objet de preuve ne peut identifier l'état de donnée utilisé.
- **La source d'une preuve portant une valeur reste invisible** : `factSources` exclut les références
  à `observedValue`. Corriger en une ligne exposerait les libellés vagues du Territoire ; la séquence
  juste est d'ajouter un champ de provenance distinct de `label`, puis de migrer les deux modules.
- **`synthesize-quartier` et la synthèse Territoire n'ont AUCUN garde-fou d'assertions.** La même faute
  qu'au Logement y est possible. Leur registre d'interdits leur est propre : ne pas réutiliser
  mécaniquement la liste du Logement.
- **Page `/compte/memoire`** : elle promet « ce que futur•e sait de vous » en lisant des colonnes
  historiques SANS `user_project`, qui pilote pourtant l'analyse. Aucune faille, mais le titre est faux.
- **Le site reste fermé au crawl** (`robots.txt` en `Disallow: /`) et **aucun médiateur de la
  consommation n'est désigné** (art. L612-1). Les deux survivent aux handoffs.
