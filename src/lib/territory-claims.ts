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
