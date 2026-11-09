// ════════════════════════════════════════════════════════════════════════════════════════════
// FUT-181 · POSTHOG NE DÉMARRE QU'APRÈS « ACCEPTER », ET S'ARRÊTE AU RETRAIT.
//
// Avant FUT-181, `PostHogProvider` appelait `posthog.init` sans condition : $pageview, autocapture,
// exceptions, web vitals et `identify(user.id, { email })` partaient sans consentement, et la
// bannière ne pilotait que Google. Ce module est désormais le SEUL endroit qui démarre, arrête ou
// identifie PostHog dans le navigateur. Il obéit à `localStorage["futuree-consent"]`
// (`mesure-audience-regles.ts`), relu à chaque décision.
//
// POURQUOI NE PAS INITIALISER « EN REFUS PAR DÉFAUT ». posthog-js 1.375 charge sa configuration
// distante dès `init` (`/ingest/array/<jeton>/config`, puis `/flags` avec l'identifiant anonyme),
// quel que soit `opt_out_capturing_by_default`. L'initialisation elle-même parle donc à PostHog. On
// n'initialise qu'avec le consentement : sans lui, le SDK n'existe pas, et ses appels (`capture`,
// `identify`, `reset`) sont sans effet ET sans file d'attente (posthog-core : `if (!this.__loaded)
// return`), donc rien n'est envoyé rétroactivement après une acceptation.
//
// QUATRE PROTECTIONS, de la plus large à la plus fine :
//   1. pas de consentement, pas d'`init` (ni requête, ni identifiant déposé) ;
//   2. `before_send` relit le consentement à CHAQUE événement : un retrait dans un autre onglet
//      coupe l'envoi au plus tard à l'événement suivant, avant même que l'onglet l'apprenne ;
//   3. au retrait : arrêt de l'enregistrement, nouvel identifiant (`reset`), `opt_out_capturing`
//      (persistance coupée), arrêt des requêtes de drapeaux, effacement des traces `ph_*` ;
//   4. `opt_out_capturing_by_default` : si le marqueur interne de PostHog disparaît (`reset`, purge),
//      le SDK retombe en refus, jamais en acceptation.
//
// CE QUI PART, MÊME AVEC LE CONSENTEMENT, EST RÉDUIT : URLs sans leurs paramètres (adresse, dossier,
// secret Stripe), textes des éléments cliqués masqués, aucun enregistrement de session, aucun e-mail.
// ════════════════════════════════════════════════════════════════════════════════════════════

import posthog, { type BeforeSendFn, type PostHogConfig } from "posthog-js";
import { mesureConsentie, nettoyerEvenement, purgerTracesPostHog } from "@/lib/mesure-audience-regles";

const gardeAvantEnvoi: BeforeSendFn = (evenement) => {
  if (!evenement || !mesureConsentie()) return null;
  return nettoyerEvenement(evenement);
};

export const CONFIG_POSTHOG: Partial<PostHogConfig> = {
  api_host: "/ingest",
  ui_host: "https://eu.posthog.com",
  defaults: "2026-01-30",
  // Le $pageview est émis à la main (`PostHogProvider`), à chaque navigation et seulement mesure active.
  capture_pageview: false,
  capture_pageleave: true,
  capture_exceptions: true,
  // Pas de chronométrage réseau : il enregistrerait les URLs des appels d'API, qui portent des
  // coordonnées et des adresses (`?lat=…&lon=…`, `?q=…`).
  capture_performance: { web_vitals: true, network_timing: false },
  // Le refus est l'état de repli : seul `opt_in_capturing`, appelé après « Accepter », ouvre la mesure.
  opt_out_capturing_by_default: true,
  // En refus, PostHog n'écrit rien dans le navigateur et efface ce qu'il avait écrit.
  opt_out_persistence_by_default: true,
  // Autocapture : quel élément est cliqué (balise, classes, position), jamais son texte ni ses
  // attributs. Un bouton, une suggestion ou un lien peut afficher une adresse ou un projet.
  mask_all_text: true,
  mask_all_element_attributes: true,
  // Paramètres d'URL personnels connus de posthog-js (gclid, fbclid…), en plus de `nettoyerUrl`.
  mask_personal_data_properties: true,
  // Aucun enregistrement de session : il filmerait le contenu des dossiers (adresse, projet,
  // conclusions) et les liens qui portent une adresse. À réexaminer à part (FUT-181, lot B).
  disable_session_recording: true,
  // PAS D'ENVOI GROUPÉ. posthog-js groupe ses envois (lots de 3 s) et vide sa file à la fermeture de la
  // page : la recette a mesuré un `$$heatmap` capté avant un retrait et parti APRÈS lui (onglet fermé).
  // Le SDK n'offre aucune API publique pour abandonner sa file (ses champs internes sont renommés à la
  // minification) : chaque événement part donc au moment de sa capture, après `before_send`.
  request_batching: false,
  before_send: gardeAvantEnvoi,
  debug: process.env.NODE_ENV === "development",
};

// ── L'état « mesure active », lisible par React ───────────────────────────────────────────────

let active = false;
const abonnes = new Set<() => void>();
function annoncer() { for (const f of abonnes) f(); }
function definirActive(v: boolean) {
  if (active === v) return;
  active = v;
  annoncer();
}
export function souscrireMesure(f: () => void): () => void {
  abonnes.add(f);
  return () => { abonnes.delete(f); };
}
export function mesureActive(): boolean {
  return active;
}

// ── Le compte connecté ────────────────────────────────────────────────────────────────────────
//
// `undefined` : pas encore connu (la session Supabase se lit en asynchrone). On n'en déduit rien,
// surtout pas une déconnexion. `null` : aucun compte. Une chaîne : l'UUID Supabase, seul identifiant
// transmis à PostHog. L'e-mail ne l'est jamais.
let compte: string | null | undefined;

export function definirCompte(id: string | null): void {
  compte = id;
  appliquerIdentite();
  annoncer();
}

// La session est-elle relue ? Le $pageview l'attend : sans cela, la première page après une
// déconnexion par la Server Action partait encore sous l'UUID du compte (mesuré par la recette).
export function identiteConnue(): boolean {
  return compte !== undefined;
}

function reinitialiserIdentite() {
  posthog.reset();
  // `reset` efface aussi le marqueur de consentement interne de PostHog, qui retombe en refus
  // (`opt_out_capturing_by_default`) : on le rouvre puisque le lecteur a toujours consenti.
  if (mesureConsentie()) posthog.opt_in_capturing({ captureEventName: false });
}

function appliquerIdentite() {
  if (!active || !posthog.__loaded || !mesureConsentie() || compte === undefined) return;
  try {
    const identifie = posthog.get_property("$user_state") === "identified";
    if (compte === null) {
      // Déconnecté (y compris par la Server Action, qui ne prévient pas le navigateur) : l'identité
      // de mesure du compte précédent ne doit pas suivre le visiteur anonyme.
      if (identifie) reinitialiserIdentite();
    } else {
      // Changement de compte sans déconnexion : on repart d'une identité neuve, pour ne pas fusionner
      // deux personnes.
      if (identifie && posthog.get_distinct_id() !== compte) reinitialiserIdentite();
      if (posthog.get_distinct_id() !== compte) posthog.identify(compte);
    }
  } catch { /* la mesure ne doit jamais casser la page */ }
}

// ── Démarrer, arrêter ─────────────────────────────────────────────────────────────────────────

function demarrer() {
  const jeton = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
  if (!jeton) return;
  if (!posthog.__loaded) {
    posthog.init(jeton, {
      ...CONFIG_POSTHOG,
      // Appelé pendant `init`, avant le démarrage de la file d'envoi et le premier chargement de la
      // configuration distante.
      // (L'instance passée en argument est typée sans options : c'est la même que `posthog`.)
      loaded: () => posthog.opt_in_capturing({ captureEventName: false }),
    });
  } else if (!posthog.has_opted_in_capturing()) {
    // Acceptation après un retrait, dans la même page : pas de rechargement nécessaire.
    posthog.set_config({ advanced_disable_feature_flags: false });
    posthog.opt_in_capturing({ captureEventName: false });
  }
  definirActive(true);
  appliquerIdentite();
}

// CE QUI ÉTAIT CAPTÉ MAIS PAS ENCORE ENVOYÉ NE PART PAS. Les heatmaps accumulent clics et mouvements
// avant de les capter : leur tampon est vidé au retrait (méthode publique de l'extension). La file
// d'envoi groupé, elle, est supprimée par `request_batching: false` (cf. CONFIG_POSTHOG).
function abandonnerEnvoisEnAttente() {
  const heatmaps = (posthog as unknown as { heatmaps?: { getAndClearBuffer?: () => unknown } }).heatmaps;
  heatmaps?.getAndClearBuffer?.();
}

function arreter() {
  if (posthog.__loaded) {
    try {
      // Plus aucune requête de drapeaux (le rafraîchissement périodique, celui que relance `reset`).
      posthog.set_config({ advanced_disable_feature_flags: true });
      posthog.stopSessionRecording();
      // Identifiant ET identifiant d'appareil neufs, jamais réécrits : la persistance est coupée par
      // `opt_out_capturing`.
      posthog.reset(true);
      posthog.opt_out_capturing();
      abandonnerEnvoisEnAttente();
    } catch { /* on purge quand même */ }
  }
  purgerTracesPostHog();
  definirActive(false);
}

// Relit le consentement et met PostHog dans l'état qu'il commande. Appelé au chargement, à chaque
// choix dans la bannière (cet onglet) et à chaque changement du stockage (autres onglets).
export function synchroniserMesure(): void {
  if (mesureConsentie()) demarrer();
  else arreter();
}

// L'identifiant de mesure à transmettre au serveur, SEULEMENT si la mesure est consentie et active.
// Sans lui, le serveur n'émet aucun événement de mesure (cf. `posthog-identity.ts`).
export function identifiantMesure(): string | undefined {
  if (!active || !posthog.__loaded || !mesureConsentie()) return undefined;
  try {
    const id = posthog.get_distinct_id();
    return typeof id === "string" && id ? id : undefined;
  } catch {
    return undefined;
  }
}
