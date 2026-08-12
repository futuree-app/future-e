import { communeParent } from "./plm.ts";

// ════════════════════════════════════════════════════════════════════════════
// La DÉCISION de droit territorial, séparée de son accès à la base.
//
// Deux questions distinctes, et les confondre coûte cher :
//   - « peut-il LIRE le territoire ? » : un grant, ou un dossier dans la commune ;
//   - « a-t-il PAYÉ le territoire ? »  : gouverne le tarif d'approfondissement.
// Un dossier administratif répond oui à la première, non à la seconde.
//
// Ce module n'importe PAS `server-only` : il doit rester testable sous `node --test`.
// Les lignes révoquées sont filtrées à la LECTURE (address-dossier-store), elles
// n'atteignent jamais ces fonctions.
//
// TerritoryClaim ne porte pas la source du grant, et c'est délibéré : tout
// `report_grant` naît du webhook Stripe (migration 12, aucune policy d'écriture,
// service role uniquement), donc tout grant est par construction un achat.
// Discriminer `direct` de `pack_decision` ici graverait un débat tarifaire là où
// il n'y en a pas. Cet invariant est une hypothèse sur le monde : le jour où un
// grant offert ou promotionnel apparaît par un autre chemin, decidePaidTerritory
// devient faux SANS qu'aucun type ne change.
// ════════════════════════════════════════════════════════════════════════════

export type TerritoryClaim =
  | { kind: "grant"; insee: string }
  | { kind: "dossier"; insee: string; paid: boolean };

// PLM : l'adresse est géocodée sur l'arrondissement (691xx), la commune est stockée sur 69123.
// On compare au grain COMMUNE des deux côtés. Les colonnes `insee` gardent leur code local.
function sameCommune(a: string, b: string): boolean {
  return communeParent(a) === communeParent(b);
}

export function decideTerritoryAccess(claims: TerritoryClaim[], insee: string): boolean {
  return claims.some((c) => sameCommune(c.insee, insee));
}

export function decidePaidTerritory(claims: TerritoryClaim[], insee: string): boolean {
  return claims.some((c) => sameCommune(c.insee, insee) && (c.kind === "grant" || c.paid));
}

/**
 * LE CODE AUQUEL LA COMMUNE SE LIT VRAIMENT (13/08/2026).
 *
 * L'index de territoire est bâti par ARRONDISSEMENT pour Paris, Lyon et Marseille : les codes
 * agrégés (75056, 69123, 13055) n'y existent pas, et `getCommuneEntry` rend `null` pour eux. Le
 * hub, lui, travaille au grain commune (`communeParent`) depuis le durcissement du chantier 5, qui
 * a remonté l'identité de l'artefact à la commune aux deux bouts. Conséquence, restée silencieuse :
 * sur un dossier parisien PAYÉ, aucun fait n'était chargé, donc aucun dossier, donc aucun verdict
 * et aucun `<h1>`. L'écran passait de l'adresse au cadrage climat, sans rien dire.
 *
 * Ce que le lecteur possède porte pourtant un code LOCAL exploitable : l'arrondissement de son bien,
 * ou celui sur lequel son droit a été acheté (`report_grants.insee` garde le code d'origine). C'est
 * ce code qu'on rend ici, et lui seul : jamais un arrondissement choisi au hasard, qui ferait lire
 * le 1er à quelqu'un qui a acheté le 18e.
 *
 * L'identité de l'artefact NE CHANGE PAS : elle reste la commune. Ce code ne sert qu'à LIRE les
 * faits, comme `citycode` le fait déjà pour le radon, qui varie lui aussi par arrondissement.
 *
 * Rend `null` quand le code demandé n'est pas un code agrégé (le cas ordinaire : on lit la commune
 * elle-même) ou quand aucun droit ne désigne d'arrondissement.
 */
export function codeDeLectureLocal(
  claims: TerritoryClaim[],
  insee: string,
  /** Le code local du bien lu, quand il y en a un : il prime sur les droits, il est plus précis. */
  codeDuBienLu?: string | null,
): string | null {
  // `communeParent(insee) === insee` ET un code local différent chez les ayants droit : c'est la
  // signature d'une commune à arrondissements. Sur une commune ordinaire, tous les codes coïncident
  // et cette fonction rend `null`, donc rien ne change.
  if (codeDuBienLu && codeDuBienLu !== insee && sameCommune(codeDuBienLu, insee)) return codeDuBienLu;
  const local = claims.find((c) => sameCommune(c.insee, insee) && c.insee !== insee);
  return local ? local.insee : null;
}

// ════════════════════════════════════════════════════════════════════════════
// LE QUOTA DE QUESTIONS D'ASKFUTURE, calculé UNE fois pour tout le produit.
//
// ── DEUX DÉFAUTS QUE CE CALCUL FERME (revue du 11/08/2026) ─────────────────
// Le compte se faisait sur les seuls `report_grants`, dans la route. Or l'achat
// d'un dossier d'adresse n'en crée aucun : deux dossiers à 39 € donnaient trois
// questions au total, quand la règle en promet trois par territoire. Le plancher
// masquait le défaut sur le premier achat, jamais sur le second.
//
// Puis, en ajoutant les dossiers, `grants + dossiers` comptait DEUX FOIS une
// commune possédée des deux façons : c'est le parcours normal, Territoire à 14 €
// puis extension d'adresse à 25 €, qui doublait son quota.
//
// La bonne unité est le TERRITOIRE, pas la revendication. On déduplique donc au
// grain commune, ce que `sameCommune` fait déjà pour l'accès : deux appartements
// d'un même immeuble sont deux dossiers légitimes et un seul territoire, et un
// arrondissement parisien n'est pas un territoire de plus.
//
// ── POURQUOI ICI, ET PAS DANS LA ROUTE ────────────────────────────────────
// L'API décidait seule, et les deux points de montage d'AskFuture envoyaient un
// plafond de 3 en dur au composant : l'interface masquait donc le formulaire
// alors que l'API aurait répondu. Un quota calculé à deux endroits est un quota
// qui diverge ; celui-ci est pur, testable, et partagé par les trois appelants.
// ════════════════════════════════════════════════════════════════════════════

/** Questions offertes par territoire débloqué, plan `one_shot`. */
export const QUESTIONS_PAR_TERRITOIRE = 3;

/**
 * Le nombre de questions d'un compte `one_shot`.
 *
 * Plancher à un territoire : la résidence ouvre le gratuit sans qu'on ait rien
 * acheté, et un compte sans revendication garde donc ses trois questions.
 */
export function quotaQuestions(claims: TerritoryClaim[]): number {
  const territoires = new Set(claims.map((c) => communeParent(c.insee)));
  return QUESTIONS_PAR_TERRITOIRE * Math.max(1, territoires.size);
}
