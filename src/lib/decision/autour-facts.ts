// ════════════════════════════════════════════════════════════════════════════════════════════
// LES FAITS DU VOISINAGE, PROJETÉS POUR LE MOTEUR DE DÉCISION.
//
// ── POURQUOI CE MODULE EXISTE (21/09/2026) ───────────────────────────────────────────────────
// La vision écrit la cible depuis le 10/08 : « faire d'Autour, de Territoire et du Logement trois
// fournisseurs de faits d'un même dossier de décision, plutôt que trois rapports reliés par une
// navigation ». Elle était tenue pour Territoire et le Logement, jamais pour Autour.
//
// Conséquence, constatée sur un dossier réel : le module annonçait un médecin généraliste à 553 m,
// une école nommée à 261 m, une halte ferroviaire à 593 m, et le dossier de décision, sur la MÊME
// adresse et pour un projet qui déclarait l'accès aux soins en priorité, répondait « parmi les
// 20 % de communes les plus favorables ». Le produit mesurait à l'adresse et concluait à la
// commune, sans jamais le dire.
//
// ── CE QUE CE MODULE FAIT, ET CE QU'IL SE REFUSE À FAIRE ─────────────────────────────────────
// Il PROJETTE la donnée structurée du snapshot en faits canoniques. Il ne lit jamais
// `autour-conclusion.ts` : cette prose vit hors du registre des faits, et la recycler ferait d'un
// texte d'écran une source de vérité.
//
// Il ne conclut rien. « Un médecin à 550 m » n'est pas « un bon accès aux soins » : la BPE recense
// une PRÉSENCE, elle ne dit ni la disponibilité, ni les délais, ni l'acceptation de nouveaux
// patients. La règle qui consomme ces faits porte cette limite, et le dossier l'affiche.
//
// ── L'ABSENCE A TROIS SENS, ET ILS NE SE CONFONDENT PAS ──────────────────────────────────────
//   — pas de snapshot : le voisinage n'a pas été analysé (dossier ancien, analyse en cours) ;
//   — source en échec : la BPE n'a pas répondu, on ne sait pas ;
//   — aucun lieu dans le rayon : la BPE a répondu, et il n'y a rien. C'est une information.
// Les deux premiers se taisent, le troisième se dit.
// ════════════════════════════════════════════════════════════════════════════════════════════
import type { Face3Cat, Face3Snapshot } from "../logement-autour-types.ts";
import { BPE_WALK_RADIUS_M } from "../logement-autour-types.ts";

/**
 * UN ÉQUIPEMENT RECENSÉ AUTOUR DE L'ADRESSE, au grain du point.
 *
 * `typeLabel` est le type précis de la BPE (« Médecin généraliste »), plus informatif que la
 * catégorie (« santé »). `nom` n'existe que lorsqu'un seul exploitant est recensé sur le lieu :
 * deux cabinets à la même adresse ne se départagent pas, et le produit ne choisit pas pour eux.
 */
export type EquipementProche = {
  category: Face3Cat;
  distanceMeters: number;
  typeLabel: string | null;
  nom?: string;
  adresse?: string;
  /**
   * Combien d'établissements sont recensés SUR CE POINT. Cinq médecins à la même adresse peuvent
   * être une maison de santé comme cinq cabinets voisins : la BPE ne le dit pas, donc le texte ne
   * parle jamais « du cabinet ». Absent quand un seul est recensé.
   */
  exploitants?: number;
  /** Nombre de LIEUX de cette catégorie à portée de pas. « Avoir le choix », pas un dénombrement. */
  lieuxAPortee: number;
  /** Le rayon dans lequel `lieuxAPortee` a été compté, pour que le texte puisse le nommer. */
  rayonPasMeters: number;
};

/**
 * CE QUE LE VOISINAGE ÉTABLIT, pour le moteur.
 *
 * `undefined` sur une catégorie veut dire « pas de réponse » ; `null` veut dire « la source a
 * répondu, et il n'y a aucun lieu de cette catégorie dans le périmètre cherché ». La distinction
 * gouverne la règle : la première se tait, la seconde peut se dire.
 */
export type AutourFacts = {
  /** Le millésime de la source, tel que le snapshot le porte. Affiché avec le fait. */
  bpeMillesime?: string;
  /** La date de calcul du snapshot : un voisinage figé il y a six mois se dit comme tel. */
  calculeLe?: string;
  equipements: Partial<Record<Face3Cat, EquipementProche | null>>;
};

/**
 * Projette le snapshot du voisinage en faits canoniques.
 *
 * Rend `undefined` quand il n'y a rien à projeter : pas de snapshot, ou source en échec. Une règle
 * ne doit jamais avoir à distinguer « objet vide » de « pas d'objet ».
 */
export function buildAutourFacts(snapshot: Face3Snapshot | null | undefined): AutourFacts | undefined {
  if (!snapshot) return undefined;
  // UNE SOURCE EN ÉCHEC N'EST PAS UN VOISINAGE VIDE. Projeter des catégories `null` ferait dire à
  // la règle « aucun médecin autour », alors que personne n'a pu regarder.
  if (snapshot.sourceStatus?.bpe !== "complete") return undefined;

  const equipements: Partial<Record<Face3Cat, EquipementProche | null>> = {};
  for (const bloc of snapshot.bpe?.categories ?? []) {
    if (!bloc.nearest) {
      equipements[bloc.category] = null;
      continue;
    }
    equipements[bloc.category] = {
      category: bloc.category,
      distanceMeters: bloc.nearest.distanceMeters,
      typeLabel: bloc.nearest.typeLabel,
      ...(bloc.nearest.nom ? { nom: bloc.nearest.nom } : {}),
      ...(bloc.nearest.adresse ? { adresse: bloc.nearest.adresse } : {}),
      ...(bloc.nearest.exploitants && bloc.nearest.exploitants > 1
        ? { exploitants: bloc.nearest.exploitants }
        : {}),
      lieuxAPortee: bloc.withinWalkCount ?? 0,
      rayonPasMeters: BPE_WALK_RADIUS_M,
    };
  }
  if (Object.keys(equipements).length === 0) return undefined;

  return {
    ...(snapshot.sources?.bpeMillesime ? { bpeMillesime: snapshot.sources.bpeMillesime } : {}),
    ...(snapshot.computedAt ? { calculeLe: snapshot.computedAt } : {}),
    equipements,
  };
}
