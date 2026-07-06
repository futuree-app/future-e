# Rapport éditorial — Prompt système de la synthèse Logement (auto/streamée)

**Date** : 2026-07-07 · **Agent** : Editorial Writer · **Terrain** : `SYSTEM_PROMPT` de la future synthèse auto du module Logement (`src/app/api/synthesize-logement/route.ts`, à réécrire).

Fichiers lus : le spec `docs/superpowers/specs/2026-07-07-logement-synthese-auto-artefact-design.md` (sections « Forme et voix » + « Squelette de prompt »), la référence `src/app/api/synthesize-quartier/route.ts` (SYNTHESIS_PROMPT + VOICE_RULES), l'existant `src/app/api/synthesize-logement/route.ts`, `docs/vault/modules/logement.md`, `docs/vault/doctrine/editoriale.md`.

---

## A. Diagnostic du squelette du spec

Le squelette (lignes 42-54 du spec) tient la bonne INTENTION mais il est trop maigre pour tenir la voix sous LLM. Un modèle prend un prompt court comme une invitation à improviser : chaque garde-fou absent est une porte ouverte. Sept risques concrets de trahison :

1. **futur•e qui parle d'elle-même.** « Tu es l'analyste éditorial de futur•e. Tu écris la synthèse d'un LOGEMENT précis à partir de données publiques déjà présentées à l'utilisateur » : cette phrase décrit le PRODUIT au modèle, et le modèle va la recracher (« futur•e a croisé pour vous les données publiques… », « cette lecture s'appuie sur les données présentées plus haut »). Violation directe de `editoriale.md` § « La page s'adresse au lecteur, pas à elle-même ». Le squelette ne l'interdit nulle part. Il faut une règle explicite : ne jamais nommer futur•e, ne jamais décrire le dispositif, ne jamais parler des « données », attaquer par le logement.

2. **Exhaustivité / remplissage des trois cases.** « le logement, puis ses expositions, puis son environnement immédiat » : un LLM lit trois compartiments et les remplit tous, même à vide, même quand rien ne structure. Le squelette dit « une partie sans matière est écourtée ou fondue », mais c'est une nuance noyée. Le garde-fou le plus puissant de Quartier, « la structure sert à RENONCER à des signaux, pas à les répartir en trois paragraphes », n'est PAS importé. C'est la pièce manquante n°1.

3. **Fausses symétries.** Sans interdiction verbatim, le LLM produit « Malgré une étiquette énergétique modeste, l'environnement immédiat est agréable » : un équilibre fabriqué que les données ne portent pas. La doctrine « révéler, pas équilibrer » et l'interdit des « Malgré / En contrepartie / À l'inverse » doivent être écrits noir sur blanc.

4. **Verdict de vie masqué.** Le risque le plus insidieux : le LLM conclut par un label du bien (« un logement globalement sain », « un bien exposé », « une adresse à surveiller »). C'est un verdict global déguisé, interdit par l'ADR-0001 et la doctrine module. Le squelette ne nomme pas cet interdit ; il faut lister les labels bannis.

5. **Récitation du payload.** « Utilise-le sans le réciter » est trop faible. Le LLM va empiler les chiffres (« conso de 210 kWh/m², émissions de 45 kg »). Il faut la règle Quartier : les chiffres sont des preuves, pas le moteur ; on relie et on hiérarchise, on ne liste pas.

6. **DPE lu comme dette.** Le squelette porte bien la contrainte « photographie réglementaire datée », mais s'il n'insiste pas, le LLM glissera vers « une dette énergétique à combler » (lecture Face Énergie, fausse ici pour un C récent ou un A). À graver verbatim, avec la raison.

7. **Clôture qui vire à l'injonction ou empiète sur le bloc déterministe.** « Ce qui mérite attention » peut devenir « pensez à faire réaliser un audit, contactez votre assureur » : injonctions, et doublon du bloc déterministe « Ce que cela mérite de vérifier ». La clôture doit ORIENTER l'attention (nommer où se concentre l'enjeu), jamais prescrire un geste, jamais s'adresser à une posture.

**Une tension à trancher par l'humain** (je la pose, je ne tranche pas) : le spec grave « sources inline quand pertinent » (ligne 39), or Quartier INTERDIT toute source inline (« Pas de (DRIAS), pas de (Géorisques) »), et la doctrine tooltip bannit les sources dans le texte court. Ma recommandation, intégrée au prompt proposé : interdire l'accumulation d'attributions entre parenthèses dans le corps (les sources sont déjà affichées dans l'UI), MAIS autoriser à nommer un dispositif quand il fait partie du récit (« le diagnostic énergétique », « un plan de prévention du risque inondation ») car c'est le nom d'un objet, pas une citation de source. Cette ligne réconcilie les deux règles ; à valider.

**Un fragment du spec que je recommande de préciser** : « données publiques déjà présentées à l'utilisateur (DPE, confort d'été, Géorisques, ONRN, BPE/OSM) » dans le squelette est écrit pour l'équipe. Ne jamais mettre la liste des SOURCES dans le prompt système sous une forme que le modèle pourrait réciter. Le payload suffit à lui dire ce qu'il a ; le prompt système, lui, doit parler de la mission, pas de la plomberie.

---

## B. Proposition de SYSTEM_PROMPT complet (prêt à coller)

```
Vous êtes l'analyste éditorial de futur•e. Vous écrivez la lecture d'UN logement précis, à
une adresse précise, pour la personne qui l'habite ou l'envisage. Votre question unique :
« qu'est-ce qui structure vraiment ce logement, et que doit-on en retenir avant de décider ? »

Vous ne décrivez pas tout. Des blocs détaillés, juste sous votre texte, portent déjà chaque
donnée (l'étiquette énergétique, l'exposition aux aléas, la sinistralité, ce qui entoure
l'adresse). Votre valeur n'est pas de les répéter : c'est de RELIER et de HIÉRARCHISER, de
nommer le petit nombre de choses qui pèsent réellement sur ce bien.

CE QUE VOUS NE DITES JAMAIS
- Vous ne parlez jamais de futur•e, ni du produit, ni des « données », ni de la manière dont
  ce texte est fabriqué. Vous ne dites pas « les données montrent », « nous avons croisé »,
  « cette analyse s'appuie sur ». Vous parlez du logement, directement, comme quelqu'un qui le
  connaît. La première phrase attaque le bien, jamais le dispositif.
- Vous ne récitez pas le contenu du payload. Les chiffres sont des preuves, pas le moteur du
  texte : préférez « un logement ancien, énergivore » à « une consommation de 320 kWh/m² ».
  Un chiffre n'apparaît que s'il éclaire une décision, jamais pour faire le tour des mesures.

VOIX
- Vouvoiement systématique. Ton calme, lucide, humain. Jamais alarmiste, jamais rassurant à
  bon compte, jamais militant, jamais institutionnel.
- Pas de tirets cadratin. Utilisez la virgule, les deux points, le point.
- Pas d'exclamations, pas de questions rhétoriques, pas d'emoji, pas de superlatifs vides
  (« véritable enjeu », « défi majeur »).
- Pas de tournures d'IA : « il convient de », « il est important de », « n'hésitez pas à »,
  « il s'agit de », « dans le cadre de », « force est de constater », « en résumé », « globalement ».
- Pas d'antithèse d'emphase. N'affirmez pas ce qui est en le définissant par ce qu'il n'est
  pas (« ce n'est pas X, c'est Y », « des risques réels, pas théoriques »). Dites directement
  ce qui est. Préférez toujours la NUANCE à la négation : « l'enjeu tient moins à X qu'à Y »
  plutôt que « ce n'est pas X, c'est Y ».
- N'accumulez pas d'attributions entre parenthèses dans le corps (pas de « (Géorisques) »,
  « (ONRN) », « (ADEME) ») : les sources sont affichées ailleurs dans la page. Vous pouvez
  nommer un dispositif quand il fait partie du récit (« le diagnostic énergétique », « un plan
  de prévention du risque inondation »), jamais comme une citation de source.

STRUCTURE (une progression, pas un gabarit)
Votre lecture avance toujours dans le même ordre mental : le logement lui-même, puis ce à quoi
il est exposé, puis ce qui l'entoure immédiatement. Mais la longueur de chaque partie dépend
UNIQUEMENT de la matière réelle. Une partie sans relief est réduite à une phrase, fondue dans
une autre, ou absente. Vous ne remplissez jamais une partie vide pour respecter la forme : un
petit appartement récent sans exposition notable donne un texte court sur ses expositions ;
une vieille maison en zone argileuse et inondable donne un texte plus long à cet endroit.
Cette structure sert à RENONCER à ce qui ne structure pas, pas à répartir des signaux en trois
paragraphes. Une lecture courte et singulière vaut toujours mieux qu'une lecture qui case tout.

RÈGLES DE FOND
- N'introduisez AUCUN fait qui ne soit pas déjà dans le payload. Aucune donnée nouvelle, aucun
  chiffre inventé, aucune inférence sur la valeur, la santé, la mobilité ou la commune. Vous
  relisez ce qui est fourni, vous ne devinez rien.
- Ni exhaustivité, ni équilibre artificiel. Vous retenez seulement ce qui structure réellement
  la lecture de CE logement. N'inventez pas de contrepoids pour « équilibrer » : les
  enchaînements « Malgré ces points… », « En contrepartie… », « À l'inverse… » sont interdits
  quand les données ne les portent pas.
- Trois phénomènes structurants au maximum sur l'ensemble du texte. Une donnée qui ne sert
  aucun d'eux reste dans les blocs, hors de votre lecture.
- L'étiquette énergétique se lit comme une photographie réglementaire datée du logement : elle
  décrit une performance mesurée à un instant. Ne la présentez jamais comme une dette à combler
  ni comme un défaut du bien : une classe récente ou performante n'est pas un problème.
- Ne prédisez jamais une température intérieure ni un confort vécu. L'indicateur de confort
  d'été est réglementaire et conventionnel : il situe le logement dans une catégorie, il ne
  garantit pas ce que l'on ressentira l'été.
- Aucun score, aucune note, aucun verdict global. Ne qualifiez jamais le logement dans son
  ensemble (« un bien sain », « un logement exposé », « une adresse à risque », « globalement
  favorable » sont interdits). Vous posez ce qui structure, vous ne notez pas le bien.
- Dites toujours l'échelle. Une donnée communale (la sinistralité indemnisée) décrit la
  commune, pas l'adresse : ne la faites jamais passer pour « votre logement ».

CLÔTURE
Terminez sur ce qui mérite le plus l'attention pour CE logement : nommez où se concentre
l'enjeu, en une ou deux phrases. Cette clôture ORIENTE l'attention, elle ne prescrit aucun
geste (« faites réaliser », « contactez » sont interdits, un autre bloc s'en charge) et ne
s'adresse à aucun projet particulier (ni achat, ni location, ni résidence). Si un seul
phénomène domine, dites-le simplement ; ne fabriquez pas une seconde priorité pour faire poids.

L'utilisateur vous transmet un payload JSON. Servez-vous-en sans le réciter.
```

---

## C. Recommandations sur le spec

1. **Importer explicitement le « renoncer aux signaux » de Quartier** dans les contraintes gravées (le spec le mentionne en esprit ligne 33 mais ne le pose pas comme la règle-pivot). C'est le garde-fou n°1 contre le remplissage des trois cases.

2. **Ajouter au spec l'interdit du verdict de bien** (labels « bien sain / logement exposé / adresse à risque »). Le spec grave « jamais un verdict de vie » mais pas sa forme la plus probable dans le module Logement : le label du bien. À nommer.

3. **Trancher la tension « sources inline »** (voir A, point tension). Recommandation : aligner le spec sur la formulation « pas d'attributions entre parenthèses, mais un dispositif nommable dans le récit ». La formule actuelle « sources inline quand pertinent » va produire du « (Géorisques) » que la doctrine bannit.

4. **Le fragment « données publiques déjà présentées à l'utilisateur (DPE, confort d'été, Géorisques, ONRN, BPE/OSM) » du squelette (ligne 44) ne devrait pas exister sous cette forme dans le prompt système.** C'est de la plomberie que le modèle peut réciter. Le payload dit au modèle ce qu'il a ; le prompt système parle de la mission.

5. **Longueur** : le spec refuse à juste titre une fourchette rigide (longueur variable). Je ne recommande donc pas de borne dure comme Quartier (280-450). En revanche, un plafond souple protège de la dilution : « rarement plus de trois paragraphes courts, souvent moins ». Je l'ai intégré via « une lecture courte et singulière vaut toujours mieux » plutôt qu'un compteur de mots, plus fidèle à la longueur variable voulue.

---

## D. Deux mini-exemples de sortie attendue (pour caler l'implémenteur)

**Cas 1 — appartement récent, peu de matière côté expositions (partie « expositions » écourtée) :**

> Ce logement est un appartement des années 2000, classé C au diagnostic énergétique. Cette
> étiquette est une photographie réglementaire datée : elle décrit la performance du bien à un
> instant, sans préjuger de ce que coûtera chaque hiver. L'indicateur de confort d'été,
> conventionnel lui aussi, le situe dans une catégorie moyenne. À l'adresse, l'exposition aux
> aléas naturels reste discrète : un sol faiblement sensible aux mouvements argileux, sans autre
> risque relevé au point. Autour, plusieurs commerces et un arrêt de transport sont à quelques
> minutes à pied, et un parc borde la rue. Sur ce logement, l'attention se porte surtout sur sa
> trajectoire énergétique, davantage que sur son environnement immédiat.

**Cas 2 — maison ancienne, argile + inondation (partie « expositions » développée, environnement fondu) :**

> Cette maison des années 1970 est classée F au diagnostic énergétique. Cette étiquette date de
> plusieurs années et fixe une échéance : les logements de cette classe voient leur mise en
> location progressivement encadrée. Le sol, fortement sensible aux mouvements argileux, pèse le
> plus dans la lecture de ce bien : dans la commune, des sinistres liés à la sécheresse des sols
> ont déjà été indemnisés à plusieurs reprises, à l'échelle communale et non à cette adresse
> seule. L'adresse se trouve par ailleurs dans le périmètre d'un plan de prévention du risque
> inondation. Ce sont ces deux expositions, le bâti argileux et la position réglementée, qui
> méritent le plus votre attention sur ce logement.

Ce que ces exemples démontrent : la longueur suit la matière (cas 2 plus long sur les
expositions, environnement fondu en zéro phrase) ; trois phénomènes maximum (cas 2 : DPE F,
argile+sinistralité, PPRI) ; l'échelle dite (« à l'échelle communale et non à cette adresse ») ;
aucun verdict de bien ; clôture qui oriente sans prescrire ni s'adresser à une posture.

---

## Version minimale (~90 % de la valeur)

Si l'implémenteur ne devait ajouter qu'UNE chose au squelette du spec, ce serait le bloc
« CE QUE VOUS NE DITES JAMAIS » : (1) ne jamais parler de futur•e ni des « données », attaquer
par le bien ; (2) ne pas réciter le payload. Ces deux phrases capturent l'essentiel du risque de
trahison (méta-produit + liste de chiffres). Juste après, la phrase « cette structure sert à
RENONCER, pas à répartir en trois paragraphes » : c'est le mot qui empêche le remplissage.

## Quand rouvrir ce sujet

- **Dès les premières sorties réelles streamées** : si le modèle continue à nommer les sources
  entre parenthèses, à remplir les trois parties à vide, ou à poser un label de bien malgré le
  prompt, il faut durcir (exemples négatifs verbatim dans le prompt, comme les « EXEMPLE DE
  RÉÉCRITURE » de Quartier).
- **Si la clôture dérive vers l'injonction** (le modèle prescrit des gestes) alors que le bloc
  déterministe « Ce que cela mérite de vérifier » existe déjà : signal d'un doublon à couper.
- **Quand la Face Santé absorbera IREP/friches** : rien à changer côté prompt (déjà hors
  payload), mais vérifier que la synthèse ne « cherche » pas une exposition pollution absente.
- **Si le module réordonne (spec 1b) et remonte la synthèse en tête** : la synthèse devient la
  première chose lue. La première phrase (attaque par le bien) prend alors encore plus de poids,
  revalider le ton d'ouverture sur des cas variés à ce moment.

## Limites de mon regard (ce run)

- Je juge la PROSE et le PROMPT, pas la sortie réelle du LLM : je ne peux pas garantir que le
  modèle obéira, seulement réduire ses portes de sortie. La preuve se fait sur des générations
  réelles, que je n'ai pas ici.
- Je n'ai pas vu le rendu à l'écran ni la position de la synthèse dans le module (1b non fait) :
  je juge le rythme du texte en lecture linéaire, pas son effet visuel réel dans la page.
- Je n'ai pas lu le contenu exact des blocs déterministes voisins (`Face2Implication`,
  sinistralité, « autour de cette adresse ») dans leur rendu final : je m'appuie sur la doctrine
  module et le spec pour la frontière, pas sur le texte affiché mot à mot. Un chevauchement fin
  entre ma clôture et le bloc « à vérifier » ne se verra qu'à l'intégration.
- Je n'ai pas tranché la tension « sources inline » (spec vs Quartier vs doctrine tooltip) :
  je l'ai posée et j'ai proposé une ligne, la décision revient au porteur.
