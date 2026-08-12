# Passation — 2026-08-12, branche `main`

**Horodatage** : 2026-08-12, fin d'après-midi · **Branche** : `main` = `d74ff26`, **1 commit non
poussé**. Production à jour au commit `911b5be` (déploiement `future-gbx9od5us`, Ready, aliasé sur
`futur-e.fr` et `www.futur-e.fr`).

> Le brief précédent (04/08, chantiers charte / données / permis) est **entièrement périmé** : ses
> trois chantiers sont fusionnés et déployés. Il est archivé sous
> `docs/handoff/2026-08-11-avant-sprint-confiance.md` si besoin de sa trace.

---

## Objectif en cours

**Sprint de confiance pré-bêta**, pour qu'un testeur payant ne rencontre aucune affirmation ni
aucune preuve trompeuse. Contrainte qui gouverne tout : quelques ventes RÉELLES encaissées avant le
**20/08/2026** (activité conservée au CSP, cf. `/memory/project_csp_activite_conservee.md`).

Le sprint compte sept chantiers. **Six sont faits**, le septième (premier écran) est le prochain.
Un durcissement de quatre points est en cours sur le dernier livré, demandé par la revue externe
et **non commencé** (détail plus bas).

---

## Fait dans cette session

Trente-deux commits, du `08d6d44` au `d74ff26`. Le détail par étape, avec ce que chacune garantit
et ce qu'elle ne garantit pas, est dans **`docs/audits/2026-08-11-sprint-confiance-dossier-de-revue.md`**
(à lire avant de juger un commit isolé).

**En production** (poussé) :

- Le verdict comptait des points invérifiables à l'écran ; il compte les contrôles montrés.
- Le diagnostic choisi APRÈS l'achat n'entrait dans aucune décision (`artefactPerimeParLeDpe`).
- `RESEND_API_KEY` et `FUTUREE_ADMIN_EMAILS` posées en prod : sans elles, tout paiement réel était
  encaissé sans rien livrer (le webhook levait avant d'écrire le dossier).
- Garde-fous des synthèses : altitude retirée du payload, `validateAssertions` qui REFUSE, cache
  validé, orchestration testable (`lib/synthesis-run.ts`), bloc qui disparaît sans message.
- Chaîne de preuve : sources réelles du module Logement, lien qui démontre (`risk.catnat`), objet
  partagé `lib/decision/catnat-evidence.ts`, snapshot de données dans l'artefact, indice interne
  interdit d'affichage (garde dans `assertFactValid`).
- Bien actif : colonne `active_dossier_id` (migration 29 **appliquée en prod**), contexte de lecture
  dès le premier rendu (`lib/server/contexte-de-lecture.ts` + en-tête posé par `src/proxy.ts`),
  CTA qui portent le bien, droits d'AskFuture alignés sur `canAccessTerritory`, quota unifié
  (`quotaQuestions` dans `lib/territory-claims.ts`).

**Non poussé** (`d74ff26`, chantier 5) : l'analyse répond-elle encore au projet du lecteur.
Comparaison SÉMANTIQUE (`lib/decision/projet-materiel.ts`), bandeau + bouton
(`components/report/AnalyseAncienProjet.tsx`), route `/api/dossier/actualiser` qui produit une
version n+1, lecture de la dernière version SERVABLE, et durcissement AskFuture (une panne de quota
masque le widget au lieu de faire tomber le rapport).

---

## Décisions prises, pas encore dans le vault

1. **Porteur** : un texte de synthèse refusé par les contrôles fait disparaître **tout le bloc**,
   sans message. Une panne technique, elle, garde son message et son bouton.
2. **Porteur** : le contrat du bien actif est « **dernier bien effectivement ouvert** », pas
   « dernier sélectionné dans une liste ». Toute page qui ouvre un bien le pose.
3. **Proposé, appliqué** : la mise à jour d'une analyse après changement de PROJET se **demande**
   (bouton), quand une pièce déposée par le lecteur (diagnostic) recalcule **seule**. Doctrine :
   `docs/vault/vision/objet-central-dossier-de-decision.md`.
4. **Proposé, appliqué** : `address_dossiers.posture` reste **non matérielle** (elle n'entre pas
   dans `assemble-address-dossier`). La faire périmer produirait des versions identiques. À
   rebrancher le jour où elle entre dans la décision.
5. **Proposé, appliqué** : aucune tolérance de schéma en repli. Une colonne manquante fait échouer
   l'écran explicitement plutôt que de servir un compte vidé.

---

## État git

- `main` = `d74ff26`, **1 commit en avance sur `origin/main`** (`d74ff26` seul).
- Non suivis, volontairement hors dépôt : `CHARTE/`, `.impeccable/`, `Futur.e Design System.zip`.
- `.prive/` (ignoré) contient `artefacts-avant-regeneration-2026-08-11.json` : la seule photographie
  des anciens artefacts, fixture d'une migration future. Ne jamais commiter.
- Aucune PR ouverte. Un push sur `main` déploie, **sans étape Preview**.
- **Piège vu deux fois** : le webhook Vercel n'a pas déclenché de build sur un push. Un commit vide
  poussé le réveille. Ne PAS faire `vercel deploy` depuis le CLI, il téléverserait les 92 Mo de
  `CHARTE/`, non suivi et absent du `.gitignore`.

---

## Prochaine étape immédiate

**Le durcissement en quatre points de `d74ff26`, demandé par la revue externe, avant tout push.**
Il était commencé (lecture de `HardConstraints` en cours) et rien n'a été modifié.

1. **Bloquant** : `versionPlusRecente` (`lib/server/decision-artifact-store.ts`) confond `generating`
   et `failed`, et `/api/dossier/actualiser` traite les deux comme « déjà en cours ». Après une v2
   en échec, chaque clic répond `ok` et **aucune v3 ne naît**. Même verrou dans
   `DossierAvecLogement` (recalcul DPE), qui retente le numéro déjà réservé.
   Contrat cible : `servedVersion` (dernière prête et valide), `headVersion` + `headStatus`
   (dernière tentative) ; `generating` = attendre sans annoncer un succès ; `failed` = autoriser
   `maxVersion + 1` ; `skipped` du générateur = réponse « en cours », pas « abouti ».
2. **Bloquant** : `/api/dossier/actualiser` vérifie le droit sur `insee` et la propriété du dossier
   SANS vérifier que le dossier appartient à cette commune, et accepte un `scopeKey` hors grammaire.
   Valider `commune` | `logement:<uuid>` et imposer
   `communeParent(dossier.insee) === communeParent(insee)`.
3. **Important** : `signatureDecisionnelle` (`lib/decision/projet-materiel.ts`) ne trie que les clés
   de PREMIER niveau. Deux faux changements reproduits par la revue : mêmes `nearPlace` avec clés
   imbriquées dans un autre ordre, mêmes départements dans un autre ordre de tableau. Il faut une
   sérialisation récursive stable et normaliser les listes qui sont des ENSEMBLES (`departements`,
   `excludePlace`…). Le test « ordre des préférences et des contraintes » ne change en réalité que
   l'ordre des préférences : il ment sur sa couverture.
4. **Important** : la garantie « la v1 reste lisible » s'arrête à `.limit(5)`. Extraire le sélecteur
   d'état en fonction PURE et le tester sur `ready + generating`, `ready + failed`, payload
   invalide, et plusieurs échecs d'affilée.

Ensuite seulement : test navigateur Territoire + Adresse, push, puis **chantier 6** (premier écran,
hiérarchie seule : bien et projet, conclusion, contradictions et inconnues, actions, preuves
ensuite ; validation par captures desktop ET mobile).

---

## À lire d'abord à la reprise

1. `MEMORY.md`, puis `project_objet_central_dossier.md`, `audit_compte_reel_p0.md`,
   `project_csp_activite_conservee.md`, `piege_env_prod_vs_local.md`.
2. **`docs/audits/2026-08-11-sprint-confiance-dossier-de-revue.md`** : les 17 premières étapes, ce
   qu'elles garantissent, et où elles restent faibles.
3. `docs/vault/vision/objet-central-dossier-de-decision.md` : la thèse, les quatre niveaux
   (Profil → Projet → Candidat → Version), « un prompt n'est pas une frontière de sûreté », les huit
   invariants, l'ordre du prochain chantier.
4. `docs/audits/2026-08-11-syntheses-logement-fautives.md` : les trois textes fautifs, mot pour mot.
5. Le code du sujet courant : `lib/decision/projet-materiel.ts`,
   `lib/server/decision-artifact-store.ts`, `app/api/dossier/actualiser/route.ts`,
   `lib/decision/decision-artifact.ts`.
6. `docs/handoff/AUTO-SNAPSHOT.md` pour vérifier la fraîcheur (il date du 08/07, il est périmé).

---

## Pièges et fils ouverts

- **Stripe n'est PAS vérifié en mode Live.** C'est le seul verrou restant pour la vente, et il
  appartient au porteur : clé `sk_live_`, et surtout un endpoint webhook **Live** vers
  `https://futur-e.fr/api/stripe/webhook` dont le `whsec_` est celui posé sur Vercel. Aucun achat
  RÉEL n'a encore eu lieu.
- **Recette finale prévue, non faite** : achat réel d'un second bien dans la MÊME commune (vérifie
  la bascule du bien actif), puis `stripe events resend <id>` sur un ancien événement : le bien
  actif ne doit PAS changer (le garde `created` du webhook protège ce cas).
- **Les artefacts vendus avant le 11/08 n'ont pas de `dataSnapshot`** : leur carte du module
  Territoire retombe sur l'index courant. Décision porteur en attente : hors garantie, backfill, ou
  adaptateur de rendu.
- **`comparateur-index.json` ne porte AUCUNE date de génération** dans son `meta`. Tant qu'il n'en a
  pas, aucun objet de preuve ne peut identifier l'état de donnée qu'il a utilisé, et `catnat-1` ne
  versionne que la convention.
- **La source d'une preuve portant une valeur reste invisible** : `factSources` exclut les
  références à `observedValue`, donc la carte DPE n'affiche aucune provenance. Corriger en une ligne
  exposerait les libellés vagues du Territoire (« Territoire · Toulouse ») : la séquence juste est
  d'ajouter un champ de provenance distinct de `label`, puis de migrer les deux modules.
- **`synthesize-quartier` et la synthèse Territoire n'ont AUCUN garde-fou d'assertions.** La même
  faute qu'au Logement y est possible. Leur registre d'interdits leur est propre : ne pas réutiliser
  mécaniquement la liste du Logement (l'altitude peut y être légitime).
- **Le taux de refus des synthèses est inconnu.** Les logs portent la famille et le nombre d'essais,
  jamais le texte : mesurable dans les journaux Vercel dès les premiers dossiers.
- **Page `/compte/memoire`** : elle promet « ce que futur•e sait de vous » en lisant des colonnes
  historiques SANS `user_project`, qui est pourtant ce qui pilote l'analyse. Aucune faille de
  sécurité (vérifié : l'accès vient des seuls `claims`), mais le titre est faux. Candidat naturel du
  niveau **Profil** de l'architecture cible.
- **Le site reste fermé au crawl** (`robots.txt` en `Disallow: /`) et **aucun médiateur de la
  consommation n'est désigné** (art. L612-1). Les deux survivent aux handoffs.
