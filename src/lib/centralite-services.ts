// LA CENTRALITÉ EN ÉQUIPEMENTS ET SERVICES D'UNE COMMUNE. Lib PURE, aucun index chargé, aucun
// server-only : elle reçoit une commune et rend un rang, pour que le comparateur et le moteur de
// mismatch lisent EXACTEMENT la même chose (le test de parité l'exige).
//
// ── POURQUOI CE FICHIER EXISTE ────────────────────────────────────────────────────────────────
//
// Le critère `acces_services` reposait sur `viv.eloignement`, un champ que l'ADEME ne documente
// pas, dont l'audit du 04/08/2026 n'a jamais pu établir l'identité, et dont la distribution
// interdisait d'arbitrer : 80,1 % des communes au palier haut, palier intermédiaire VIDE (0 sur
// 34 788), et deux communes tirées au hasard à égalité 64,3 % du temps. Son libellé promettait une
// proximité qu'il ne mesurait pas.
//
// `agri.equip` le remplace. C'est le « Niveau de centres d'équipements et de services des
// communes » de l'Observatoire des Territoires (INRAE-CESAER / ANCT), millésime 2021, déjà en base
// et jamais lu par une ligne de code. Il couvre 34 788 communes sur 34 788, et il descend le taux
// d'égalité à 52,5 %.
//
// ── CE QU'IL MESURE, ET CE QU'IL NE MESURE PAS ────────────────────────────────────────────────
//
// UNE CENTRALITÉ, PAS UNE PROXIMITÉ VÉCUE. La classification dit ce que la commune CONCENTRE pour
// son bassin, jamais la distance qu'un habitant parcourt. Un village à cinq minutes d'un centre
// structurant reste un non-pôle, et il a raison de l'être : il ne porte pas ces services. Tout
// libellé bâti sur ce champ doit donc parler de niveau de services de la commune, jamais
// d'accessibilité ni de proximité. C'est précisément l'erreur que le champ précédent commettait.
//
// Une commune sur deux reste indistinguable d'une autre sur ce critère, parce que 69 % du
// territoire est non-pôle. C'est un gain réel sur les 64,3 % d'avant, et ce n'est pas un bon
// pouvoir d'arbitrage. Le dire ici évite de le redécouvrir.

/**
 * LES CINQ NIVEAUX DE L'ANCT, ET LEUR RANG.
 *
 * `null` en base signifie NON-PÔLE, une catégorie explicite de la classification (« équipements et
 * services présents mais offre insuffisante »), et non une donnée manquante. C'est ce qui rend la
 * couverture de 100 % : l'appariement des décomptes par classe le confirme à l'unité près sur trois
 * des cinq classes (cf. `docs/audits/2026-08-04-source-acces-services.md`).
 *
 * ── POURQUOI DES ÉCARTS DÉCROISSANTS, ET PAS 0 / 25 / 50 / 75 / 100 ──────────────────────────
 * Un espacement régulier affirmerait que les cinq classes sont à distance égale, ce qu'une échelle
 * ORDINALE ne dit jamais. Le saut qui change le plus la vie quotidienne est le premier : passer
 * d'une commune sans offre suffisante à un centre de proximité, c'est faire ses courses sur place.
 * Passer d'un centre structurant à un centre majeur ajoute des services rares (spécialités
 * médicales, tribunaux, universités) qu'on utilise quelques fois par an. Les écarts suivent cet
 * ordre : 30, puis 20, 17, 13.
 */
const RANG_PAR_NIVEAU: Record<number, number> = {
  1: 50,  // centres locaux : offre de proximité quotidienne
  2: 70,  // centres intermédiaires : une trentaine de commerces et services
  3: 87,  // centres structurants : une quarantaine d'équipements supplémentaires
  4: 100, // centres majeurs : les services les plus rares
};
const RANG_NON_POLE = 20;

/**
 * LES 45 ARRONDISSEMENTS DE PARIS, LYON ET MARSEILLE, où le `null` ne veut PAS dire non-pôle.
 *
 * ── LE PIÈGE, MESURÉ LE 04/08/2026 ───────────────────────────────────────────────────────────
 * Les 45 arrondissements portent tous `equip: null`, et leurs communes-mères (`75056`, `69123`,
 * `13055`) sont ABSENTES de l'index, qui travaille au grain de l'arrondissement. L'ANCT, elle,
 * classe la ville entière. Le `null` y signifie donc « hors référentiel », jamais « offre
 * insuffisante ».
 *
 * Sans ce traitement, Paris 15e (233 000 habitants) serait rendu au même rang qu'un village de
 * 200 habitants, alors que les 48 autres villes de plus de 100 000 habitants sont toutes classées
 * au niveau 4. C'est le patron d'`AGENTS.md` : un champ qui continue de répondre à une question
 * qu'on ne pose plus.
 *
 * ── POURQUOI LE NIVEAU 4, ET PAS UNE ABSENCE ATTESTÉE ────────────────────────────────────────
 * L'échelle mesure la centralité dans le bassin de vie, et un arrondissement appartient au pôle
 * majeur que forme sa ville. Le rendre `null` ferait disparaître de ce critère les trois villes où
 * les lecteurs cherchent le plus, alors que la réponse est connue avec certitude.
 */
function estArrondissementPlm(insee: string): boolean {
  // Trois formes distinctes, et elles ne se factorisent pas : Paris va de 75101 à 75120 et
  // Marseille de 13201 à 13216, donc trois chiffres de préfixe et deux de rang ; Lyon va de 69381 à
  // 69389, donc quatre et un. Un `(751|6938|132)\d\d` uniforme rate les neuf arrondissements
  // lyonnais, qui redeviennent alors des non-pôles.
  return /^(?:751\d\d|6938\d|132\d\d)$/.test(insee);
}

/**
 * Le rang de centralité, de 0 à 100.
 *
 * ── DEUX ABSENCES QUI NE DISENT PAS LA MÊME CHOSE ────────────────────────────────────────────
 * `equip: null` est une CATÉGORIE : la commune est un non-pôle, l'ANCT l'a classée ainsi, et son
 * rang est 20. C'est le cas de 69 % du territoire.
 *
 * `equip` ABSENT (clé manquante, ou `agri` absent) veut dire que la donnée n'a pas été chargée, et
 * rend `null`. Sur l'index réel ce cas n'arrive jamais, `agri` étant présent sur les 34 788
 * communes ; il existe pour les objets partiels des tests et pour un futur index tronqué. Lui
 * donner 20 serait un repli inventé, qui classerait une commune non lue au rang d'un non-pôle
 * établi. C'est l'invariant que `comparateur-scores.test.ts` protège pour tous les critères.
 */
export function centraliteRang(equip: number | null | undefined, insee: string): number | null {
  // L'arrondissement se tranche sur le SEUL code INSEE : la réponse est connue avec certitude sans
  // rien lire, donc elle vaut aussi quand la donnée manque.
  if (estArrondissementPlm(insee)) return RANG_PAR_NIVEAU[4]!;
  if (equip === undefined) return null;
  if (equip === null) return RANG_NON_POLE;
  return RANG_PAR_NIVEAU[equip] ?? RANG_NON_POLE;
}

/**
 * Le niveau EFFECTIF, après traitement des arrondissements. Pour les libellés et les preuves.
 * `null` quand la donnée n'a pas été chargée, `0` quand la commune est un non-pôle attesté.
 */
export function centraliteNiveau(
  equip: number | null | undefined, insee: string,
): 0 | 1 | 2 | 3 | 4 | null {
  if (estArrondissementPlm(insee)) return 4;
  if (equip === undefined) return null;
  if (equip === null || !(equip in RANG_PAR_NIVEAU)) return 0;
  return equip as 1 | 2 | 3 | 4;
}
