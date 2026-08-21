# Comparer deux candidats — conception

> **Date** : 2026-08-19/20. **Statut** : **EN EXPLORATION**, à ne pas intégrer. Moteur pur écrit et
> testé, **surface utilisateur non construite**, et une limite du moteur lui-même reste à traiter
> (les millésimes des données sources). Arbitrage du porteur, 20/08/2026.
> **Origine** : JL-10 du journal du 16/08/2026, et l'objet central du produit
> (`docs/vault/vision/objet-central-dossier-de-decision.md`).

## L'architecture réelle, vérifiée avant de concevoir

| Objet visé par la vision | Ce qui existe vraiment |
|---|---|
| Projet | **Un seul** JSON `user_profiles.user_project` par compte (`supabase/17_add_user_project.sql`). Pas de table `projects`, pas d'identifiant. |
| Candidats rattachés à un projet | **Absents.** `address_dossiers` (25) porte `user_id`, `ban_id`, `insee` — **aucun `project_id`**. |
| Versions d'analyse immuables | **Présentes.** `decision_artifact` (28), clé `(user_id, insee_code, scope_key, version)`, `scope_key = 'commune' \| 'logement:<dossier_id>'`. |
| Critères, faits, preuves, inconnues | **Présents dans l'artefact** : `dossier.criteria.registry` (une ligne par critère DÉCLARÉ, avec son issue), `sections[].cards`, `narrativePlan`. |
| Contrôles prioritaires | **Présents** : `narrativePlan.priorityControl`, déterministe, action reprise mot pour mot de la carte. |
| Droits liés au paiement | **Présents** : le droit EST l'existence de la ligne `address_dossiers`, RLS `auth.uid() = user_id and access_revoked_at is null`. |

**Conséquence.** Comparer « deux candidats d'un même projet » est impossible aujourd'hui sans inventer
un modèle. Comparer **deux dossiers du même compte, explicitement sélectionnés**, ne demande aucune
migration : les deux artefacts existent déjà, immuables et datés.

## Ce qui a été construit

`src/lib/decision/comparaison-candidats.ts` — pur, testé (13 tests), aucune I/O.

Entrée : deux `{ id, label, artifact }`. Sortie : une lecture croisée, **sans note et sans gagnant** :

- par candidat : verdict **vendu** (repris mot pour mot), ce qui **correspond**, ce qui **contredit**,
  les **compromis**, les **inconnues** (avec `no_rule` / `inconclusive`), les **contrôles prioritaires**
  (verbatim), la **couverture**, la **version et la date** de l'analyse ;
- par critère déclaré : une ligne, l'état de chaque côté, et une **relation** ;
- les critères qu'**un seul** des deux dossiers connaît, nommés et jamais écartés en silence.

### L'axe de comparaison, et pourquoi c'est le seul honnête

On croise les **critères déclarés par le lecteur** et l'**issue** que chaque dossier leur a donnée.
Jamais les valeurs mesurées : deux mesures peuvent porter sur des grains, des millésimes ou des
périmètres différents, et l'artefact ne permet pas toujours de le savoir. Une issue, elle, est
produite par un moteur nommé et versionné.

### Le garde-fou : le cadre d'analyse, et ce qu'il ne couvre pas

Deux dossiers se lisent dans le **même cadre** si le **même moteur**, les **mêmes conventions**, le
**même projet** et la **même échelle** les ont produits. Sinon un écart peut venir du cadre autant
que du lieu : la relation devient `difference_hors_cadre_commun` et `comparabilite.reserves` dit
pourquoi, phrase par phrase. La signature de projet réutilise `signatureDecisionnelle`
(`projet-materiel.ts`) : une seconde définition du « même projet » aurait fini par déclarer
comparable ce que l'autre déclare périmé.

**Le cadre ne suffit pas, et c'est le défaut à traiter avant toute surface.** Les **millésimes des
données sources** ne sont pas comparés. Deux dossiers du même moteur, sous les mêmes conventions et
pour le même projet, peuvent avoir lu une BPE 2024 d'un côté et une BPE 2025 de l'autre, ou deux
états d'un index régénéré entre-temps. La différence viendrait alors d'une **mise à jour de donnée**,
et le module la présenterait comme une différence entre deux lieux — exactement le mensonge qu'il
existe pour empêcher. Le champ a donc été renommé `memeCadreDAnalyse` : il dit ce qui est mesuré, et
non ce qu'on aurait aimé conclure. Traiter le fond suppose que l'artefact porte les millésimes des
sources qu'il a lues, ce qui n'est aujourd'hui garanti pour aucune source.

## Ce qui bloque la surface utilisateur

1. **Décision produit, tarifaire.** Deux dossiers d'adresse ont été payés séparément (39 € ou 25 €).
   La comparaison est-elle **incluse** dans le fait de posséder les deux, ou est-elle un produit
   (le « Dossier comparatif » à 39 € existe déjà, mais pour **2 ou 3 communes**, ADR-0007) ? Les deux
   réponses sont défendables et elles ne produisent pas la même page. JL-09/JL-10 sont explicitement
   classés « Exploration » : un seul signal ne tranche pas un prix.
2. **Décision produit, de cadrage.** Une comparaison n'a de sens qu'entre finalistes. Faut-il
   l'ouvrir à deux dossiers quelconques du compte, ou attendre l'objet « projet » qui les rassemble ?
   La question 4 de relance du journal (« deux biens réellement finalistes ? même commune ? ») n'a
   pas de réponse.
3. **Question de moteur.** Que veut dire exactement « différence attribuable au lieu » ? Tant que
   les millésimes des sources ne sont pas dans l'artefact, la réponse ne peut pas être « le cadre
   concorde ».
4. **Contexte technique.** Au moment de cette passe, un chantier en cours modifie `address-dossier-store.ts`,
   `decision-artifact.ts` et `/rapport` — exactement les fichiers qu'une page de comparaison doit lire.

## La tranche minimale suivante, quand la décision sera prise

1. Un lecteur serveur `chargerCandidatsComparables(userId, [dossierIdA, dossierIdB])` : deux lignes
   `address_dossiers` **du même `user_id`**, non révoquées, et leur **dernière version prête**
   d'artefact. Aucune écriture, aucune régénération, aucun accès croisé possible.
2. Une page `/rapport/comparer?a=…&b=…` qui rend `comparerDeuxCandidats`, avec en tête les réserves de
   comparabilité quand il y en a, et sous chaque colonne la date et la version de l'analyse.
3. La sélection : la liste de dossiers existante, deux cases, un bouton. Rien de plus.

Aucune de ces trois étapes ne demande de migration.
