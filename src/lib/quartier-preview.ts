import "server-only";
import extrait from "@/data/apercu-climat-communes.json";
import {
  construireApercu, scenariosDepuisExtrait, type ApercuTerritoire, type ExtraitClimat,
} from "@/lib/apercu-territoire";

// L'APERÇU DU PAYWALL TERRITOIRE (FUT-30). Synchrone, local, déterministe.
//
// Il ne contacte AUCUNE source. L'ancien aperçu attendait `gatherCommuneEnrichment` (huit sources, dont
// cinq en réseau) sous un `Promise.race` de 1 200 ms et rendait `null` au-delà : le bloc disparaissait,
// au premier visiteur de chaque fonction neuve notamment, parce que la seule lecture de DRIAS
// (`public/data_climat.json`, 63 Mo) consommait déjà 0,7 à 0,9 s. Il lit désormais un extrait de 2,7 Mo
// (`scripts/build-apercu-climat.mjs`), embarqué dans le bundle, et ne peut donc ni attendre ni échouer
// sur une source tierce.
//
// Il rend TOUJOURS un aperçu : des faits, ou un état explicite sans fait (cf. `apercu-territoire.ts`).
//
// LES CODES VILLE DE PARIS, LYON ET MARSEILLE (75056, 69123, 13055) n'ont pas de ligne DRIAS : DRIAS
// indexe leurs arrondissements, et le comparateur ouvre ce paywall par arrondissement. Le dossier
// emprunte la valeur du 1er arrondissement pour la ville entière ; l'aperçu, qui promet un fait de la
// commune, ne fait pas cet emprunt et rend l'état sans fait.
export function getApercuTerritoire(insee: string, commune: string): ApercuTerritoire {
  return construireApercu(insee, commune, scenariosDepuisExtrait(extrait as ExtraitClimat, insee));
}
