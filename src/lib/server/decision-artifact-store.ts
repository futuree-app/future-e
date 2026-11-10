import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  parseDecisionArtifact, etatArtefact,
  type DecisionArtifactV1, type ArtifactStatus, type StoredArtifact, type ArtifactRow,
  type DataSnapshot,
} from "@/lib/decision/decision-artifact";
import { communeParent } from "@/lib/plm";
import { catnatFigeAffichable } from "@/lib/decision/catnat-evidence";
import { reserverPlace, figerVersion, marquerEchec } from "@/lib/decision/decision-artifact-ecriture";

// ════════════════════════════════════════════════════════════════════════════════════════════
// L'ACCÈS À L'ARTEFACT DE DÉCISION. Aucune règle métier ici : la génération vit chez l'appelant,
// ce module ne fait qu'écrire, relire et refuser. On LIT avec le client de l'appelant (RLS : ses
// seules lignes) ; on ÉCRIT avec le service role, ici seulement (FUT-173, plus bas).
//
// Le patron est celui de `decision-narrative-store` : le JSON de la base est VALIDÉ, jamais casté,
// et un artefact écrit sous un contrat antérieur est IGNORÉ plutôt que de faire tomber le rendu.
// ════════════════════════════════════════════════════════════════════════════════════════════

// `ArtifactStatus` et `StoredArtifact` vivent dans `decision/decision-artifact.ts`, avec la
// décision qui les consomme : la garder ici l'aurait rendue intestable, `server-only` empêchant
// `node --test` de charger ce module.
export type { ArtifactStatus, StoredArtifact };

/**
 * L'ÉTAT D'UN SCOPE : la version SERVIE, et où en est la dernière TENTATIVE.
 *
 * ── ON SERT LA DERNIÈRE VERSION *SERVABLE*, PAS LA DERNIÈRE VERSION (11/08/2026) ─────────────
 * Cette lecture prenait la version MAX, quel que soit son statut. Depuis qu'une v2 peut naître
 * (diagnostic déposé, projet modifié), une génération en cours ou échouée devenait la version lue :
 * `artifact` valait `null`, l'appelant retombait sur l'assemblage vivant, et le lecteur PERDAIT la
 * version qu'il avait achetée le temps de l'incident. Une version prête ne se réécrit jamais ; elle
 * ne doit pas non plus se laisser masquer.
 *
 * ── LA GARANTIE NE S'ARRÊTE PLUS À UN NOMBRE DE LIGNES (revue du 12/08/2026) ─────────────────
 * Une seule lecture `order desc limit 5` servait les deux besoins, et les servait mal : après cinq
 * tentatives ratées, la v1 PRÊTE sortait de la fenêtre et disparaissait de l'écran d'un client qui
 * l'avait payée. Le plafond portait sur le mauvais axe, et un plafond sur le bon axe reste un
 * plafond : trois versions `ready` devenues illisibles auraient masqué une quatrième, valide.
 *
 * « Une version prête et relisible se sert TOUJOURS » est un invariant, pas un effort. La tête se
 * lit donc seule (exacte quel que soit le nombre de tentatives), et les candidates servables se
 * PAGINENT parmi les seules lignes `ready`, jusqu'à en trouver une qui se relit ou avoir tout lu.
 * Le cas courant coûte une page : la version la plus récente est presque toujours lisible.
 *
 * La décision elle-même est pure et testée : `etatArtefact`, dans la lib.
 */
const PAGE_PRETES = 5;

export async function readLatestArtifact(
  sb: SupabaseClient, userId: string, insee: string, scopeKey: string,
): Promise<StoredArtifact | null> {
  // L'IDENTITÉ D'UNE LIGNE EST LA COMMUNE, JAMAIS L'ARRONDISSEMENT (revue du 12/08/2026). Le
  // générateur remonte déjà `75101` en `75056` ; une lecture qui ne le ferait pas ne trouverait
  // jamais ce qu'il écrit. Les deux bouts normalisent, et aucun appelant n'a à y penser.
  insee = communeParent(insee);
  const COLONNES = "version, status, generated_at, created_at, payload";
  const enLigne = (l: Record<string, unknown>): ArtifactRow => ({
    version: l.version as number,
    status: l.status as ArtifactStatus,
    generatedAt: (l.generated_at as string | null) ?? null,
    createdAt: (l.created_at as string | null) ?? null,
    payload: l.payload,
  });

  const tete = await sb
    .from("decision_artifact")
    .select(COLONNES)
    .eq("user_id", userId).eq("insee_code", insee).eq("scope_key", scopeKey)
    .order("version", { ascending: false })
    .limit(1);
  if (tete.error) throw tete.error;
  const lignes: ArtifactRow[] = (tete.data ?? []).map(enLigne);
  if (lignes.length === 0) return null;

  // UN PAYLOAD ILLISIBLE N'EST PAS UNE ERREUR, c'est un artefact d'un autre contrat : on descend à
  // la version prête suivante, page par page, et à défaut on rend un état sans version servie.
  // L'appelant retombe alors sur l'assemblage vivant, et le lecteur voit un dossier plutôt qu'une
  // page en échec.
  if (!lignes.some((l) => l.status === "ready" && parseDecisionArtifact(l.payload) !== null)) {
    for (let debut = 0; ; debut += PAGE_PRETES) {
      const page = await sb
        .from("decision_artifact")
        .select(COLONNES)
        .eq("user_id", userId).eq("insee_code", insee).eq("scope_key", scopeKey)
        .eq("status", "ready")
        .order("version", { ascending: false })
        .range(debut, debut + PAGE_PRETES - 1);
      if (page.error) throw page.error;
      const lues = (page.data ?? []).map(enLigne);
      lignes.push(...lues);
      if (lues.some((l) => parseDecisionArtifact(l.payload) !== null)) break;
      if (lues.length < PAGE_PRETES) break;
    }
  }
  return etatArtefact(lignes);
}

/**
 * LE SNAPSHOT DE DONNÉES LE PLUS RÉCENT DE CETTE COMMUNE, tous scopes confondus.
 *
 * ── POURQUOI TOUS SCOPES ─────────────────────────────────────────────────────────────────────
 * Le module Territoire ne sait pas DEPUIS QUEL dossier le lecteur a cliqué : il connaît la commune
 * lue, pas le dossier d'adresse d'où venait le lien. Or le fait qui porte le compte d'arrêtés est
 * le même dans l'artefact communal et dans celui d'un dossier d'adresse : c'est la même règle, sur
 * la même commune. Prendre le plus récent des deux donne donc le bon chiffre dans tous les cas
 * sauf un, deux artefacts de la même commune figés à des dates différentes ET sur des index
 * différents. Ce cas rare est meilleur que le comportement d'avant, où la carte ignorait purement
 * et simplement ce qui avait été vendu.
 *
 * Rend `null` sans artefact prêt, ou quand aucun ne porte de snapshot (tous ceux d'avant le
 * 11/08/2026) : l'appelant retombe alors sur l'index courant.
 */
export async function readLatestDataSnapshot(
  sb: SupabaseClient, userId: string, insee: string, scopeKey?: string | null,
): Promise<DataSnapshot | null> {
  // `scopeKey` DÉSIGNE L'ARTEFACT D'OÙ LE LIEN A ÉTÉ ÉMIS (revue du 11/08/2026). Sans lui, un
  // lecteur possédant plusieurs artefacts sur la même commune pouvait voir, en cliquant depuis le
  // bien A, la preuve figée du bien B. Il reste facultatif : les liens des dossiers antérieurs à ce
  // lot n'en portent pas, et le repli « le plus récent de la commune » vaut mieux que l'index seul.
  //
  // La sécurité ne repose pas sur lui : la requête est filtrée par `user_id`, donc un identifiant
  // fabriqué ne peut désigner que les artefacts du lecteur lui-même.
  //
  // Même remontée à la commune que ci-dessus : les lignes sont écrites sous le code de commune, et
  // la vérification du payload juste en dessous compare au même code.
  insee = communeParent(insee);
  let requete = sb
    .from("decision_artifact")
    .select("payload, generated_at")
    .eq("user_id", userId).eq("insee_code", insee).eq("status", "ready");
  if (scopeKey) requete = requete.eq("scope_key", scopeKey);
  const { data, error } = await requete
    .order("generated_at", { ascending: false })
    .limit(5);
  if (error) throw error;
  for (const ligne of data ?? []) {
    const artefact = parseDecisionArtifact(ligne.payload);
    const snapshot = artefact?.dataSnapshot;
    if (!snapshot) continue;
    // L'INSEE DU PAYLOAD EST VÉRIFIÉ CONTRE CELUI DEMANDÉ (revue du 11/08/2026). Le filtre SQL
    // protège la LIGNE, pas son contenu : un payload écrit avec un autre code, par un bug de
    // génération ou une reprise de données, afficherait le compte d'une autre commune sous le nom
    // de celle-ci. Un objet de preuve qui ne sait pas de quoi il parle ne prouve rien.
    const inseeSnapshot = snapshot.catnatInondation?.insee;
    if (inseeSnapshot != null && inseeSnapshot !== insee) {
      console.warn("[artefact] dataSnapshot d'une autre commune, ignoré", { attendu: insee, trouve: inseeSnapshot });
      continue;
    }
    // FUT-60 : un compte figé d'avant la correction de Paris, Lyon et Marseille est faux par
    // construction (zéro). Le dossier n'est pas modifié ; seul ce compte n'est plus réaffiché, et
    // la carte retombe sur l'index courant.
    if (snapshot.catnatInondation && !catnatFigeAffichable(snapshot.catnatInondation)) {
      const { catnatInondation: _faux, ...reste } = snapshot;
      void _faux;
      return reste;
    }
    return snapshot;
  }
  return null;
}

// ════════════════════════════════════════════════════════════════════════════════════════════
// LES ÉCRITURES PASSENT PAR LE SERVICE ROLE, ET SEULEMENT ICI (FUT-173, migration 40).
//
// Elles prenaient le client de l'appelant : le jeton du LECTEUR sur `/rapport`, ce qui obligeait la
// base à lui laisser INSERT, UPDATE et DELETE sur ses lignes. Il pouvait donc, sans passer par le
// serveur, réécrire ou supprimer une version prête, ou en fabriquer une. Le navigateur n'écrit plus
// rien ; ce module ne rend jamais le client service role à l'appelant (patron de
// `retour-utilite-store.ts`). Les appelants vérifient le droit AVANT de générer, et l'identité écrite
// (`userId`) vient toujours de leur session, jamais d'une entrée du client.
//
// La base reste la garde : le trigger de la migration 40 refuse, y compris au service role, toute
// transition autre que `generating → ready | failed`. Le code, lui, ne vise que les places en cours,
// et LÈVE quand aucune ligne n'a changé (`decision/decision-artifact-ecriture.ts`).
// ════════════════════════════════════════════════════════════════════════════════════════════
let ecrivain: SupabaseClient | null = null;
function client(): SupabaseClient {
  ecrivain ??= createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });
  return ecrivain;
}

/**
 * RÉSERVE la place d'un artefact, sans son contenu.
 *
 * L'IDEMPOTENCE VIENT DE LA CONTRAINTE UNIQUE, pas d'un test applicatif : un webhook Stripe rejoué
 * ou deux appels concurrents ne peuvent pas créer deux lignes pour la même version. Rend `false`
 * quand la place est déjà prise, ce qui dit à l'appelant de ne PAS générer.
 */
export function claimArtifactSlot(
  userId: string, insee: string, scopeKey: string, version = 1,
): Promise<boolean> {
  return reserverPlace(client(), userId, insee, scopeKey, version);
}

/**
 * Le contenu arrive : `generating → ready`. Une version PRÊTE ne se réécrit jamais ensuite, la
 * suivante sera une v2. LÈVE si la place n'est pas (ou plus) en cours.
 */
export function completeArtifact(
  userId: string, insee: string, scopeKey: string,
  artifact: DecisionArtifactV1, version = 1,
): Promise<void> {
  return figerVersion(client(), userId, insee, scopeKey, artifact, version);
}

/**
 * LA GÉNÉRATION A ÉCHOUÉ, ET LE DROIT RESTE OUVERT : `generating → failed`.
 *
 * On marque plutôt que de supprimer : une ligne effacée serait indistinguable d'un dossier
 * antérieur au lot, et personne ne saurait qu'il y a eu une tentative. Surtout, on n'écrit JAMAIS
 * un dossier de repli comme artefact : si l'augmentation Adresse a échoué, le dossier communal qui
 * s'affiche à l'écran est un repli acceptable, il ne doit pas devenir la version définitive d'un
 * dossier d'adresse payé.
 *
 * LÈVE si la place n'est pas (ou plus) en cours : le marquage de rattrapage qui suit une exception
 * ne peut donc plus repasser en `failed` une version que `completeArtifact` venait de rendre prête.
 */
export function failArtifact(
  userId: string, insee: string, scopeKey: string, version = 1,
): Promise<void> {
  return marquerEchec(client(), userId, insee, scopeKey, version);
}
