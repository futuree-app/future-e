import "server-only";
import { createClient } from "@supabase/supabase-js";

// ════════════════════════════════════════════════════════════════════════════════════════════
// CE QUI EMPÊCHE UNE FACTURE DE DÉRIVER PENDANT LA NUIT.
//
// ── LE TROU (21/09/2026) ─────────────────────────────────────────────────────────────────────
// Quatre routes publiques appellent un modèle payant à chaque requête, sans authentification et
// sans aucune limite : l'analyse d'un projet, la synthèse des résultats, la question posée au
// comparateur, l'assistant. Une boucle depuis une seule machine suffisait à produire des milliers
// d'appels, découverts sur la facture.
//
// ── DEUX COUCHES, ET AUCUNE NE SUFFIT SEULE ─────────────────────────────────────────────────
// La limite PAR ADRESSE arrête l'abus trivial, celui d'une personne avec un script. Elle vit en
// mémoire d'instance : elle ne voit donc ni les autres instances, ni une attaque venue de cent
// machines. C'est une gêne, pas une protection.
//
// Le DISJONCTEUR GLOBAL protège le portefeuille, pas l'utilisateur. Il compte en base, donc il
// est partagé entre toutes les instances, et il coupe les appels au modèle au-delà d'un budget
// journalier. C'est lui qui tient face à une attaque distribuée.
//
// Aucune des deux ne remplace le plafond de dépense posé chez le fournisseur : celui-là tient même
// si ce fichier a un bug.
//
// ── UN BUDGET EN POIDS, PAS EN APPELS ───────────────────────────────────────────────────────
// Les quatre routes ne coûtent pas la même chose : une extraction structurée courte n'est pas un
// assistant qui traîne un historique. Compter des appels donnerait une fausse sensation de
// maîtrise. Chaque route déclare donc son poids, calibré grossièrement en attendant la mesure
// réelle des jetons consommés.
//
// ── CE QUE LE DÉPASSEMENT NE FAIT PAS ───────────────────────────────────────────────────────
// Il ne dégrade RIEN de déterministe. Les cartes, les faits, les preuves, le dossier continuent :
// seule la prose rédigée par un modèle s'arrête, et le produit sait déjà se passer d'elle. Le
// lecteur reçoit un refus honnête, jamais une page cassée.
// ════════════════════════════════════════════════════════════════════════════════════════════

/** Le poids d'un appel dans le budget du jour. Calibrage grossier, à revoir sur les jetons réels. */
export const POIDS_APPEL = {
  parse: 1, // extraction structurée, prompt long mais sortie courte
  synthese: 2, // prose sur plusieurs communes
  ask_comparateur: 2,
  assistant: 3, // le plus variable : historique de conversation
} as const;

export type TypeAppel = keyof typeof POIDS_APPEL;

/**
 * LE BUDGET DU JOUR, EN POIDS. Volontairement bas : l'usage réel au 21/09/2026 est de quelques
 * dizaines d'appels par semaine, et une journée à 300 mériterait déjà un coup d'œil. Il remontera
 * quand il y aura un vrai volume, pas avant. Réglable sans déploiement.
 */
const BUDGET_JOUR = Number(process.env.LLM_BUDGET_JOUR ?? 300);

/** Par adresse réseau. Un humain qui affine sa recherche en fait trois ou quatre ; un script mille. */
const PAR_MINUTE = Number(process.env.LLM_MAX_PAR_MINUTE ?? 5);
const PAR_HEURE = Number(process.env.LLM_MAX_PAR_HEURE ?? 15);

type Compteur = { n: number; resetAt: number };
const MINUTE = new Map<string, Compteur>();
const HEURE = new Map<string, Compteur>();

function depasse(table: Map<string, Compteur>, cle: string, max: number, fenetreMs: number): boolean {
  const now = Date.now();
  const cur = table.get(cle);
  if (!cur || cur.resetAt < now) {
    table.set(cle, { n: 1, resetAt: now + fenetreMs });
    // PURGE OPPORTUNISTE : sans elle, la table grossit indéfiniment sur une instance longue.
    if (table.size > 5000) {
      for (const [k, v] of table) if (v.resetAt < now) table.delete(k);
    }
    return false;
  }
  cur.n += 1;
  return cur.n > max;
}

export function adresseAppelante(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "inconnue";
}

function admin() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });
}

/**
 * Consomme le budget du jour et dit s'il est épuisé.
 *
 * UNE PANNE DE COMPTEUR NE COUPE PAS LE PRODUIT. Si la base ne répond pas, on laisse passer :
 * refuser toutes les synthèses parce qu'un compteur est muet coûterait plus que le risque qu'il
 * couvre, et le plafond de dépense du fournisseur reste derrière.
 */
async function budgetEpuise(type: TypeAppel): Promise<boolean> {
  const jour = new Date().toISOString().slice(0, 10);
  try {
    const { data, error } = await admin().rpc("consommer_budget_llm", {
      p_jour: jour,
      p_poids: POIDS_APPEL[type],
      p_plafond: BUDGET_JOUR,
    });
    if (error) {
      console.error("[budget-llm] compteur indisponible", { message: error.message });
      return false;
    }
    return data === true;
  } catch (e) {
    console.error("[budget-llm] compteur injoignable", { message: String(e).slice(0, 120) });
    return false;
  }
}

/**
 * LA LIMITE PAR ADRESSE, en TÊTE de route. Elle ne consomme aucun budget : elle ne fait que
 * refuser un débit anormal, et elle doit donc s'exécuter avant tout travail.
 *
 * Rend `null` quand la voie est libre, ou la réponse à renvoyer telle quelle. 429 dit à la
 * personne d'attendre : c'est une gêne passagère, pas une fermeture.
 */
export function limiteParAdresse(request: Request): Response | null {
  const ip = adresseAppelante(request);
  if (depasse(MINUTE, `${ip}:m`, PAR_MINUTE, 60_000)) {
    return Response.json(
      { error: "Trop de demandes en peu de temps. Réessayez dans une minute." },
      { status: 429, headers: { "retry-after": "60" } },
    );
  }
  if (depasse(HEURE, `${ip}:h`, PAR_HEURE, 3_600_000)) {
    return Response.json(
      { error: "Vous avez atteint la limite de recherches pour cette heure." },
      { status: 429, headers: { "retry-after": "600" } },
    );
  }
  return null;
}

/**
 * LA RÉSERVATION DU BUDGET, JUSTE AVANT L'APPEL PAYANT — et jamais plus tôt (21/09/2026).
 *
 * Elle l'était, en tête de route, et c'était un défaut de conception à deux effets. Une réponse
 * servie depuis un cache, qui ne coûte rien, consommait quand même du budget. Pire : des requêtes
 * volontairement invalides, gratuites chez le fournisseur, suffisaient à vider le quota du jour et
 * à couper la prose pour tout le monde. Le dispositif anti-facture devenait un moyen de nuire.
 *
 * À placer donc APRÈS la validation, l'authentification et les caches, et immédiatement avant la
 * requête au modèle. Le compteur compte alors ce qu'il prétend compter : des appels payants.
 */
export async function reserverBudgetModele(type: TypeAppel): Promise<Response | null> {
  if (await budgetEpuise(type)) {
    console.error("[budget-llm] plafond journalier atteint", { type, budget: BUDGET_JOUR });
    return Response.json(
      {
        error:
          "La lecture rédigée est momentanément indisponible. Les données et les cartes restent accessibles.",
      },
      { status: 503, headers: { "retry-after": "3600" } },
    );
  }
  return null;
}
