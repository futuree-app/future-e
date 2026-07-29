# Arbitrage : le foyer n'est ni une échelle ni une posture produit

- **Date** : tranché porteur 2026-07-30. Deuxième recadrage, et celui-ci ferme la question.
  Premier recadrage 2026-06-25 (découplage d'avec le comparateur), intention d'origine Notion
  avril 2026.
- **Source** : `Documentation Notion/.../02 4 — Features transversales` (intention d'origine),
  arbitrages porteur 2026-06-25 puis 2026-07-30.
- **Code** : retrait exécuté le 30/07/2026 (commit « Le mode foyer et les plans d'abonnement
  décrivaient une offre qui n'a jamais existé »).

## Ce qui est gravé

> **Le foyer n'est pas une échelle ni une posture produit. Sa composition alimente le projet de vie
> et personnalise les conclusions. La décision peut être partagée entre plusieurs personnes, mais
> l'unité métier reste le projet puis le dossier, jamais un compte foyer.**

## Pourquoi l'idée a vieilli

À l'origine, le « mode Foyer » était l'abonnement payant majeur, et le comparateur de villes son
exclusivité. Le recadrage de juin 2026 a découplé le comparateur, devenu produit public central
(`adr/ADR-0002-pivot-compatibilite-territoriale.md`), mais gardait le Foyer comme feature future
autour de **comptes multi-personnes**. **C'est ce reste qui tombe aujourd'hui.**

futur•e s'est recentré sur une décision **située** : comprendre une commune, examiner un bien,
vérifier ce qui compte pour un projet précis, décider de rester, adapter ou renoncer. Le foyer n'est
plus la bonne unité structurante. Le projet et le dossier le sont.

Trois raisons de fond, au-delà du fait que rien n'avait été construit :

- **Le moat s'est déplacé vers l'adresse.** Le produit facture un objet examinable, une commune, un
  bien, avec un dossier qui existe ou n'existe pas. Le nombre de personnes est un attribut, pas un
  objet : il ne crée ni preuve, ni artefact, ni rien que le lecteur puisse rouvrir.
- **La personnalisation par le foyer est déjà donnée.** Le questionnaire la collecte sans surcoût.
  Facturer ensuite le même geste revient à reprendre ce qui a été offert, et ça se remarque.
- **Un tarif indexé sur les personnes abîme la donnée dont il dépend.** Il pousse à sous-déclarer
  précisément là où le produit a besoin d'une déclaration honnête pour être juste.

## Ce qui disparaît

Pas de tableau de bord familial, pas de compte foyer séparé, pas de posture « foyer » à côté de
recherche / habitant / adresse, pas de données administratives sur les membres, pas d'architecture
de droits construite autour d'une entité `household`. Cela donnerait une impression de produit de
gestion du domicile, presque assurantiel ou domotique, qui n'est pas la direction.

## Ce qui reste, et qui compte

**La composition du foyer reste une donnée essentielle du projet**, parce qu'elle change
radicalement ce qui compte : enfant à venir ou déjà présent, personne âgée ou dépendante, animaux,
une ou deux voitures, télétravail, mobilité réduite, sensibilité au bruit, à la chaleur, aux pollens
ou à la pollution, deux emplois situés à deux endroits, besoins scolaires et médicaux.

Ces éléments se stockent comme **contraintes et besoins du projet**, jamais comme une entité produit
autonome. Le moteur s'en sert pour hiérarchiser Territoire, Autour et Logement.

**État du code au 30/07/2026** : partiellement fait. `user_profiles` porte déjà `presence_enfants`,
`age_enfants`, `travail_exterieur`, `vehicule_type`, `health_flags`, `life_projects`. En revanche
`WizardAnswers` ne demande pas qui vivra là (quartier, logement, métier, santé, mobilité, projets),
`UserProject` porte posture / intention / texte libre, et `HardConstraints` est purement
géographique. La composition n'atteint donc le moteur que par le texte libre, traduite en
préférences. **Chantier ouvert**, pas une régression.

## Le vrai besoin « foyer » qui subsiste : décider à plusieurs

Une décision immobilière est rarement individuelle. Celui qui paie le dossier voudra l'envoyer à sa
conjointe ou son conjoint, comparer leurs priorités, revenir ensemble sur les points à vérifier,
parfois montrer le dossier à un parent.

Cela ne demande pas un mode foyer. Cela demande, plus tard, **un dossier partageable avec les
personnes concernées par la décision** : un propriétaire, des invités, un lien de consultation, et
peut-être un jour des priorités individuelles reliées au même projet.

```text
address_dossier_members
- dossier_id
- user_id
- role: owner | viewer | contributor
```

**À ne pas ajouter maintenant.** Le `user_id` propriétaire suffit en V1. La seule obligation est de
**ne jamais écrire dans la doctrine que le dossier est individuel par nature** : il est
mono-propriétaire aujourd'hui, ce n'est pas la même chose.

## Vocabulaire

Moins de « votre foyer » dans le produit, davantage de « votre projet », « les personnes qui vivront
ici », « vos besoins quotidiens », « les personnes concernées par cette décision ». Le mot reste
juste dans une question ponctuelle (« qui vivra dans ce logement ? ») et dans la prose des pages
Savoir et Agir, où il désigne un ménage. Il n'est plus le nom d'un mode.

## Ce que le retrait a emporté dans le code

`householdModeEnabled`, `canAccessHouseholdFeatures` (un seul appelant, la page dashboard supprimée
le même jour, et elle n'ouvrait rien), les plans `suivi` et `foyer`, la branche `suivi-foyer` du
webhook, `subscription.ts` (aucun appelant). Les colonnes restent en base, plus aucune lecture.
`LEGACY_PLANS` mappe `suivi` et `foyer` vers `one_shot` à la lecture : les comptes existants portent
encore ces valeurs, et sans cette table ils s'afficheraient « Compte gratuit » en portant un accès
payant.

Effet de bord assumé : changer sa commune de résidence n'est plus réservé. La garde s'appuyait sur
ces plans et ne protégeait rien (`/api/profile` écrit `field=commune` sans consulter le plan), son
texte de repli invitait à « passer au Fil », produit écarté, et le geste n'a plus d'enjeu d'accès
depuis que la résidence n'ouvre aucun rapport par elle-même.

## Liens

`adr/ADR-0002-pivot-compatibilite-territoriale.md`, `arbitrages/pricing-abonnements-reportes.md`,
`arbitrages/recurrence-b2c-episodique-pas-mensuelle.md` (l'abonnement B2C est mort par la
fréquence ; un éventuel « suivi » sera B2B, donc un autre modèle), `vision/archetype-lecteur.md`.
