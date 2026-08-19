// Cache de la synthèse Logement traitée en ARTEFACT (cf. spec 1a). Deux fonctions pures :
// - buildFactHash : hash du CONTENU des faits (le payload EST le contrat : s'il change, le texte
//   doit changer ; s'il ne change pas, cache). La posture n'entre pas dans le payload -> ne
//   régénère jamais. Voit tout changement de fait ou de source amont modifiée
//   (board 2026-07-07, critique 2 : ne plus hasher l'IDENTITÉ).
// - buildSynthesisPayload : assemble les faits déjà montrés pour le prompt (-irep/friches).
//
// L'« AUTOUR » A QUITTÉ CE PAYLOAD le 29/07/2026, avec le module Autour de l'adresse. La règle qui
// gouverne ce fichier est que le payload ne contient QUE des faits affichés sous le texte : c'est
// ce qui autorise le prompt à dire « les blocs détaillés portent déjà chaque donnée » et interdit
// au modèle de sortir une donnée que le lecteur ne peut pas vérifier d'un coup d'œil. Depuis que
// l'entourage se lit dans son propre module, l'y laisser aurait fait commenter au texte Logement
// des équipements et des espaces verts qui ne s'affichent plus nulle part sur cette page.
// Pas de `server-only` : buildFactHash est aussi utilisé côté client pour le gating en session.

import { deriveThermalEvidence, thermalEvidenceSummary } from "./thermal-evidence.ts";
import { buildAddressDpeContext } from "./dpe-address-context.ts";
import { stableStringify } from "./stable-stringify.ts";
import type { DpeRecord } from "./dpe-attribution.ts";

export const SYNTHESIS_PROMPT_VERSION = "v10"; // v10 : les diagnostics de l'adresse entrent dans le payload quand AUCUN n'est attribué, et la lecture doit alors nommer le document à réclamer plutôt que de s'arrêter à « non qualifiée ». Bump = régénération voulue. // v9 : couverture des dimensions dans le payload, et clôture BORNÉE — le calme ne peut plus être affirmé sur « l'adresse » quand une dimension n'a pas pu être lue. Bump = régénération voulue : toutes les synthèses écrites sous v8 sur une adresse sans diagnostic concluent au calme en confondant « rien trouvé » et « rien cherchable ». // v8 : sortie de l'« autour » — la lecture Logement s'arrête aux murs et à ce à quoi l'adresse est exposée ; l'entourage (équipements, espace vert, îlot de chaleur) est passé au module Autour de l'adresse, donc il quitte le payload ET le prompt. Bump = régénération de toutes les synthèses existantes, voulue : les anciennes commentent un entourage que la page n'affiche plus. // v7 : passe langage non-expert renforcée — le vocabulaire d'expert n'apparaît JAMAIS même glosé (« retrait-gonflement des argiles », « inertie », « conditions conventionnelles », « représentativité » interdits), test de la mère. // v6 : croisement Logement × Territoire — le climat projeté (gwl20/2050) éclaire une caractéristique du bâti sans jamais en être le sujet ni changer le diagnostic (il change le POIDS) ; poids narratif (le climat ne prend jamais l'enjeu principal, la sinistralité communale n'est jamais couronnée). MARQUEE-ONLY en v1 (notable rendu silencieux : répétition de charnière observée 8/8 à fréquence notable). Axe chaleur seul (sécheresse différée). Passe Editorial v2.

// Empreinte de CACHE déterministe (FNV-1a 32 bits), PAS un mécanisme de sécurité. Le risque de
// collision est négligeable à cette échelle ; l'intégrité des faits sera assurée par la
// reconstruction serveur du payload depuis l'artefact logement (dette acceptée, cf. board étape 3
// geste 1 différé), jamais par ce hash. Synchrone à dessein : le gating client se fait au rendu,
// une empreinte crypto asynchrone (WebCrypto) n'y aurait pas sa place.
function fnv1a(str: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

// Hash de CONTENU : empreinte du payload de synthèse sérialisé + version du prompt. Sert de clé
// de cache serveur ET de gate en session. Remplace l'ancien hash d'identité
// (lat:lon:dpeId:sourcesVersion) qui manquait les changements amont, figeait une synthèse générée
// sans l'« autour », et couplait par erreur la version des sources Face 3 (bump Face 3 =
// invalidation surprise de toutes les synthèses).
export function buildFactHash(data: SynthesisData): string {
  return `syn:${SYNTHESIS_PROMPT_VERSION}:${fnv1a(stableStringify(buildSynthesisPayload(data)))}`;
}

// Signal climat projeté (gwl20 / 2050), curé et PRÉ-DIGÉRÉ en intensité qualitative : le modèle
// ne reçoit jamais de chiffre, seulement un code par axe. Dérivé serveur-only par
// `deriveClimatProjete` (drias-json), injecté dans `data` avant le hash. Axe chaleur seul en v1 ;
// `secheresse_sols` reste `null` (pas de seuil défendable sur SWI absolu, cf. décision porteur).
export type ClimatProjete = {
  horizon: "2050";
  chaleur: "marquee" | "notable" | null;
  secheresse_sols: "marquee" | "notable" | null;
};

// Forme d'entrée (sous-ensemble de ce que le client poste). Champs optionnels/défensifs.
export type SynthesisData = {
  address?: { label?: string | null } | null;
  altitude?: number | null;
  dpeSelectionStatus?: string | null;
  selectedDpe?: DpeRecord | null;
  georisques?: { parcel?: { risks?: { labels?: string[] }; pprn?: { labels?: string[] }; seismic?: { label?: string | null } | null; rga?: { label?: string | null } | null } | null } | null;
  sinistralite?: unknown;
  /**
   * LE COMPTE D'ARRÊTÉS INONDATION DE LA COMMUNE, quand la page a pu le résoudre.
   *
   * Il n'entre dans le payload que pour CONTEXTUALISER une absence de sinistre indemnisé (cf.
   * `sinistralitePourRecit`). Sans absence à contextualiser, il n'y entre pas : il n'a rien à
   * apporter au récit, et l'ajouter partout invaliderait le cache de toutes les synthèses
   * existantes pour un fait qu'aucune d'elles n'utilise.
   */
  catnatInondationCount?: number | null;
  communeData?: { commune?: { nom?: string | null; population?: number | null } } | null;
  // Injecté serveur-only avant le hash (jamais posé par le client, qui ne peut pas lire le JSON
  // DRIAS). Conséquence : le hash client (sans climat) et le hash serveur (avec) DIVERGENT, mais
  // ils ne sont jamais comparés l'un à l'autre (le client dédup en local sur ses faits visibles,
  // le serveur clé son cache sur son propre hash). Divergence inoffensive, cf. route.
  climatProjete?: ClimatProjete | null;
  /**
   * TOUS les diagnostics rattachés à l'adresse, attribués ou non. Entrés dans le payload le
   * 31/07/2026 avec le déblocage de la sélection : la page les affiche désormais, donc le texte a
   * le droit d'en parler (règle du fichier : le payload ne porte QUE des faits affichés dessous).
   *
   * Ils ne servent qu'à une chose : dire qu'il y a un document à réclamer. Le prompt interdit d'en
   * tirer la moindre caractéristique de ce logement-ci.
   */
  dpeCandidates?: DpeRecord[] | null;
  // irep / cartofriches / posture : volontairement ignorés. Les deux premiers ne sont interprétés par
  // aucun fait aujourd'hui (cf. le registre des sources dormantes) ; la posture n'est pas un fait.
  // autour : retiré en v8 — il appartient au module Autour de l'adresse (cf. en-tête).
};

const DPE_CONFIRMED = (s: string | null | undefined) =>
  s === "auto_confirmed" || s === "user_confirmed";

// ════════════════════════════════════════════════════════════════════════════════════════════
// LA COUVERTURE EST UN FAIT DU PAYLOAD, PAS UNE DÉDUCTION LAISSÉE AU MODÈLE.
//
// Le 30/07/2026, la synthèse d'une adresse rurale sans diagnostic s'est terminée par « L'adresse
// ne porte pas d'enjeu structurant identifié », après quatre sections disant qu'on ne savait pas.
// Le modèle n'avait pas dérivé : le prompt lui demandait, quand rien de marquant ne ressort, de
// « dire que l'adresse est calme et de s'arrêter là ». Cette consigne avait été écrite pour le cas
// où les données existent et ne montrent rien, et elle ne distinguait pas « on a regardé » de
// « on n'a pas pu regarder ».
//
// Le payload rendait les deux cas IDENTIQUES : `dpe: null` et `confortEte: null` valent aussi bien
// pour un logement sans diagnostic que pour un champ qu'on aurait choisi de taire. Aucune consigne
// ne pouvait rattraper ça, puisque l'information manquait de l'autre côté.
//
// VOCABULAIRE VOLONTAIREMENT REPRIS de `decision/criteria-registry.ts` (`CriterionCoverage`,
// "examined" | "unexamined") SANS l'importer : les deux sous-systèmes n'ont aucune raison de se
// coupler, et inventer un troisième mot pour la même idée serait la dette qu'on cherche à éviter.
// Un même concept, un même mot, deux domaines qui restent indépendants.
//
// PAS DE TROISIÈME ÉTAT ICI. Les sondes distinguent bien `none` d'`unavailable` une couche plus
// bas, mais une panne de source empêche le rapport entier de se rendre : elle n'atteint jamais
// cette fonction. Le jour où une source pourra manquer sur un rapport rendu, l'état s'ajoutera ici
// et la clôture devra le nommer autrement (« momentanément indisponible », jamais « absent »).
// ════════════════════════════════════════════════════════════════════════════════════════════
export type DimensionCoverage = "examined" | "unexamined";

export type SynthesisCoverage = {
  energie: DimensionCoverage;
  confort_ete: DimensionCoverage;
  exposition_adresse: DimensionCoverage;
  sinistralite_communale: DimensionCoverage;
  /** Libellés lisibles des dimensions NON lues, dans l'ordre où la clôture doit les nommer. */
  non_lues: string[];
};

// Libellés destinés au TEXTE, donc écrits pour un lecteur : ils entrent tels quels dans la
// clôture. Le vocabulaire d'expert reste interdit (règle v7 du prompt), d'où « diagnostic
// énergétique » et non « DPE ».
const LIBELLES: Record<Exclude<keyof SynthesisCoverage, "non_lues">, string> = {
  energie: "la performance énergétique de ce logement",
  confort_ete: "son comportement en été",
  exposition_adresse: "ce à quoi son adresse est exposée",
  sinistralite_communale: "les sinistres indemnisés dans la commune",
};

export function buildCoverage(data: SynthesisData): SynthesisCoverage {
  const dpe = Boolean(DPE_CONFIRMED(data.dpeSelectionStatus) && data.selectedDpe);
  const parcel = data.georisques?.parcel;
  // Une exposition EXAMINÉE veut dire que Géorisques a répondu pour cette adresse, même si sa
  // réponse est « rien ici ». C'est précisément la distinction qui manquait : un zonage vide est
  // un résultat, une absence de réponse n'en est pas un.
  const expositionLue = Boolean(
    parcel && (parcel.seismic?.label || parcel.rga?.label || parcel.risks || parcel.pprn),
  );

  const c: SynthesisCoverage = {
    // Le confort d'été DÉRIVE du même diagnostic : sans lui, les deux tombent ensemble, et c'est
    // ce qui rend le trou visible dans le texte (deux dimensions muettes d'affilée).
    energie: dpe ? "examined" : "unexamined",
    confort_ete: dpe ? "examined" : "unexamined",
    exposition_adresse: expositionLue ? "examined" : "unexamined",
    sinistralite_communale: data.sinistralite != null ? "examined" : "unexamined",
    non_lues: [],
  };
  c.non_lues = (Object.keys(LIBELLES) as (keyof typeof LIBELLES)[])
    .filter((k) => c[k] === "unexamined")
    .map((k) => LIBELLES[k]);
  return c;
}

// ════════════════════════════════════════════════════════════════════════════════════════════
// UNE ABSENCE DE SINISTRE NE SE DONNE PAS AU MODÈLE SANS DE QUOI LA SITUER (17/08/2026).
//
// Le payload transmettait l'objet ONRN brut, `{ kind: "aucun" }` compris. Le modèle pouvait donc
// écrire « aucun sinistre d'inondation n'a été indemnisé dans la commune » pendant que le module
// Territoire comptait cinq arrêtés depuis 1982 : la contradiction du premier test réel, rejouée en
// prose, sur une surface où aucune carte ne vient la borner.
//
// La leçon du vault s'applique telle quelle : un prompt n'est pas une frontière de sûreté, la
// frontière est de NE PAS FOURNIR LA DONNÉE. Une absence sans son contexte administratif sort donc
// du payload. Le lecteur ne perd rien : la carte déterministe la porte, bornée par sa période et
// son échantillon, et la carte de réconciliation la met en regard des arrêtés.
//
// Quand le compte d'arrêtés EST connu, l'absence reste, accompagnée de lui : le modèle a alors de
// quoi ne pas se tromper, et l'écart fait partie de ce qu'il peut avoir à dire.
//
// ── INVARIANT DE CACHE ───────────────────────────────────────────────────────────────────────
// Sans aucun péril en `aucun`, la sortie est structurellement identique à l'entrée : le hash ne
// bouge pas, et aucune synthèse existante n'est régénérée pour rien.
// ════════════════════════════════════════════════════════════════════════════════════════════
export function sinistralitePourRecit(
  sinistralite: unknown,
  catnatInondationCount: number | null | undefined,
): unknown {
  if (sinistralite == null || typeof sinistralite !== "object") return sinistralite ?? null;
  const src = sinistralite as Record<string, { kind?: string } | null | undefined>;
  const out: Record<string, unknown> = {};
  for (const [peril, etat] of Object.entries(src)) {
    if (etat?.kind !== "aucun") { out[peril] = etat; continue; }
    if (peril === "inondation" && typeof catnatInondationCount === "number") {
      out[peril] = {
        kind: "aucun_sinistre_indemnise",
        periode: "1995-2021",
        echantillon: "CCR, contrats assurés de la commune",
        arretes_catnat_inondation_depuis_1982: catnatInondationCount,
      };
      continue;
    }
    // Omis : une absence que le modèle ne peut pas situer n'a pas à être racontée.
  }
  return out;
}

export function buildSynthesisPayload(data: SynthesisData): Record<string, unknown> {
  const dpe = DPE_CONFIRMED(data.dpeSelectionStatus) && data.selectedDpe;
  const parcel = data.georisques?.parcel;
  return {
    address: data.address?.label ?? null,
    // L'ALTITUDE NE SORT PAS D'ICI (11/08/2026). Elle était transmise au modèle alors que le prompt
    // lui interdit, en toutes lettres, d'en tirer un signal. Trois synthèses stockées sur trois
    // portaient la déduction interdite (« le bâti est bas : à 7,5 mètres d'altitude, les fondations
    // sont proches d'un sol qui travaille »). Textes exacts et analyse :
    // docs/audits/2026-08-11-syntheses-logement-fautives.md
    //
    // Une donnée fournie sans usage autorisé finit par être mobilisée. L'altitude ne nourrit aucun
    // fait, aucune règle et aucune preuve de ce module : la frontière est de ne pas la donner, pas
    // de mieux formuler l'interdit. Le champ reste sur `SynthesisData` (d'autres surfaces le
    // lisent) ; il ne franchit plus la frontière du modèle.
    // `?? null` sur chaque champ : le type promet `| null`, mais ces objets viennent d'un JSON de base
    // où une colonne absente donne `undefined`, que le type ne voit pas. Or stableStringify JETTE sur
    // undefined (il refuse de donner la même identité à `absent` et à `null`), et ce hash tourne AUSSI
    // dans le navigateur. On rend donc le payload total plutôt que de l'espérer. Chaîne inchangée
    // quand la valeur est présente : aucun artefact existant n'est invalidé.
    dpe: dpe
      ? {
          etiquette: data.selectedDpe!.etiquette_dpe ?? null,
          ges: data.selectedDpe!.etiquette_ges ?? null,
          conso: data.selectedDpe!.conso_ep_m2 ?? null,
          emissions: data.selectedDpe!.emission_ges_m2 ?? null,
          surface: data.selectedDpe!.surface_m2 ?? null,
          construction: data.selectedDpe!.annee_construction ?? null,
          type: data.selectedDpe!.type_batiment ?? null,
        }
      : null,
    confortEte: dpe ? thermalEvidenceSummary(deriveThermalEvidence(data.selectedDpe!)) : null,
    risks: [...(parcel?.risks?.labels ?? []), ...(parcel?.pprn?.labels ?? [])],
    seismic: parcel?.seismic?.label ?? null,
    rga: parcel?.rga?.label ?? null,
    sinistralite: sinistralitePourRecit(data.sinistralite, data.catnatInondationCount),
    commune: data.communeData?.commune
      ? {
          name: data.communeData.commune.nom ?? null,
          population: data.communeData.commune.population ?? null,
        }
      : null,
    // Signal climat curé (codes, aucun chiffre). null si commune hors DRIAS ou sous plancher.
    climat_projete: data.climatProjete ?? null,
    // CONTEXTE D'ADRESSE, jamais une caractéristique du logement. Présent SEULEMENT quand rien
    // n'est attribué : dès qu'un diagnostic est confirmé, il devient le sujet et les autres n'ont
    // plus rien à dire. Réduit au strict nécessaire (un nombre, un écart), sans aucune valeur
    // individuelle : le modèle ne doit pas pouvoir citer l'étiquette d'un voisin.
    diagnostics_adresse: (() => {
      if (dpe) return null;
      const ctx = buildAddressDpeContext(data.dpeCandidates ?? []);
      if (!ctx) return null;
      return {
        total: ctx.total,
        ecart_classes: ctx.spread ? `${ctx.spread.min} à ${ctx.spread.max}` : null,
        immeuble_entier: ctx.hasCollective,
      };
    })(),
    // CE QUI A PU ÊTRE LU, ET CE QUI NE L'A PAS ÉTÉ. Entre dans le payload donc dans le hash :
    // une adresse dont le diagnostic apparaît plus tard régénère sa synthèse, ce qui est voulu.
    couverture: buildCoverage(data),
  };
}
