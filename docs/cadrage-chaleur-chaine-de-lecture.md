# Cadrage — la chaleur, d'un secteur à un geste possible

> **Date** : 2026-08-19/20. **Statut** : **exploration documentaire**. Aucune surface utilisateur
> créée dans cette passe, aucun « module Adaptabilité », aucun score.
> **Objet** : vérifier si les données déjà présentes permettent une chaîne rigoureuse
> `exposition → vulnérabilité documentée → inconnues utiles → contrôle avant décision → modification
> éventuellement possible`, et dire où elle casse.

## Ce qui existe déjà, vérifié dans le code

| Maillon | État réel | Où |
|---|---|---|
| Chaleur du secteur (ÎCU) | **Disponible, couverture partielle assumée.** `iuhi` CSTB déc. 2024 en **degrés d'écart**, au **grand-IRIS** ; 1 955 grand-IRIS sur 596 communes (densité > 1 000 hab/km² et végétation < 45 %). Hors couverture = **pas de bloc**, jamais « non renseigné ». | `src/lib/icu.ts` |
| Végétation proche | **Disponible.** Espace cartographié le plus proche (OSM), avec sa nature et sa distance depuis le point. | `src/lib/logement-autour-chaleur.ts`, `logement-osm.ts` |
| Confort d'été du logement | **Disponible quand un DPE est attribué** : `bon / moyen / insuffisant`. | `src/lib/dpe.ts`, `dpe-attribution.ts` |
| Protections solaires, ventilation, traversant, inertie | **Disponibles dans le même bloc DPE**, avec un **niveau de preuve** qui dit si le diagnostic porte sur le logement (`A_EXACT_UNIT`) ou sur l'immeuble (`B1_EXACT_BUILDING`). | `src/lib/thermal-evidence.ts` |
| **Étage** | **NON exploitable.** Le champ `numero_etage_appartement` existe, mais il est documenté comme du **bruit** : « il vaut 0 dans l'écrasante majorité des cas ». Il ne sert aujourd'hui qu'à départager deux diagnostics candidats. | `src/lib/dpe-candidate-match.ts` |
| Trajectoire climatique de la commune | **Disponible** (jours > 30 °C, nuits tropicales, par horizon). | `public/data_climat.json`, `climat-facts.ts` |

**Conclusion d'inventaire** : la matière est là, sauf l'étage. Ce qui manque n'est pas une source,
c'est une **grille de lecture** commune à trois surfaces qui parlent aujourd'hui de chaleur sans se
parler : la trajectoire (Territoire), l'ÎCU et le végétal (Autour), le confort d'été (Logement).

## La chaîne, maillon par maillon, et ce qu'elle interdit

1. **Exposition** — deux grains, jamais fondus : la trajectoire au grain **commune**, l'ÎCU au grain
   **secteur**. `logement-autour-chaleur.ts` porte déjà cette règle : « votre secteur » d'un côté,
   « à N mètres » de l'autre. Un espace vert **ne compense pas** l'exposition ; toute formule qui le
   suggérerait ferait de deux faits mesurés une conclusion qu'aucune donnée ne porte.
2. **Vulnérabilité documentée** — uniquement ce que le DPE attribué dit, avec son niveau de preuve.
   Un bloc confort venu d'un DPE d'immeuble décrit l'immeuble, et la phrase doit le dire.
3. **Inconnues utiles** — l'étage, l'orientation des pièces de vie, l'ombre portée réelle, la
   présence de brasseurs d'air. Elles se **nomment**, elles ne se supposent jamais. Un logement sans
   protection solaire renseignée n'est pas un logement sans protection solaire.
4. **Contrôle avant décision** — il existe déjà, dans la table des gestes : `confort`, quatre
   postures (`logement-gestes.ts`). C'est le point d'attache naturel, pas une nouvelle liste.
5. **Modification éventuellement possible** — jamais une prescription de travaux. Une modification
   reste conditionnée par la faisabilité technique, le statut locataire/propriétaire, la copropriété
   et les règles applicables (dont le périmètre patrimonial, déjà porté par `patrimoine`). Le produit
   n'a de quoi tester **aucune** de ces quatre conditions à l'échelle d'un logement : cette dernière
   marche ne peut donc pas être franchie aujourd'hui sans affirmer au-delà de la preuve.

## Ce qui bloquerait une surface, si on en faisait une demain

- **La couverture ÎCU est minoritaire.** Sur une adresse rurale — le cas du 16/08/2026 — il n'y a pas
  d'ÎCU, pas de secteur, et souvent pas de DPE attribuable. Une surface « chaleur » y serait vide,
  c'est-à-dire exactement le grief JL-06 (« l'IA n'avait pas grand-chose à dire »), aggravé par une
  promesse de plus.
- **L'étage manque**, et c'est le maillon qui relie le secteur au logement. Sans lui, la chaîne saute
  du quartier à l'enveloppe.
- **La cinquième marche n'est pas testable.** Tant que le statut d'occupation, la copropriété et les
  règles applicables ne sont pas connus, « ce qui pourrait être modifié » resterait une généralité.

## Ce qui est décidé dans cette passe

Rien de plus que ceci : la grille ci-dessus devient une **convention interne** de rédaction pour tout
texte qui parle de chaleur, et le tableau d'inventaire sert de source unique sur ce qui est
disponible. Aucune nouvelle surface, aucun module, aucun score. La première brique qui vaudrait
d'être construite est la moins spectaculaire : **relier la trajectoire communale au confort d'été du
logement quand les deux existent**, dans le bloc qui porte déjà le confort — sans créer d'écran.
