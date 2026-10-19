// FUT-114 · UN DOSSIER DE TERRITOIRE SE CHOISIT PAR SA COMMUNE, AVANT LE PAIEMENT. Lib PURE (navigateur et serveur).
//
// `/checkout/rapport-complet` (CTA 14 € de l'accueil) payait sans commune : le webhook n'ouvrait alors aucun
// territoire, et la garde serveur refuse désormais ce paiement. La page sert maintenant à CHOISIR la commune,
// puis renvoie vers l'offre de cette commune, `/territoire/[insee]/debloquer`, seule porte de paiement du 14 €.
//
// Le navigateur n'a pas le référentiel : ce chemin écarte seulement ce qu'il sait refuser (format, outre-mer).
// Une commune inconnue de l'index tombe sur la 404 de `/debloquer`, et la route de paiement la refuse de toute
// façon (`communeVendable`).
import { estCodeOutremer } from "../outremer/code-outremer.ts";
import { normaliserCodeCommune } from "./eligibilite-territoriale.ts";

/** La provenance transmise à `/debloquer`, conservée à travers la connexion (`backHref`). */
export const SOURCE_TARIFS = "tarifs";

/** L'offre de la commune choisie, ou `null` si elle ne peut pas être vendue en V1. */
export function cheminOffreTerritoire(commune: { code: string; nom: string }): string | null {
  const insee = normaliserCodeCommune(commune.code);
  if (!insee || estCodeOutremer(insee)) return null;
  const q = new URLSearchParams({ nom: commune.nom.trim().slice(0, 120), source: SOURCE_TARIFS });
  return `/territoire/${insee}/debloquer?${q.toString()}`;
}
