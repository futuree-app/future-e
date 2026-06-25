# Module Territoire

> Page de module, centrée sur la **frontière éditoriale**. La mécanique de refonte
> (passeport, grands signaux, test d'inertie) vit dans `/memory/project_territoire_redesign.md` ;
> la page module complète (intention vs réel, sources, statut) viendra à la phase modules.

## Objet

Territoire = lecture **macro** de la commune : ce qu'elle est aujourd'hui, ce qui la
transforme, et les grands phénomènes auxquels elle est exposée. Il **pose le décor**. Les
autres modules (Logement, Santé, Mobilité, Métier, Projets) **traduisent ce décor dans la vie
de l'utilisateur**. Question cible : « dans quel type de territoire suis-je en train de
projeter ma vie ? », pas « quels sont tous les risques autour de moi ? ».

## Périmètre

**Intègre** : typologie, densité, rôle dans le bassin de vie, trajectoire démographique,
artificialisation / boisement, saisonnalité, et les grands phénomènes communaux (chaleur,
nuits tropicales, sécheresse, feu, inondation, submersion, historique CatNat, littoral,
relief).

**Exclut** (renvoyer au module légitime, sans analyser en profondeur) : valeur du bien et
confort thermique (Logement) ; santé respiratoire, enfants, personnes âgées (Santé) ; trajets
quotidiens (Mobilité) ; secteur d'activité (Métier) ; arbitrage retraite/enfants/achat
(Projets) ; toute exposition à l'adresse.

## Règles éditoriales de frontière

- **Ne jamais conclure à la place d'un autre module.** Territoire peut dire « les étés
  deviennent structurants pour cette commune », jamais « votre logement sera difficile à vivre
  en été » (Logement), ni « vos enfants seront exposés » (Santé).
- **Toujours dire l'échelle.** Lecture communale, jamais une fausse précision quartier quand
  la donnée est communale (voir `doctrine/data.md`).
- **Pas un inventaire d'indicateurs.** Le danger n'est pas de manquer de données, c'est de
  perdre le récit. Un indicateur disponible mais éditorialement faible est écarté.
- **Lecture décisionnelle, pas prescriptive.** Chaque section se clôt sur « ce qui mérite
  attention ici », sans recommandation directe.
- **Risque structurel connu** : Territoire dérive vite vers « module Climat ». Le climat est
  UNE des forces de transformation, pas le sujet unique (ADR-0002).

## Liens

`doctrine/positionnement.md`, `doctrine/editoriale.md`, `doctrine/data.md`,
`adr/ADR-0002-pivot-compatibilite-territoriale.md`, `/memory/project_territoire_redesign.md`.
