// ════════════════════════════════════════════════════════════════════════════════════════════
// LE CACHE DE LA SYNTHÈSE TERRITOIRE (FUT-6).
//
// La synthèse Territoire est GÉNÉRIQUE (décision du 28/09) : elle ne dépend que des faits du lieu et
// de l'horizon. Sa clé ne contient donc AUCUNE donnée utilisateur :
//
//     clé = SHA-256( empreinte du snapshot | horizon | version du contrat de synthèse )
//
// Châtelaillon-Plage 2050, même snapshot, même contrat : la même synthèse pour tous les lecteurs.
// Le cache est touché = zéro appel au modèle.
//
// La version du contrat couvre ce qui change la sortie : projection, consigne, modèle, contrôles,
// patrons déterministes (cf. SYNTHESIS_CONTRACT_VERSION).
//
// Serveur (SHA-256) mais sans `server-only`, pour rester testable (cf. src/lib/server/sha256.ts).
// ════════════════════════════════════════════════════════════════════════════════════════════

import { sha256Hex } from "../server/sha256.ts";
import { SYNTHESIS_CONTRACT_VERSION, type HorizonKey } from "./synthesis-contract.ts";

/**
 * La signature n'accepte QUE ces trois entrées : aucune donnée de lecteur ne peut atteindre la clé,
 * par construction (et un test le vérifie sur la source de la route).
 */
export function synthesisCacheKey(snapshotHash: string, horizon: HorizonKey): string {
  return sha256Hex(`${snapshotHash}|${horizon}|${SYNTHESIS_CONTRACT_VERSION}`);
}
