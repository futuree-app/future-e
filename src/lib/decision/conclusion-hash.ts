// IDENTITÉ de l'artefact narratif. Les versions sont DANS la matière hachée, jamais concaténées
// après un hash du plan.
//
// Ce hash remplace toute pile de compteurs manuels (rulesRegistryVersion, dossierSchemaVersion,
// projectVersion) : le plan contient DÉJÀ le produit de tout cela (les fallbackText, les libellés,
// les identifiants, l'état), et un compteur qu'on oublie d'incrémenter afficherait un texte périmé
// comme s'il était courant. Le plan est purgé de tout champ volatil (observedAt, sourceMode) par
// construction (cf. conclusion-plan.ts) : sinon l'artefact s'invaliderait à chaque chargement.
//
// SERVEUR : importe sha256Hex (node:crypto). Ne jamais importer depuis un composant client.
import { stableStringify } from "../stable-stringify.ts";
import { sha256Hex } from "../server/sha256.ts";
import type { ConclusionNarrativePlan } from "./conclusion-plan.ts";

// Le schéma de sortie + les règles de validation. À bumper quand conclusion-validate change de contrat.
// c2 : la typographie est normalisée (le tiret cadratin, que le prompt interdit et que le modèle
// produisait quand même, devient une virgule). Le texte validé n'est plus littéralement celui du modèle.
export const DECISION_NARRATIVE_CONTRACT_VERSION = "c2";
// Le prompt système. À bumper à chaque retouche de son texte.
// v2 (slice 2.1) : le registre des réserves porte le POIDS, et il n'existe plus quand aucun point ne
// se détache. v3 : les faits de tête sont NOMMÉS, y compris à égalité (ne pas couronner n'est pas ne
// pas nommer). v4 : ils sont nommés par leur SUJET (topic) et non par leur constat, qui recopiait les
// cartes situées juste dessous. La conclusion nomme, les cartes démontrent. v5 : la hiérarchie ne se
// COMMENTE plus (« aucun ne prend le dessus » est de la tuyauterie), et la contrainte non vérifiée est
// le SUJET de sa phrase, nommée telle que le lecteur l'a posée (« la gare Matabiau », pas « un lieu »).
// v6 : la COMMUNE est nommée (« Toulouse », pas « ce lieu » ni « la commune »), et les sujets ne portent
// plus le grain (deux faits d'adresse cités côte à côte répétaient « sur cette adresse »).
// v11 : registre compositions_found (constats déjà reliés par le déterministe) + le lead peut être une
// composition tradeoff, nommée par son titre.
// v12 (lot « verdict héros ») : trois natures, trois verbes. Un constat établi est à CONTRÔLER, une
// condition non testée est à VÉRIFIER, un mismatch s'ARBITRE ; « examiner » décrit ce que futur•e a
// déjà fait. Le prompt invitait jusqu'ici à écrire « des points méritent d'être examinés », que le
// modèle reprenait pendant que le déterministe disait « à contrôler ».
// v13 (lot D) : le registre reserves_found devient une phrase de NAVIGATION. Quatre moules deviennent
// deux (« À regarder d'abord / ensuite »), les faits de tête sont donnés par leur SUJET même quand un
// seul domine (le constat entier recopiait la carte), et le registre ne porte plus AUCUN nombre.
// v14 : les cartes ne CONCLUENT plus (« Cet écart appelle un arbitrage. Il ne rend pas X incompatible
// avec votre projet. » retiré des sept statements de mismatch). Le verdict conclut, la carte démontre :
// une carte qui concluait pouvait contredire le verdict, et le faisait.
// v15 : le registre reserves_found ne porte PLUS l'ordre dans son corps (« À regarder d'abord / ensuite »
// retiré). Le corps est une phrase-liste de sujets ; l'ordre et la nature (« Contrôle prioritaire » /
// « À contrôler ensuite ») vivent dans l'étiquette de l'UI, depuis `consumedFrom`. Un contrôle résiduel
// ne se lisait plus comme un second point défavorable sous un verdict d'arbitrage.
// v16 : reserves_found DISPARAÎT comme registre généré. Un sujet abstrait (« ce qu'impose le sol
// argileux ») ne disait pas la démarche à mener, et le modèle ne peut pas porter une action (elle doit
// être exacte). C'est désormais `priorityControl`, DÉTERMINISTE : il reprend mot pour mot l'`action` du
// fait/composition de tête. Le modèle ne reçoit ni ne rédige plus ce registre.
export const DECISION_NARRATIVE_PROMPT_VERSION = "v16";
export const DECISION_NARRATIVE_MODEL = "claude-sonnet-4-6";

export function hashPayload(
  plan: ConclusionNarrativePlan,
  over: { contractVersion?: string; promptVersion?: string; model?: string } = {},
) {
  return {
    contractVersion: over.contractVersion ?? DECISION_NARRATIVE_CONTRACT_VERSION,
    promptVersion: over.promptVersion ?? DECISION_NARRATIVE_PROMPT_VERSION,
    model: over.model ?? DECISION_NARRATIVE_MODEL,
    locale: "fr-FR",
    plan,
  };
}

export function buildConclusionHash(plan: ConclusionNarrativePlan): string {
  return sha256Hex(stableStringify(hashPayload(plan)));
}
