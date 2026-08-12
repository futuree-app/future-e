# Recette du premier écran (chantier 6)

**Date** : 2026-08-12 · **Branche** : `main`, commits `a111335` à `194c329`, **non poussés**.
**Plan** : `docs/superpowers/plans/2026-08-12-premier-ecran-decision.md` ·
**Spec** : `docs/superpowers/specs/2026-08-12-premier-ecran-decision-design.md`.

Les dix tâches du plan sont écrites. Ce document sépare ce qui est **vérifié** de ce qui **reste à
vérifier au navigateur, avec un compte payé** : ces états ne se produisent pas sans données réelles,
et personne ne doit lire cette note comme une recette terminée.

---

## 1. Ce qui est vérifié

| Vérification | Résultat |
|---|---|
| `npx tsc --noEmit` | aucune sortie |
| `node --test "src/**/*.test.ts"` | **1412 tests, 0 échec** (1405 avant le chantier, 7 ajoutés) |
| `npm run build` | compilation complète, toutes les routes rendues |
| `npm run lint` | aucune erreur nouvelle ; seul l'avertissement préexistant `account` sur `rapport/page.tsx` |
| `grep "En une minute"` dans le rendu | plus aucune occurrence hors commentaires et harnais `/dev/dossier` |
| `grep "#horizon"` | aucune occurrence : aucun lien interne ne visait la barre retirée |
| `grep "ProjectProbe\|projetDepuisLaSonde"` | plus aucune occurrence hors commentaires d'historique |
| `grep "report_relation_corrected\|report_relation_selector_opened"` | plus aucune occurrence hors commentaire |
| Rendu des routes `/rapport`, `/rapport/logement`, `/rapport/quartier` en dev | 200, aucune erreur serveur (session absente : redirection normale) |

### La mesure du titre, faite et tranchée

Rendu réel dans Chromium (Playwright), viewport 360 px, police du site.

- Le headline déterministe est borné à **130 caractères** (`HEADLINE_MAX_CHARS`, `conclusion-plan.ts`).
- À 360 px, la carte du verdict laisse **270 px** au titre.
- À `--text-display` (**30 px** à cette largeur), les phrases les plus longues du corpus prennent
  **7 à 8 lignes**.
- À `--text-title` (**23 px**), les mêmes phrases tiennent en **5 lignes**.

**Décision appliquée** : `max-sm:text-[length:var(--text-title)]` sur la classe passée par `/rapport`.
Le repli ne vaut que pour le mobile ; au-delà de `sm`, la réponse garde la taille du titre de page,
sans quoi elle resterait plus petite que les titres de section situés sous elle.

Le titre d'invite du hero (état « aucun projet ») a été mesuré dans les mêmes conditions : **3 à 4
lignes** à 30 px, hors carte, sur 318 px. Il reste en `--text-display`, sans repli.

---

## 2. Ce qui reste à vérifier, et ne peut pas l'être sans compte payé

### 2.1 Les quatre contenus du hero, desktop ET mobile (360 px)

1. payant, projet structuré (le verdict porte le `<h1>`) ;
2. payant, projet présent mais `parsed` nul (« À préciser » plus bouton « Décrire mon projet ») ;
3. payant, aucun projet (l'invite écrite par la page) ;
4. non payant (hero commercial, inchangé).

**Ne pas mutiler un compte réel à la légère.** Ordre de préférence, repris du plan :

1. **Un compte jetable** : le créer, lui poser un droit sur une commune à la main
   (`insert into report_grants …`), le supprimer après. Rien à restaurer, donc rien à oublier de
   restaurer.
2. À défaut, sur le compte de recette, avec sauvegarde exacte et **preuve** de restauration :

```sql
-- 1. Sauvegarder le JSON exact
create temp table sauvegarde_projet as
  select user_id, user_project from user_profiles where user_id = '<id>';
select user_project from sauvegarde_projet;  -- copier aussi le résultat hors de la base

-- 2. État « projet présent, parsed nul »
update user_profiles set user_project = user_project - 'parsed' where user_id = '<id>';

-- 3. État « aucun projet »
update user_profiles set user_project = null where user_id = '<id>';

-- 4. Restaurer, puis PROUVER que la restauration est exacte
update user_profiles p set user_project = s.user_project
  from sauvegarde_projet s where p.user_id = s.user_id;
select (p.user_project = s.user_project) as identique
  from user_profiles p join sauvegarde_projet s on s.user_id = p.user_id;
-- doit rendre `t`. Si `f` ou aucune ligne : restaurer depuis la copie prise à l'étape 1.
```

L'état non payant **ne se produit pas en dégradant le compte de recette** : il se lit avec un compte
sans droit sur la commune. Retirer un droit payé serait la seule manipulation vraiment irréversible
de cette liste.

### 2.2 Les invariants qui se vérifient à l'œil

- Un seul `<h1>` : `document.querySelectorAll("h1").length === 1` sur les quatre états, et **deux
  fois sur un dossier d'adresse** : pendant le repli communal, puis après résolution du stream. La
  taille du titre doit être la même aux deux instants (elle l'est par construction : `TITRE_VERDICT`
  traverse les trois points de montage et `DossierAvecLogement`).
- Les deux grains couverts explicitement : une commune SEULE et une commune AVEC adresse.
- Aucun débordement horizontal à 360 px : `document.documentElement.scrollWidth <= window.innerWidth`.
- La date de l'analyse n'apparaît QUE dans le bloc du dossier, jamais au-dessus.
- Sur un dossier dont le projet a matériellement changé, le bandeau d'obsolescence et la ligne
  « Votre projet aujourd'hui » restent deux blocs distincts.
- Le module Logement n'affiche plus la sonde, et la checklist suit le projet du compte : changer
  l'intention sur `/rapport` doit changer la liste.
- Depuis Territoire, « Modifier le projet » dépose sur l'éditeur, sous la navbar.

### 2.3 Le changement d'intention seul, parseur indisponible

Sur `/rapport`, ouvrir l'éditeur, changer UNIQUEMENT l'intention, enregistrer. Puis bloquer
`/api/comparateur-vie/parse` (DevTools, « Block request URL ») et refaire la même opération. Dans les
deux cas, la reformulation doit rester affichée après rechargement, et le dossier ne doit pas
basculer en « À préciser ». La règle est testée hors navigateur (`projet-edition.test.ts`) ; ce
passage vérifie le câblage.

### 2.4 Le cas multi-communes, en entier

Compte résidant en commune A, dossier en commune B :

1. lire A, poser « J'y vis », recharger : la valeur tient ;
2. ouvrir B : le sous-contrôle dit « Pour B » et propose la valeur inférée, pas celle de A ;
3. poser « J'envisage d'y vivre » sur B, revenir sur A : A est intacte ;
4. le projet (objectif, intention, texte) est identique tout du long.

```sql
select insee, relation, relation_source from report_context where user_id = '<id>' order by insee;
```

Attendu : une ligne par commune, aucune écrasée par l'autre.

---

## 3. Écarts assumés par rapport au plan, et leur raison

1. **Le panneau compact des échelles disparaît complètement**, pas seulement en payant. Le plan le
   disait conservé en gratuit ; il n'y existait pas, sa condition de rendu étant `fullReport`. Rien
   n'est donc perdu pour le compte gratuit.
2. **Le CTA « Voir mes trois échelles » est retiré de la section climat descendue.** Il pointait vers
   `#modules`, qui commence maintenant quelques lignes plus bas : un bouton d'ancre vers le bloc
   immédiatement suivant ne fait rien avancer. Le CTA du hero commercial (« Ouvrir le dossier »),
   lui, est inchangé.
3. **La barre d'horizon disparaît aussi du rendu gratuit**, où elle s'affichait verrouillée. Elle
   quittait le hub par décision du porteur, et la garder pour le seul compte gratuit aurait laissé la
   consigne « Choisissez un horizon » sans objet. Le paragraphe a été réécrit dans les deux états.
4. **`contenuDuHero` reçoit `communeName`, non `displayName`.** Le repli du module (« ce territoire »)
   est prévu et testé ; `displayName` aurait produit « et votre commune se lira à cette aune ». En
   pratique la branche est théorique : `fullReport` implique un code INSEE, donc une commune connue.
5. **`intent: null` reste indistinguable de « pas encore répondu ».** Le stockage n'a pas de troisième
   valeur, et « Ni l'un ni l'autre » apparaît donc actif d'emblée sur un projet neuf. Distinguer les
   deux demanderait une migration, hors périmètre.
6. **`src/components/report/logement/posture.ts` est orphelin** (aucun import, y compris avant ce
   chantier). Laissé en place : sa suppression n'appartient pas à ce lot.

---

## 4. État git

Dix commits sur `main`, **rien poussé**, arbre de travail propre hors les non-suivis habituels
(`CHARTE/`, `.impeccable/`, l'archive du design system). Un push déploie en production, sans étape
Preview : il n'aura lieu qu'après la recette du § 2.
