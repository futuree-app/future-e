# Recette du premier écran (chantier 6)

**Date** : 2026-08-12, **complétée le 13/08** · **Branche** : `main`, commits `a111335` à `02b2536`,
**non poussés**.
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

Le titre d'invite du hero (état « aucun projet ») a été mesuré dans les mêmes conditions : **3 à 4
lignes** à 30 px, hors carte, sur 318 px.

**Décision appliquée**, après la recette visuelle du soir (voir plus bas) : une échelle propre au
verdict, `clamp(23px, 2.9vw, 36px)`, pour les deux titres de page de cet écran. Elle règle les deux
bouts d'un coup : 23 px en mobile, où 30 px donnait sept lignes, et 36 px au plus en desktop, où 46 px
donnait une couverture de magazine et repoussait la réponse sous le pli.

### La recette visuelle du 12/08 au soir, et ce qu'elle a corrigé

La recette fonctionnelle passait, la recette VISUELLE non : le verdict commençait à **629 px** en
1440 × 1000 et à **824 px** en 390 × 844. Le chantier remontait la réponse, la navigation la
repoussait aussitôt. Huit corrections, commit `0ca1e28` :

| Constat | Correction |
|---|---|
| Deux bandeaux de navigation avant le dossier (~320 px) | Une seule ligne : commune consultée, résidence, et un lien qui COMPTE les autres communes ouvertes vers « Mes biens », qui les ouvre déjà toutes |
| 56 px (mobile) et 80 px (desktop) d'air avant « Dossier » | 28 px |
| Verdict en 46 px sur desktop, trois lignes | `clamp(23px, 2.9vw, 36px)` : la sémantique du `<h1>` impose d'être le plus grand texte de l'écran (les titres de section plafonnent à 31 px), pas une taille de couverture. Le titre d'invite suit la même échelle |
| Reformulation entière recopiée au-dessus du verdict | « Votre projet aujourd'hui · location · 3 priorités », avec « Voir et modifier » vers le texte complet |
| « 2 Rue Crébillon 44000 Nantes, **Nantes** » | Le lieu ne se recolle plus quand l'étiquette BAN le porte déjà (comparaison sans accents ni casse) |
| AskFuture en barre pleine largeur recouvrant l'entrée du verdict sur mobile | Pastille de 48 px en état fermé ; le panneau reprend toute la largeur une fois ouvert |
| Autour et Logement tous deux « Module 02 » | Logement porte le rang 03, celui de `PRODUCT_MODULES` |
| Le hero Logement promettait « entourage » | « Énergie, risques, bâti », et le texte renvoie Autour à son module |
| « Déduit de votre commune de résidence » | « Déduit du fait que votre résidence est La Rochelle » |

**Position estimée du verdict après correction**, par addition des hauteurs (à confirmer par une
capture) : environ **320 px** en desktop et **400 px** en mobile, pour des cibles de 350 et 500 px.
Cette estimation n'est pas une mesure : elle attend la capture du § 2.

---

## 2. La recette au navigateur, faite le 13/08

Menée sur compte réel, cookies affichés, comptes et captures temporaires supprimés après coup.
**Ce paragraphe remplace la liste d'attente qui suit**, qui n'est conservée que pour ce qui reste.

### 2.0 La position du verdict, mesurée

| État | Desktop | Mobile | Cible |
|---|---|---|---|
| Territoire, projet structuré | 204 px | 242 px | conforme |
| Projet non structuré | 204 px | 242 px | conforme |
| Adresse Nantes | 246 px | 309 px | conforme |
| Analyse obsolète | 330 px | 402 px | conforme |
| Dossier réel existant | 284 px | 362 px | conforme |

Cibles tenues : moins de 350 px en desktop, moins de 500 px en mobile.

Également prouvé : un seul `<h1>` pendant tout le streaming d'adresse (repli vers 400 ms,
remplacement vers 1,5 s, jamais de coexistence) ; aucun débordement horizontal à 390 px ; date et
obsolescence restent attachées à l'analyse et distinctes du projet actuel ; relations La Rochelle et
Nantes persistées séparément, projet global inchangé ; « Y revenir » remet bien le territoire actif
sur la résidence ; un changement achat vers location est enregistré sans perdre la structure, et le
parseur n'est pas appelé quand seul ce choix change ; la sonde du Logement a disparu et la checklist
passe réellement du vocabulaire acheteur au vocabulaire bailleur ; « Module 03 » et « Énergie,
risques, bâti » sont en place ; AskFuture ouvert mesure 358 px dans un viewport de 390 px.

### 2.0.1 Ce que la recette a trouvé, et qui est corrigé

| Constat | Correction |
|---|---|
| **P0 : aucun verdict sur Paris, Lyon, Marseille.** L'index est bâti par arrondissement, les codes agrégés n'y existent pas : sur un dossier PAYÉ, aucun fait, donc aucun dossier, aucun verdict, aucun `<h1>`, en silence | `codeDeLectureLocal` rend le code local que le lecteur possède (l'arrondissement de son bien, ou celui de son droit), jamais un arrondissement par défaut. L'identité d'artefact reste la commune. Ce qui reste est DIT à l'écran, porte le `<h1>`, et se journalise (`2b62546`) |
| **P1 : les territoires achetés seuls étaient introuvables.** Un grant sans adresse n'apparaissait ni dans « Mes biens » ni dans le compte des communes ouvertes | Section « Vos territoires », route de bascule par INSEE avec vérification du droit, et compte qui additionne les deux portes (`02b2536`) |
| **P1 : « Mes biens » en double dans la barre** | La destination reste dans la navigation globale, les CTA portent l'action de l'écran. L'écran de remerciement garde le sien : après un achat, répéter le chemin n'est pas du bruit (`2b62546`) |

### 2.0.2 Mis de côté, non bloquant

- Dans l'état sans projet, deux boutons « Décrire mon projet » se suivent : celui du hero et celui de
  la carte projet.
- Le panneau d'AskFuture ouvert passe sous le bandeau cookies (`z-index` 100 contre 9999). La
  pastille fermée, elle, ne recouvre plus rien.

---

## 3. Ce qui reste à vérifier, et ne peut pas l'être sans compte payé

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

### 2.2 La position du verdict, qui est l'objet même du chantier

Le début du bloc verdict doit apparaître **avant 350 px en desktop (1440 × 1000)** et **avant 500 px
en mobile (390 × 844)**. À vérifier sur les deux grains (commune seule, commune plus adresse), et
avec le bandeau cookies affiché : c'est l'état qu'un lecteur voit à sa première visite.

```js
const c = document.querySelector(".card-verdict").getBoundingClientRect();
c.top + window.scrollY;   // doit être < 350 (desktop) / < 500 (mobile)
```

### 2.3 Les invariants qui se vérifient à l'œil

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

### 2.4 Le changement d'intention seul, parseur indisponible

Sur `/rapport`, ouvrir l'éditeur, changer UNIQUEMENT l'intention, enregistrer. Puis bloquer
`/api/comparateur-vie/parse` (DevTools, « Block request URL ») et refaire la même opération. Dans les
deux cas, la reformulation doit rester affichée après rechargement, et le dossier ne doit pas
basculer en « À préciser ». La règle est testée hors navigateur (`projet-edition.test.ts`) ; ce
passage vérifie le câblage.

### 2.5 Le cas multi-communes, en entier

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

## 4. Écarts assumés par rapport au plan, et leur raison

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

## 5. État git

Vingt-et-un commits sur `main`, **rien poussé**, arbre de travail propre hors les non-suivis habituels
(`CHARTE/`, `.impeccable/`, l'archive du design system). Un push déploie en production, sans étape
Preview : il n'aura lieu qu'après la recette du § 2.
