# FUT-83 · Ce que le registre change pour un acheteur

**Date** : 27/10/2026. Les faits sur le registre viennent de `sources-et-champs.md`, la fiabilité du rattachement de
`rattachement.md`.

---

## 0. Ce que futur•e sait déjà d'un appartement (code de `main` au 27/10/2026)

| Information | Source | Appelée en production | Dans le contrat | Visible dans le dossier | Utilisée par la décision |
|---|---|---|---|---|---|
| Adresse, point, identifiant BAN | BAN | oui | oui | oui | oui (ancrage) |
| Bâtiment RNB : identifiant, autres adresses, ambiguïté | RNB (`src/lib/rnb.ts`) | oui | oui (FUT-80) | oui (passeport) | garde-fou de l'attribution du DPE |
| Parcelle | API Carto cadastre (`src/lib/cadastre.ts`) | oui | oui | oui | non |
| DPE du logement : étiquette, année de construction, surface, étage, `nombre_appartement` et surface de l'immeuble pour un DPE d'immeuble | ADEME (`src/lib/dpe.ts`) | oui | oui | oui | oui (énergie, confort d'été) |
| Numéro de copropriété **sur le DPE** (`numero_immatriculation_copropriete`) | ADEME | **non** : le champ existe, il n'est pas sélectionné | non | non | non |
| Audit énergétique de l'immeuble, et son numéro de copropriété quand il est publié | ADEME (`src/lib/audit-record.ts`) | oui | oui (`copropriete`, optionnel) | oui, une phrase : « immatriculé comme copropriété (n° …) : les travaux s'y décident en assemblée générale » (`src/lib/audit-lecture.ts:390`) | non |
| Caractéristiques BDNB (lots, niveaux, numéro de copropriété principal) | BDNB | **non** (écarté par FUT-80) | non | non | non |
| Copropriété (registre) | RNIC | **non** | non | non | non |
| Projet : achat ou location, posture | Saisie du lecteur (`src/lib/user-project.ts`) | oui | oui | oui | oui |

futur•e **ne sait donc rien** aujourd'hui de la copropriété d'un appartement, sauf, rarement, qu'un audit d'immeuble
porte un numéro.

---

## 1. Ce que l'acheteur reçoit de toute façon (droit en vigueur au 27/10/2026)

Le registre se compare à ce que la loi impose déjà de lui donner. C'est le cœur de l'arbitrage.

**Dans l'annonce** (L721-1 du CCH, en vigueur depuis le 01/01/2022) : le bien est en copropriété, **le nombre de
lots**, les charges courantes annuelles moyennes du vendeur, **et si le syndicat fait l'objet d'une procédure**
(mandat ad hoc, administration provisoire, carence).

**Au plus tard à la promesse** (L721-2 du CCH, en vigueur depuis le 01/01/2024), ou au projet d'acte s'il n'y a pas de
promesse :

| Pièce | Ce qu'elle apprend | Condition |
|---|---|---|
| Fiche synthétique de la copropriété (article 8-2 de la loi de 1965) | Identification, syndic, nombre de lots, données financières et techniques essentielles | toujours, sauf acheteur déjà copropriétaire |
| Règlement de copropriété et état descriptif de division | Ce qui est commun, ce qui est privatif, la répartition des charges | idem |
| Procès-verbaux des assemblées des **trois dernières années** | Travaux votés, contentieux, débats en cours | sauf si le vendeur n'a pu les obtenir du syndic |
| Charges payées par le vendeur sur les deux exercices précédents | Le coût réel **du lot** | toujours |
| Sommes qui resteront dues par l'acquéreur | Appels de fonds votés, à venir | toujours (dispense possible pour les petits syndicats relevant du 2e alinéa de l'article 14-3, **conditions non revérifiées**) |
| État global des impayés de charges et des dettes fournisseurs | La santé financière **collective** | idem |
| Fonds de travaux : part du lot et dernière cotisation | Ce qui est déjà provisionné, et qui reste à la copropriété à la vente (14-2-1, III) | s'il existe |
| Carnet d'entretien | Historique des travaux et contrats | toujours |
| Notice d'information | Droits et obligations | toujours |
| Conclusions du diagnostic technique global | État du bâti, travaux à 10 ans | **le cas échéant** : le DTG n'est pas toujours obligatoire |
| Plan pluriannuel de travaux adopté, à défaut son projet | Travaux et coût sur 10 ans | Le projet est obligatoire depuis le 01/01/2025 pour les immeubles d'habitation de plus de 15 ans, quelle que soit leur taille (Service public, vérifié le 08/06/2026). Dispense si un DTG ne prévoit aucun travaux à 10 ans |

Dispenses : un acheteur **déjà copropriétaire** dans la même copropriété ne reçoit pas les pièces 1° et 3° à 7°, et
un **lot annexe** seul (cave, parking) en reçoit moins.

**Le fonds de travaux** (14-2-1, en vigueur depuis le 01/01/2023) : obligatoire au bout de dix ans après la
réception de l'immeuble, cotisation d'au moins 5 % du budget prévisionnel (et d'au moins 2,5 % des travaux du plan
adopté). Les sommes **ne sont pas remboursées au vendeur** : elles restent attachées au lot.

**À l'acte**, l'état daté (établi par le syndic) arrête les comptes entre vendeur et syndicat. Article 5 du décret du
17/03/1967, **non revérifié sur Légifrance dans cet audit**.

**Conséquence** : le nombre de lots et l'existence d'une procédure figurent déjà dans l'annonce. Les charges, les
impayés, les travaux votés et à venir, le fonds de travaux ne figurent que dans ces pièces. **Le registre ouvert n'en
contient aucun.**

---

## 2. Les quatre scénarios

### A. Achat d'un appartement ancien dans une grande copropriété

| | |
|---|---|
| **Ce que futur•e sait déjà** | Le bâtiment (RNB), ses autres entrées, le DPE du logement s'il existe, parfois un DPE ou un audit d'immeuble |
| **Ce que le registre ajouterait** | Dans 4 cas sur 10 environ : le numéro, le nom d'usage, le nombre de logements déclarés de **toute** la copropriété, le syndic s'il est professionnel, un rattachement à une ASL ou une AFUL, une résidence-service |
| **Ce qui pourrait changer dans la décision** | Presque rien directement. L'acheteur sait déjà, par l'annonce, que le bien est en copropriété et combien de lots elle compte. Une ASL ou une AFUL signale une seconde source de charges, à demander |
| **Ce qui reste inconnu** | Charges du lot, impayés, travaux votés, fonds de travaux, plan pluriannuel, procédures, arrêtés |
| **À demander** | PV des trois dernières assemblées, plan (ou projet de plan) pluriannuel de travaux, état des impayés et des dettes, part du fonds de travaux, statuts et charges de l'ASL le cas échéant |
| **En langage courant** | « Cet appartement fait partie d'une copropriété d'environ 120 logements. Les travaux à venir et leur coût se lisent dans les procès-verbaux d'assemblée et le plan de travaux, que le vendeur doit vous remettre. » |

### B. Petite copropriété contre grande copropriété

| | |
|---|---|
| **Ce que futur•e sait déjà** | Rien sur la taille de la copropriété ; parfois `nombre_appartement` d'un DPE d'immeuble |
| **Ce que le registre ajouterait** | Le nombre de logements déclarés, quand le rattachement est unique |
| **Ce qui pourrait changer** | **Des questions, pas un risque.** Le registre ne permet pas de dire qu'une petite copropriété est plus fragile : il ne publie ni ses finances ni ses travaux. Dans les copropriétés de 5 logements ou moins, 67 % n'ont même pas de type de syndic renseigné. Une petite copropriété invite plutôt à demander qui gère (syndic bénévole ou professionnel), comment se répartissent les gros travaux entre peu de propriétaires, et si un fonds de travaux est constitué |
| **Ce qui reste inconnu** | Tout ce qui détermine le coût et la gestion |
| **À demander** | « Qui est le syndic, et depuis quand ? » ; « Combien le fonds de travaux contient-il ? » ; « Quels travaux le plan pluriannuel prévoit-il, et pour quelle quote-part ? » |
| **En langage courant** | « Copropriété de 6 logements. Dans une petite copropriété, chaque gros travaux pèse lourd sur chaque propriétaire : demandez le montant du fonds de travaux et le plan de travaux prévu. » |

L'acheteur qui compare deux annonces a **déjà** le nombre de lots dans chacune (L721-1). Le registre peut au mieux le
recouper. Le recoupement lui-même est piégé : le total de l'annonce compte les caves et les parkings (« 46 lots » au
Pagnol de Bruz pour 18 logements).

### C. Copropriété sous procédure administrative

| | |
|---|---|
| **Ce que futur•e sait déjà** | Rien |
| **Ce que le registre ajouterait** | **Rien dans le fichier ouvert.** Les procédures et les arrêtés n'y ont jamais figuré, malgré la loi et la notice. Seul l'annuaire les affiche, fiche par fiche, sans API ni licence de réutilisation |
| **Ce que signifient ces procédures** (articles cités) | Le **mandat ad hoc** (article 29-1 A de la loi de 1965) : le juge désigne un mandataire pour analyser une situation d'impayés importants et proposer des mesures ; c'est un signal précoce, pas une faillite. L'**administration provisoire** (29-1) : le juge confie la gestion à un administrateur quand l'équilibre financier est gravement compromis. L'**état de carence** (L615-6 du CCH) : la copropriété n'est plus en mesure d'assurer la conservation de l'immeuble. Les **arrêtés** de mise en sécurité ou d'insalubrité (livre V du CCH) visent l'état du bâti ou des parties communes. Résumés non exhaustifs : leur portée exacte dépend de l'ordonnance ou de l'arrêté |
| **Ce qu'on peut légitimement dire** | Qu'une procédure est déclarée, sa nature, la source et la date de consultation. **Jamais** « copropriété en difficulté financière » : une procédure peut être levée, ancienne, ou mal actualisée au registre (le champ de mandat, lui, change pour un syndicat sur cinq en dix mois) |
| **À demander** | L'annonce doit déjà mentionner la procédure (L721-1) ; demander l'ordonnance, le rapport du mandataire ou de l'administrateur, et les PV qui en parlent |
| **En langage courant** | (si la donnée existait) « Le registre des copropriétés signale une procédure de mandat ad hoc. Ce n'est pas un jugement sur la copropriété : demandez au vendeur l'ordonnance et ce qu'elle prévoit. » |

### D. Copropriété de plusieurs bâtiments

| | |
|---|---|
| **Ce que futur•e sait déjà** | Le bâtiment RNB de l'adresse, ou « N bâtiments rattachés à cette adresse » |
| **Ce que le registre ajouterait** | Que plusieurs bâtiments, ou plusieurs adresses, forment une même copropriété, ou au contraire que deux copropriétés se partagent une adresse ou une parcelle (Marseille, Toulouse, Paris 15e) |
| **Ce qui s'applique à quoi** | **Au lot** : charges, quote-part, fonds de travaux du lot, état daté. **À la copropriété entière** : nombre de lots, syndic, budget, impayés, fonds de travaux global, plan de travaux (sauf parties communes spéciales à un bâtiment). **Au bâtiment** : DPE d'immeuble, audit, état du bâti. Le registre ne parle **que** de la copropriété, et parfois d'un syndicat secondaire qui n'en couvre qu'une partie |
| **Ce qui reste inconnu** | Si les travaux d'un bâtiment sont supportés par tous (charges générales) ou par ce bâtiment seul (charges spéciales) : seuls le règlement et l'état descriptif de division le disent |
| **À demander** | « Les travaux de mon bâtiment sont-ils répartis sur toute la résidence ou sur ce seul bâtiment ? » ; « Existe-t-il un syndicat secondaire pour mon bâtiment ? » |
| **En langage courant** | « Ce logement appartient à une résidence de plusieurs bâtiments gérée comme une seule copropriété. Les gros travaux d'un bâtiment peuvent être partagés entre tous, ou non : c'est le règlement de copropriété qui le dit. » |

---

## 3. Essai de restitution dans « Le Relevé »

Les textes suivent la consigne de FUT-144 (vulgariser) : une phrase courante d'abord, la méthode dans le dépliable.
**Pas de score. Pas de santé de la copropriété.**

### 3.1 Rattachement unique (environ 4 adresses d'immeuble collectif sur 10)

> **À retenir**
> Cet appartement fait partie d'une copropriété d'environ 40 logements, gérée par un syndic professionnel.
>
> **Pour votre projet**
> En achetant, vous partagerez les décisions et les travaux avec les autres copropriétaires. Ce qui compte pour votre budget (charges, travaux votés, fonds de travaux), le registre ne le dit pas : ce sont les pièces du vendeur qui le disent.
>
> **À vérifier**
> Demandez les procès-verbaux des trois dernières assemblées et le plan de travaux prévu : quels travaux, quand, et pour quelle part ?
>
> **Comprendre la donnée** (dépliable)
> Registre national d'immatriculation des copropriétés (Anah), consulté le 27/10/2026. Copropriété n° AB6131171, rapprochée par l'adresse déclarée et par la parcelle. Le nombre de logements est déclaré par le syndic, pour toute la copropriété (40 logements, 92 lots en comptant caves et parkings), pas pour ce seul bâtiment. Le registre ne publie ni les finances, ni les travaux, ni les procédures : voyez la fiche de l'annuaire et les pièces du vendeur.

### 3.2 Rattachement ambigu (environ 3 adresses d'immeuble collectif sur 100)

> **À retenir**
> Deux copropriétés déclarent cette adresse au registre.
>
> **À vérifier**
> Demandez au vendeur le nom et le numéro de la copropriété de ce lot : ils figurent sur la fiche synthétique qu'il doit vous remettre.

Aucune taille n'est donnée, puisqu'aucune des deux n'est choisie.

### 3.3 Pas de rattachement (43 % des adresses collectives, 96 % des adresses tout venant)

**Rien.** Ni « pas de copropriété », ni « copropriété non immatriculée ». Une absence au registre ne prouve rien.

### 3.4 Ce que montre l'essai

Le bloc le plus utile (« À vérifier ») **ne dépend pas du registre** : la liste des pièces à demander vient de la loi
(L721-2), et vaut pour **tout** achat d'appartement en copropriété. Le registre n'y ajoute que la taille et le syndic,
deux faits que l'annonce donne déjà en partie, et seulement quand le rattachement est unique. Le bloc serait absent
plus d'une fois sur deux, et faux, en silence, environ une fois sur vingt-cinq.
