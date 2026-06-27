# Rapport éditorial — 6 questions en tension candidates (accueil)

Date : 2026-06-27 · Agent : Editorial Writer · Mode : read-only (aucune modif code)

Terrain lu : `docs/vault/doctrine/editoriale.md` ; catalogue canonique
(`tensions_catalog` Supabase, colonnes `label_template` / `subtitle`, chargé dans
`src/components/FutureELanding.tsx` l.1055) ; mécanique de dédup
`dedupeTensions` (l.203-214 : la clé de dédoublonnage est `tension.id.split('_')[0]`,
donc **le préfixe d'id fait foi** — deux questions au même préfixe ne coexistent jamais).
Fiches mémoire : croissance_demographique (« décrire jamais juger »),
exposition_industrielle (« récit sans chiffre, gaté », la donnée est un signal de
présence, pas une mesure), feedback_signature_identitaire, feedback_no_em_dash.

## Rappel de la voix du catalogue (à épouser)
Interrogation directe, souvent 1re personne (« mon », « mes »), centrée sur LE LECTEUR
et son projet de vie, pas sur la commune ni le critère. Sous-titre = 3 enjeux concrets
en noms pleins séparés par virgules (« Chaleur, nuits tropicales, santé »). Jamais un
chiffre, jamais le libellé du critère, jamais la réponse (sinon ça cannibalise le rapport).

---

## 1. « Trouver le calme à {commune} ? » · *Bruit routier, rail, aérien*

**Verdict : À RETOUCHER (sous-titre seulement).**

Où ça touche juste : « Trouver le calme » nomme ce que le lecteur VIENT CHERCHER, pas le
critère `calme_sonore`. C'est exactement la voix : on part de son désir, la donnée arrive
après. La tension (je viens pour la tranquillité, mais suis-je sous un couloir aérien ?)
est un vrai dilemme de projet de vie.

Ce qui accroche : « rail » et « aérien » sont des mots d'ingénieur, pas du registre du
catalogue qui emploie des noms pleins et concrets (« nuits tropicales », « école »).
« rail » sonne comme une étiquette de jeu de données.

**Label final :** `Trouver le calme à {commune} ?`
**Sous-titre final :** `Routes, voie ferrée, avions`

---

## 2. « Vivre sans voiture à {commune} ? » · *Tram, métro, marche*

**Verdict : À RETOUCHER + alerte cohérence (dédup).**

Où ça touche juste : « Vivre sans voiture » parle du mode de vie du lecteur, pas du réseau.
Inverse honnête de la question dépendance-auto.

Deux points :
- **Promesse.** Le critère `mobilite_quotidienne` mesure un réseau TC urbain crédible à
  pied (tram/métro), il ne garantit pas qu'on PEUT vivre sans voiture. La forme
  interrogative protège (« est-ce possible ? »), mais « sans voiture » reste un absolu.
  Une variante plus juste, registre projet de vie : « Lâcher la voiture à {commune} ? ».
  Arbitrage de ton que je POSE, je ne tranche pas : version A garde l'accroche forte,
  version B est plus fidèle à la preuve.
- **Dédup (cohérence à régler par le porteur, hors prose).** La clé de dédoublonnage est
  le préfixe d'id. Si cette question et « repose-t-il trop sur la voiture ? » partagent un
  préfixe (`voiture_…` / `auto_…`), elles fusionnent et une seule s'affiche. Comme elles se
  déclenchent sur des signaux opposés (réseau crédible vs dépendance), elles ne devraient
  de toute façon jamais coexister — mais donne-leur des **préfixes d'id distincts** pour
  que la dédup ne masque pas par accident.

Sous-titre : « Tram, métro, marche » est bon et concret ; je ne lie pas « marche » en
« à pied » par cohérence avec le rythme nominal des autres (« marche » est un nom plein).

**Label final (option A, accroche) :** `Vivre sans voiture à {commune} ?`
**Label final (option B, plus fidèle) :** `Lâcher la voiture à {commune} ?`
**Sous-titre final :** `Tram, métro, marche`

---

## 3. « {commune} change-t-elle trop vite ? » · *Nouveaux arrivants, prix, services*

**Verdict : À RÉÉCRIRE.**

Deux fautes de voix :
- **Le « trop » juge.** Il présuppose la saturation/flambée avant toute donnée. La fiche
  croissance_demographique tranche : « décrire, jamais juger ». L'optimisme fabriqué a un
  jumeau, le pessimisme fabriqué : « trop vite » en est un.
- **La commune est sujet, le lecteur a disparu.** Le catalogue dit « MON mode de vie »,
  « MES enfants », « MA retraite ». Ici on parle de la commune, le lecteur devient
  spectateur (cf. doctrine « la page s'adresse au lecteur, pas à elle-même »).

Réécriture qui recentre sur l'action du lecteur et retire le jugement, en gardant la
tension (arriver dans une commune qui attire : dynamisme ou prix qui montent) :

**Label final :** `S'installer à {commune} pendant qu'elle change ?`
**Sous-titre final :** `Nouveaux arrivants, prix, écoles`

(« services » → « écoles », plus concret et moins administratif ; « prix » porte déjà le
risque de flambée sans l'asséner.)

---

## 4. « Une vraie vie à {commune}, ou une commune-dortoir ? » · *Commerces, cafés, assos*

**Verdict : À RÉÉCRIRE.**

« commune-dortoir » stigmatise le lieu où des gens vivent déjà : c'est un jugement dur posé
sur le territoire, contraire à « ne stigmatise jamais un territoire ». Et le label est long
(deux propositions opposées) là où le catalogue est ramassé.

Ce qui marche et qu'on garde : « Une vraie vie » nomme ce que le lecteur cherche (du lien,
pas le désert social). On garde l'âme, on coupe l'insulte. La nuance « dortoir » sera
portée par la réponse de Claude, pas par l'accroche.

**Label final :** `Une vraie vie locale à {commune} ?`
**Sous-titre final :** `Commerces, cafés, associations`

(« assos » → « associations » : registre écrit du catalogue, mots pleins.)

---

## 5. « Le passé industriel de {commune} a-t-il laissé des traces ? » · *Sols, anciens sites*

**Verdict : À SUPPRIMER de l'accueil (pouvoir tranchant).**

Cette question ne devrait pas exister en hameçon, pour trois raisons cumulées :

1. **Elle promet au-delà de la preuve (invariant n°5).** « a-t-il laissé des traces ? »
   insinue une contamination. Or la fiche exposition_industrielle est explicite : la donnée
   est un **signal de présence**, pas une mesure de pollution, et le récit doit rester
   **sans chiffre et gaté**. En accroche, on tend une promesse (« y a-t-il un risque
   sanitaire ? ») que la réponse honnête ne peut pas tenir (« on sait juste qu'il y a eu de
   l'industrie »). Soit on sous-promet et c'est mou, soit on alarme et c'est malhonnête.
2. **Elle stigmatise la commune ouvrière.** Réduire un territoire à un soupçon de séquelle
   toxique, en première impression, est exactement ce que la doctrine interdit.
3. **Ce n'est pas un dilemme, c'est une inquiétude unilatérale.** Le catalogue pose des
   ARBITRAGES (calme contre bruit, acheter contre risque). Ici il n'y a pas de « je viens
   chercher X, mais » : juste une alerte. Tension factice côté accroche.

Ce sujet est légitime, mais à sa place : DANS le rapport (module Santé environnementale),
où le contexte, les limites de la donnée et l'absence de mesure peuvent être posés
honnêtement. En vitrine, le silence est plus honnête que l'alarme manufacturée.

(Si le porteur tient absolument à une porte d'entrée santé-environnement, la version
dé-alarmée et recentrée lecteur serait : `Élever mes enfants à {commune} ?` avec un
sous-titre incluant « sols, air » — mais cette question EXISTE DÉJÀ au catalogue. Donc :
rien à ajouter, le besoin est couvert.)

---

## 6. « Étudier (ou élever des étudiants) à {commune} ? » · *Campus, vie étudiante*

**Verdict : À RÉÉCRIRE (cible à trancher par le porteur).**

Deux problèmes :
- **« élever des étudiants » est faux en français** (on élève des enfants, pas des
  étudiants) et la parenthèse dédouble la cible, ce qui alourdit. Le catalogue ne bégaie
  jamais sa cible.
- **L'étudiant qui choisit sa ville d'études n'est pas l'archétype futur•e** (moment de vie,
  installation moyen terme, climat à 20 ans). Le lecteur, ici, c'est plutôt le PARENT dont
  l'ado approche, ou celui qui s'installe et veut une ville vivante toute l'année.

Deux réécritures selon la cible que tu retiens (j'expose, je ne tranche pas) :

- **Option parent (épouse « Élever mes enfants ») :**
  Label : `Mes enfants pourront-ils étudier près de {commune} ?`
  Sous-titre : `Campus, logement, vie étudiante`
  Risque : préfixe d'id proche de `enfants_…` → vérifier la dédup pour ne pas qu'elle
  écrase « Élever mes enfants à {commune} ? ».

- **Option vitalité (capte la vraie tension « ville qui se vide l'été ») :**
  Label : `{commune}, vivante toute l'année ?`
  Sous-titre : `Étudiants, animation, hors-saison`
  Attention : chevauche la Q4 (vie locale) ; à réserver aux pôles franchement étudiants.

Je recommande l'**option parent** : plus alignée sur l'archétype et le reste du catalogue.

---

## 7e question proposée (dans l'esprit du catalogue)

Le catalogue couvre acheter, étés, voiture, baignade, enfants, électrique, retraite. Le
**moment de vie central de l'archétype futur•e — le départ de la métropole — n'a pas son
accroche.** C'est pourtant le dilemme le plus pur (gagner en cadre de vie, perdre en
services/emploi/lien). En voix, 1re personne implicite, vrai arbitrage :

**Label :** `Quitter la ville pour {commune} ?`
**Sous-titre :** `Cadre de vie, services, isolement`
Déclencheur naturel : commune rurale/péri-urbaine attractive. Ne cannibalise aucun rapport.

(Seconde idée, plus modulaire, si un signal hydrique est disponible : `Manquera-t-on d'eau
à {commune} ? · Sécheresse, restrictions, jardin` — dilemme fort pour qui a un projet de
jardin/terrain, déclenché par `tension_hydrique_connue`.)

---

## Synthèse des verdicts
| # | Candidate | Verdict |
|---|-----------|---------|
| 1 | Trouver le calme | Retoucher (sous-titre) |
| 2 | Vivre sans voiture | Retoucher + alerte dédup |
| 3 | change trop vite | Réécrire (retirer le jugement, recentrer lecteur) |
| 4 | commune-dortoir | Réécrire (retirer le stigmate) |
| 5 | passé industriel | **Supprimer de l'accueil** |
| 6 | élever des étudiants | Réécrire (cible à trancher) |
| 7 | (proposée) Quitter la ville | Ajouter |

## Version minimale (~90 % de la valeur)
Si tu ne fais qu'UNE chose par carte : Q1 « rail, aérien » → « voie ferrée, avions » ;
Q3 retire le mot « trop » ; Q4 retire « commune-dortoir » ; Q5 **désactive-la** ; Q6
retire « (ou élever des étudiants) ». Ces cinq micro-gestes captent l'essentiel ; le reste
est du raffinement.

## Cohérence à poser au porteur (hors prose)
- Préfixes d'id : Q2 vs question dépendance-auto, et Q6 option-parent vs « Élever mes
  enfants », doivent avoir des préfixes distincts sinon `dedupeTensions` en masque une.

## Mise à jour doctrine suggérée
Ajouter à `editoriale.md`, section « ce que futur•e ne fait pas » : *« Une accroche
(question en tension) doit poser un ARBITRAGE, pas une inquiétude unilatérale, et ne jamais
promettre une réponse que la donnée ne peut tenir honnêtement (cas du signal de présence
industrielle : présence ≠ mesure). En vitrine, le silence est plus honnête que l'alarme. »*

## Limites de mon regard
- Je n'ai pas le rendu visuel des cartes : la longueur réelle d'un label (ex. « S'installer
  à {commune} pendant qu'elle change ? » avec une commune longue type
  « Saint-Germain-en-Laye ») peut casser la mise en page. À vérifier par le Design Critic.
- Je juge la prose, pas la conversion : je ne sais pas si « Lâcher la voiture » convertit
  mieux que « Vivre sans voiture ». J'arbitre la justesse, pas le taux de clic (terrain du
  Product). Un A/B me ferait peut-être réviser l'option retenue en Q2/Q6.
- Je n'ai pas vérifié quel critère exact déclenche chaque question dans le code de
  `buildTensions` : je me fie aux déclencheurs décrits dans le mandat. Si un déclencheur
  diffère, la promesse d'une accroche peut changer.

## Quand rouvrir ce sujet
- Q5 (industriel) : à réintégrer le jour où la donnée passe de « présence » à « mesure »
  exploitable et gatée dans le rapport — alors une accroche honnête redevient possible.
- Q2/Q6 : rouvrir si un A/B montre une accroche perdante, ou si l'archétype s'élargit
  officiellement à l'étudiant-décideur.
- Q3/Q4 : rouvrir si un test utilisateur montre que la version dé-jugée perd la tension
  (trop neutre pour accrocher).
