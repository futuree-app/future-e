// FUT-75 · LE GESTE DU RELEVÉ : LE MINI-SYSTÈME MOTION DE FUTUR•E, EN LOGIQUE PURE.
//
// Ce fichier ne dessine rien et n'anime rien. Il fixe les règles que les trois prototypes appliquent,
// pour qu'elles soient testables (`node --test`) et qu'aucun composant ne les réinvente :
//
//   1. LE REPÈRE BOUGE, LA DONNÉE RESTE. Un curseur, un cadre, une emphase, un trait de relation se
//      déplacent ; une valeur ne défile jamais, une barre ne s'étire jamais d'un horizon à l'autre
//      (DESIGN.md § 6.4 : « Aucune donnée ne s'anime »). Entre deux jalons, rien n'est montré, parce
//      que rien n'est connu.
//   2. TRACER, C'EST AVOIR PARCOURU. Une forme ne se trace que si la lecture l'a réellement examinée.
//      Une échelle non examinée apparaît en pointillé, posée, jamais tracée.
//   3. RIEN N'ATTEND LE MOUVEMENT. Tout texte et tout lien existent et sont lisibles dès le premier
//      rendu ; le mouvement ne porte que des couches de repère. Une séquence s'interrompt au premier
//      geste du lecteur.
//   4. UNE SEULE COURBE, PAS DE REBOND. Le rebond dit l'imprécision ; un instrument de mesure se pose.
//
// Durées, courbes et modes sont repris par `motion.module.css` (variables `--m-*`) : les deux doivent
// bouger ensemble (test M1).
import {
  CERCLE_TERRITOIRE, CARRE_AUTOUR, COTE_LOGEMENT, ECHELLE_CENTRE, ECHELLE_VIEWBOX,
} from "../../report/echelle-geometry.ts";

// ── Durées et courbes ──────────────────────────────────────────────────────────────────────────

/**
 * QUATRE DURÉES, PAS UNE DE PLUS (en millisecondes).
 *   micro   la réponse au pointage, au focus, à la pression : une teinte, un trait qui s'épaissit ;
 *   etat    un repère qui change de place : curseur d'horizon, cadre d'échelle ;
 *   trace   un trait qui se dessine : une forme parcourue, une relation entre deux blocs ;
 *   plafond la durée maximale d'une séquence entière, ouverture comprise.
 */
export const DUREES = { micro: 120, etat: 240, trace: 520, plafond: 900 } as const;

/**
 * LES COURBES. `releve` : un départ franc, une arrivée posée (l'outil vient se placer). `sortie` :
 * ce qui quitte la scène accélère, pour libérer la place sans traîner. Aucun ressort.
 */
export const COURBES = {
  releve: "cubic-bezier(0.2, 0.7, 0.2, 1)",
  sortie: "cubic-bezier(0.4, 0, 1, 1)",
} as const;

// ── Modes ──────────────────────────────────────────────────────────────────────────────────────

/** `anime` : le langage complet. `reduit` : préférence système, aucun déplacement, changements d'état
 *  instantanés ou fondus de 120 ms au plus. `aucun` : l'état final seul (la version sans animation). */
export type ModeMouvement = "anime" | "reduit" | "aucun";

/** Le mode effectif : un choix explicite (banc) gagne, sinon la préférence système. */
export function resoudreMode(explicite: ModeMouvement | null | undefined, prefereReduit: boolean): ModeMouvement {
  if (explicite) return explicite;
  return prefereReduit ? "reduit" : "anime";
}

/** La durée réellement jouée dans un mode : seul `anime` déplace ; `reduit` garde un fondu court. */
export function duree(cle: keyof typeof DUREES, mode: ModeMouvement, deplacement = true): number {
  if (mode === "aucun") return 0;
  if (mode === "reduit") return deplacement ? 0 : Math.min(DUREES.micro, DUREES[cle]);
  return DUREES[cle];
}

// ── Prototype A : le lieu qui se révèle ────────────────────────────────────────────────────────

export type FormeEchelle = "logement" | "autour" | "territoire";
export type EtatForme = "constats" | "examinee" | "non_examinee";

/**
 * L'ORDRE DU TRACÉ À L'OUVERTURE : du précis au large (logement, autour, territoire), comme le lecteur
 * qui part de son adresse. Seules les échelles examinées se tracent, l'une après l'autre ; une échelle
 * non examinée se POSE en pointillé, à la fin, sans délai propre. La séquence entière tient sous le
 * plafond, quel que soit le nombre de formes tracées.
 */
export function ordreDeTrace(etats: Record<FormeEchelle, EtatForme>, mode: ModeMouvement = "anime"): {
  forme: FormeEchelle; geste: "tracer" | "poser"; delai: number; duree: number;
}[] {
  const ordre: FormeEchelle[] = ["logement", "autour", "territoire"];
  const tracees = ordre.filter((f) => etats[f] !== "non_examinee");
  const posees = ordre.filter((f) => etats[f] === "non_examinee");
  if (mode !== "anime") return ordre.map((forme) => ({ forme, geste: etats[forme] === "non_examinee" ? "poser" : "tracer", delai: 0, duree: 0 }));
  // Les tracés se chevauchent (chacun démarre au tiers du précédent) : on lit une seule ouverture, pas
  // trois animations successives.
  const pas = tracees.length > 1 ? Math.round((DUREES.plafond - DUREES.trace) / (tracees.length - 1)) : 0;
  const parTrace = tracees.map((forme, i) => ({ forme, geste: "tracer" as const, delai: Math.min(i * Math.min(pas, 220), DUREES.plafond - DUREES.trace), duree: DUREES.trace }));
  const finTraces = parTrace.length ? Math.max(...parTrace.map((t) => t.delai + t.duree)) : 0;
  const parPose = posees.map((forme) => ({ forme, geste: "poser" as const, delai: Math.max(0, Math.min(finTraces - DUREES.etat, DUREES.plafond - DUREES.etat)), duree: DUREES.etat }));
  return ordre.map((f) => [...parTrace, ...parPose].find((x) => x.forme === f)!);
}

export type Cadre = { x: number; y: number; w: number; h: number };

/**
 * LE CADRE QUI ENTOURE UNE ÉCHELLE (le réticule du prototype A), dans la boîte de l'emblème. Il est
 * calculé depuis la géométrie de production, jamais posé au jugé : le cadre dit exactement le
 * périmètre de la forme, ni plus ni moins.
 */
export function cadreDe(forme: FormeEchelle | null, marge = 8): Cadre {
  if (forme === null) return { x: marge / 2, y: marge / 2, w: ECHELLE_VIEWBOX - marge, h: ECHELLE_VIEWBOX - marge };
  if (forme === "territoire") {
    const r = CERCLE_TERRITOIRE.r + marge;
    return { x: ECHELLE_CENTRE - r, y: ECHELLE_CENTRE - r, w: 2 * r, h: 2 * r };
  }
  if (forme === "autour") {
    return { x: CARRE_AUTOUR.x - marge, y: CARRE_AUTOUR.y - marge, w: CARRE_AUTOUR.width + 2 * marge, h: CARRE_AUTOUR.height + 2 * marge };
  }
  // Le losange : un carré de COTE_LOGEMENT tourné de 45°, sa boîte englobante a la diagonale pour côté.
  const demi = (COTE_LOGEMENT * Math.SQRT2) / 2 + marge;
  return { x: ECHELLE_CENTRE - demi, y: ECHELLE_CENTRE - demi, w: 2 * demi, h: 2 * demi };
}

/**
 * LE RECUL (variante A3) : le facteur d'agrandissement qui fait remplir le cadre de l'emblème par la
 * forme choisie. Un SCHÉMA qui s'agrandit, jamais une carte qui zoome : le rapport est géométrique,
 * propre au dessin, et ne dit rien des distances réelles. Plafonné, pour que le losange ne devienne pas
 * un plein écran.
 */
export function facteurDeRecul(forme: FormeEchelle | null): number {
  if (forme === null || forme === "territoire") return 1;
  const cible = cadreDe("territoire", 0).w;
  return Math.min(1.9, cible / cadreDe(forme, 0).w);
}

// ── Prototype B : explorer le temps ────────────────────────────────────────────────────────────

export type CleHorizon = "gwl15" | "gwl20" | "gwl30";
export const ORDRE_HORIZONS: readonly CleHorizon[] = ["gwl15", "gwl20", "gwl30"];

export type JalonHorizon = {
  cle: CleHorizon;
  /** La valeur projetée, telle que la source la donne. `null` : la source n'a rien pour cet horizon. */
  valeur: number | null;
  /** Au-dessus du seuil de signalement futur•e. `null` quand la valeur manque : on ne présume rien. */
  auDessus: boolean | null;
};

/**
 * LES JALONS, ET RIEN QU'EUX. Une entrée par horizon documenté, avec la valeur de la source ou `null`.
 * Aucune valeur intermédiaire n'est construite, aucune valeur absente n'est déduite de ses voisines.
 */
export function jalonsHorizons(valeurs: Partial<Record<CleHorizon, number | null>>, seuil: number): JalonHorizon[] {
  return ORDRE_HORIZONS.map((cle) => {
    const v = valeurs[cle];
    const valeur = typeof v === "number" && Number.isFinite(v) ? v : null;
    return { cle, valeur, auDessus: valeur == null ? null : valeur >= seuil };
  });
}

/**
 * LE CLAVIER D'UN GROUPE DE BOUTONS RADIO (WAI-ARIA) : flèches pour passer d'un horizon au voisin,
 * Début et Fin pour les extrémités. Les flèches bouclent, comme le veut le motif radio.
 */
export function horizonVoisin(courant: CleHorizon, touche: string): CleHorizon | null {
  const i = ORDRE_HORIZONS.indexOf(courant);
  const n = ORDRE_HORIZONS.length;
  if (touche === "ArrowRight" || touche === "ArrowDown") return ORDRE_HORIZONS[(i + 1) % n]!;
  if (touche === "ArrowLeft" || touche === "ArrowUp") return ORDRE_HORIZONS[(i - 1 + n) % n]!;
  if (touche === "Home") return ORDRE_HORIZONS[0]!;
  if (touche === "End") return ORDRE_HORIZONS[n - 1]!;
  return null;
}

// ── Prototype C : du fait à la décision ────────────────────────────────────────────────────────

/**
 * LES ÉTAPES DU CHEMIN, dans l'ordre où le moteur les a réellement enchaînées : ce que le lecteur a
 * demandé, ce que la source établit, la convention qui le rend signalable, ce que le dossier en conclut
 * pour le projet, ce que la donnée ne dit pas, et ce qu'il reste à vérifier soi-même. L'interprétation
 * vient après ses fondements dans le CHEMIN ; à l'écran, elle reste lisible d'emblée, en tête.
 */
export const ETAPES_CHEMIN = ["projet", "fait", "convention", "interpretation", "limite", "geste"] as const;
export type EtapeChemin = (typeof ETAPES_CHEMIN)[number];

/** L'étape suivante ou précédente, bornée (un parcours, pas une boucle). */
export function etapeVoisine(courante: number, sens: 1 | -1): number {
  return Math.max(-1, Math.min(ETAPES_CHEMIN.length - 1, courante + sens));
}

/**
 * CE QUI EST ÉCLAIRÉ À UNE ÉTAPE : l'étape courante et celles qu'elle relie. Les autres restent
 * lisibles, simplement moins contrastées. `-1` : aucune étape choisie, tout est au même niveau.
 */
export function etapesEclairees(courante: number): Set<EtapeChemin> {
  if (courante < 0) return new Set(ETAPES_CHEMIN);
  return new Set(ETAPES_CHEMIN.slice(0, courante + 1));
}
