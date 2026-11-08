// LES LIGNES DE SOURCE D'UNE CARTE (FUT-12). Pur, partagé par la carte élémentaire, la carte composée
// et la liste des contrôles : une seule règle pour dire d'où vient une preuve.
//
//   - une preuve qui porte une PROVENANCE structurée la rend en une ligne : la source, puis sa
//     fraîcheur (période mesurée, édition, consultation). Avec ou sans valeur observée : la pastille
//     montre la valeur, cette ligne dit d'où elle vient et de quand ;
//   - une preuve HISTORIQUE (sans provenance) se rend comme avant : « Source : libellé » quand elle
//     n'a pas de valeur, rien quand elle en a une. Aucune date ne lui est attribuée après coup.
//
// Dédupliqué sur le texte rendu : quatre cartes d'une même adresse ne répètent pas quatre fois la
// même source.
import type { EvidenceRef } from "./decision-fact.ts";
import { ligneDeProvenance } from "../facts/provenance.ts";

export function lignesDeSource(refs: EvidenceRef[]): string[] {
  const vues = new Set<string>();
  const out: string[] = [];
  for (const e of refs) {
    const structuree = e.provenance ? ligneDeProvenance(e.provenance) : null;
    const ligne = structuree ?? (e.observedValue ? null : `Source : ${e.label}`);
    if (!ligne || vues.has(ligne)) continue;
    vues.add(ligne);
    out.push(ligne);
  }
  return out;
}
