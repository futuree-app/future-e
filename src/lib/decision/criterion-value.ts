// L'EMPREINTE DÉCISIONNELLE D'UN CRITÈRE. Lib PURE.
//
// Extraite de `projet-materiel.ts` (FUT-7, 01/10/2026) sans changer une ligne de sa logique : deux
// consommateurs en ont désormais besoin, et ils ne peuvent pas diverger.
//   - la SIGNATURE DÉCISIONNELLE, qui dit si un dossier vendu répond encore au projet actuel ;
//   - la CONFIRMATION d'une condition sans compromis, qui s'épingle à la valeur exacte que le lecteur
//     a confirmée (`conditions.ts`). Si la valeur bouge, la confirmation cesse de valoir.
// Les deux posent la même question : « cette valeur, telle que le moteur la lit, a-t-elle changé ? ».
import {
  hardZoneAnchorsDe, excludePlaceDeclares, nearPlaceThreshold, thresholdFrom,
} from "../hard-constraints-hydrate.ts";
import { departementsDansLesZones, type HardConstraints } from "../hard-constraint-schema.ts";

/**
 * SÉRIALISATION CANONIQUE DES CONTRAINTES DURES : clés triées à TOUS les niveaux, et tableaux
 * traités comme des ENSEMBLES.
 *
 * ── POURQUOI PAS `stableStringify` ───────────────────────────────────────────────────────────
 * Il trie récursivement les clés, mais CONSERVE l'ordre des tableaux, ce qui est le bon défaut pour
 * une fonction d'identité générale. Ici, aucun tableau de `HardConstraints` n'a d'ordre signifiant :
 * `departements`, `zones`, `excludeZones` et `excludePlace` sont des ensembles que le moteur
 * intersecte ou exclut. `["31","33"]` et `["33","31"]` désignent le même projet, et le LLM de
 * `/parse` ne garantit aucun ordre d'une extraction à l'autre.
 *
 * ── CE QUE LE TRI DE PREMIER NIVEAU LAISSAIT PASSER (revue du 12/08/2026) ────────────────────
 * Deux faux changements reproduits par la revue : le même `nearPlace` avec ses clés imbriquées
 * dans un autre ordre (`{maxKm, label}` contre `{label, maxKm}`), et les mêmes départements dans
 * un autre ordre de tableau. Dans les deux cas le lecteur voyait « votre projet a changé » sans
 * avoir rien touché, et un clic sur le bouton produisait une version n+1 identique à la n.
 *
 * SI UN JOUR une contrainte porte une liste ORDONNÉE (un classement de priorité, par exemple), elle
 * ne pourra pas passer par ici : il faudra l'exclure explicitement de la normalisation, sans quoi
 * deux projets réellement différents partageraient une signature.
 */
export function canonique(v: unknown): string {
  if (v === undefined || v === null) return "null";
  // ENSEMBLE veut dire trié ET dédupliqué (revue du 12/08/2026) : le commentaire promettait un
  // ensemble, le code n'ôtait que l'ordre. `["31","31"]` et `["31"]` contraignent exactement le même
  // territoire, le moteur intersectant des ensembles ; les distinguer périmait un dossier pour une
  // répétition du parse.
  if (Array.isArray(v)) return `[${[...new Set(v.map(canonique))].sort().join(",")}]`;
  if (typeof v === "object") {
    const o = v as Record<string, unknown>;
    // UNE CLÉ ABSENTE ET UNE CLÉ NULLE SONT LA MÊME CONTRAINTE, celle qu'on n'a pas. `montagne:
    // null` est d'ailleurs la forme que le parseur émet pour « pas de montagne ». Les distinguer
    // ferait dépendre la signature du chemin d'écriture : un aller-retour JSON supprime les
    // `undefined`, une construction en mémoire les conserve.
    return `{${Object.keys(o).sort()
      .filter((k) => o[k] !== undefined && o[k] !== null)
      .map((k) => `${JSON.stringify(k)}:${canonique(o[k])}`).join(",")}}`;
  }
  return JSON.stringify(v);
}

/**
 * LES CONTRAINTES QUI CONTRAIGNENT VRAIMENT, et elles seules.
 *
 * ── UNE CONTRAINTE INACTIVE N'EST PAS UNE CONTRAINTE (revue du 12/08/2026) ───────────────────
 * L'objet brut était sérialisé en entier. `{ excludeSea: false }` ou `{ nearSea: { active: false } }`
 * changeaient donc la signature, alors que l'hydratation les traite exactement comme absents : le
 * lecteur voyait « votre projet a changé », et la version n+1 qu'il demandait concluait mot pour mot
 * comme la précédente.
 *
 * ── LE FILTRE N'EST PAS RÉÉCRIT ICI, IL EST EMPRUNTÉ ─────────────────────────────────────────
 * `declaredHardConstraintKeys` est la définition déjà en place de « quelles contraintes sont
 * déclarées », et c'est celle que l'assembleur consulte pour conclure `no_hard_constraint_declared`.
 * En écrire une seconde ici en créerait une qui divergerait de la première au premier champ ajouté,
 * et la divergence se verrait en production, sur un dossier périmé à tort ou jamais périmé. La
 * signature suit donc la même liste que la conclusion, par construction.
 *
 * ── UNE FAMILLE ACTIVE PEUT PORTER DES SOUS-VALEURS INERTES (revue du 12/08/2026) ────────────
 * `declaredHardConstraintKeys` dit quelles FAMILLES contraignent, pas ce qui, dans chacune, entre
 * dans le filtre. Deux faux positifs reproduits par la revue : ajouter une ancre `preferred` à côté
 * d'une ancre `hard` (l'hydratation ne garde que les dures), et changer `nearPlace.maxKm` alors
 * qu'un `maxMinutes` valide est déclaré (le temps prime, le kilométrage n'est jamais lu).
 *
 * Les trois règles concernées sont EMPRUNTÉES à l'hydratation, jamais recopiées : `hardZoneAnchorsDe`
 * et `excludePlaceDeclares` en ont été extraites et sont maintenant appelées des deux côtés, et
 * `nearPlaceThreshold` / `thresholdFrom` sont celles-là mêmes qui produisent le seuil appliqué. Le
 * jour où « le temps prime sur la distance » change, il change en un seul endroit.
 *
 * Le reste de la valeur est comparé en entier : un seuil qui bouge (`nearSea.maxKm` de 20 à 5) est
 * un vrai changement de décision.
 */
export function valeurDecisionnelle(cle: string, hc: HardConstraints): unknown {
  switch (cle) {
    case "zones":
      // FUT-5 : « la Bretagne ET les Pays de la Loire » et « la Bretagne OU les Pays de la Loire » portent
      // les mêmes ancres et ne désignent pas le même territoire. L'opérateur n'entre dans la signature
      // qu'en « au moins une » : un projet enregistré avant lui garde exactement sa signature.
      // FUT-8 : les conventions de macro-zone acceptées entrent dans la valeur (absentes : inchangée).
      if (hc.zonesConventions?.length) {
        return {
          ancres: hardZoneAnchorsDe(hc.zones), match: hc.zonesMatch === "any" ? "any" : "all",
          departements: departementsDansLesZones(hc) ? hc.departements ?? [] : [],
          conventions: hc.zonesConventions.map((c) => `${c.token}=${c.conventionId}@${c.conventionVersion}`),
        };
      }
      return hc.zonesMatch === "any"
        ? {
            ancres: hardZoneAnchorsDe(hc.zones),
            match: "any",
            departements: departementsDansLesZones(hc) ? hc.departements ?? [] : [],
          }
        : hardZoneAnchorsDe(hc.zones);
    case "excludePlace":
      return excludePlaceDeclares(hc.excludePlace);
    case "excludeZones":
      // FUT-8 : le périmètre parisien choisi entre dans la valeur (sans choix, la liste de jetons, comme avant).
      return hc.excludeZonesPerimetres && Object.keys(hc.excludeZonesPerimetres).length > 0
        ? { jetons: hc.excludeZones ?? [], perimetres: hc.excludeZonesPerimetres }
        : hc.excludeZones;
    case "nearPlace":
      // Le LABEL (qui désigne le lieu) et le SEUIL appliqué. Le mode ne compte que dans un seuil en
      // temps, où il y est déjà : sur un seuil en distance, l'hydratation ne le lit pas.
      // FUT-8 : la métrique (« à vol d'oiseau ») change le sens du seuil, elle entre dans la valeur. Absente
      // ou nulle, `canonique` l'ignore : la valeur d'un projet legacy ne bouge pas.
      return hc.nearPlace
        ? { label: hc.nearPlace.label, seuil: nearPlaceThreshold(hc.nearPlace), metric: hc.nearPlace.metric ?? null }
        : null;
    case "nearSea":
      // `active` est déjà dit par la présence de la famille ; ne reste que le seuil, qui suit la même
      // règle qu'ailleurs (un `maxKm` nul, négatif ou absent ne pose aucune limite).
      return { seuil: thresholdFrom(hc.nearSea?.maxKm) };
    case "farFromSea": {
      // FUT-33 : le seul paramètre est le nombre dit (nul, négatif ou absent : aucune limite).
      const km = hc.farFromSea?.minKm;
      return { minKm: typeof km === "number" && km > 0 ? km : null };
    }
    default:
      return (hc as Record<string, unknown>)[cle];
  }
}
