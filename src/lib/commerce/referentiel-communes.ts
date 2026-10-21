// FUT-114 · LE RÉFÉRENTIEL DES COMMUNES VENDABLES, côté serveur.
//
// `src/data/accueil-communes.json` est la projection compacte de l'index du comparateur (mêmes 34 788 codes,
// Hexagone et Corse, arrondissements PLM compris), empaquetée avec la fonction : aucun chemin à tracer, et le
// prebuild refuse un fichier périmé (`scripts/accueil/donnees-accueil.mjs`). Lire l'index complet (11 Mo
// compressés, ~1 s d'analyse) dans la route de paiement coûterait un démarrage à froid pour une seule question :
// ce code existe-t-il ?
import "server-only";
import communesBrutes from "@/data/accueil-communes.json";
import type { CommuneConnue, NomDeCommune } from "./eligibilite-territoriale.ts";

const fichier = communesBrutes as unknown as { champs: string[]; communes: Record<string, unknown[]> };
const communes = fichier.communes;
const NOM = fichier.champs.indexOf("nom");

export const communeDuReferentiel: CommuneConnue = (insee) => Object.hasOwn(communes, insee);

// FUT-119 · LE NOM D'UNE COMMUNE VENDUE VIENT D'ICI, JAMAIS DU NAVIGATEUR. `/debloquer?nom=` et `body.commune`
// laissaient le client écrire « La Rochelle » à côté du code de Nîmes : la page, le paiement, la facture et le
// territoire actif portaient alors un nom que les faits contredisaient. L'index ne connaît Paris, Lyon et
// Marseille que par arrondissements (« Paris 1er Arrondissement ») : leur code communal est nommé ici.
const NOMS_PLM: Record<string, string> = { "75056": "Paris", "69123": "Lyon", "13055": "Marseille" };

export const nomDuReferentiel: NomDeCommune = (insee) => {
  if (Object.hasOwn(NOMS_PLM, insee)) return NOMS_PLM[insee]!;
  const nom = Object.hasOwn(communes, insee) ? communes[insee]![NOM] : null;
  return typeof nom === "string" && nom.trim() ? nom.trim() : null;
};
