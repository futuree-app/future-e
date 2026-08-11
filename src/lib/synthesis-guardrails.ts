// ════════════════════════════════════════════════════════════════════════════════════════════
// LES ASSERTIONS QU'UNE SYNTHÈSE NE PEUT PAS PORTER.
//
// ── POURQUOI CE MODULE EXISTE ────────────────────────────────────────────────────────────────
// Le prompt de `synthesize-logement` interdit déjà, en toutes lettres, de faire de l'altitude un
// signal, de raconter l'absence d'un zonage et de suggérer une protection qu'aucune donnée
// n'établit. Les trois synthèses stockées en base le 11/08/2026 enfreignaient toutes les trois au
// moins un de ces interdits (textes exacts :
// `docs/audits/2026-08-11-syntheses-logement-fautives.md`).
//
// La leçon est écrite dans le vault : **un prompt n'est pas une frontière de sûreté**. Une
// instruction est une préférence exprimée à un modèle. Ce qui tient, c'est de ne pas fournir la
// donnée (fait pour l'altitude), ou de VÉRIFIER le texte produit et de refuser.
//
// ── CE QUE CE MODULE NE PRÉTEND PAS FAIRE ────────────────────────────────────────────────────
// Il ne valide pas la véracité d'une phrase. Il attrape des FORMULATIONS dont on sait qu'elles
// affirment plus que ce que le moteur établit. C'est un filet, pas une preuve : la garantie forte
// reste de ne pas générer (le verdict du dossier, `generable: false`) ou de ne pas transmettre.
//
// ── LE COÛT D'UN FAUX POSITIF EST ASSUMÉ ─────────────────────────────────────────────────────
// Un texte refusé à tort prive le lecteur de prose, jamais d'un fait : les cartes déterministes
// portent le module entière. Un texte faux laissé passer, lui, coûte la promesse du produit. En
// cas de doute, on refuse. La seule précaution prise contre l'excès de zèle : une formulation
// d'INCERTITUDE proche du motif le désamorce (« aucune exposition n'a pu être établie » décrit une
// lacune, quand « ne porte aucune exposition » conclut une absence).
// ════════════════════════════════════════════════════════════════════════════════════════════

export type AssertionVerdict =
  | { ok: true }
  | { ok: false; motif: string; famille: Famille; extrait: string };

type Famille = "altitude" | "absence_conclue" | "protection_supposee";

/** Normalisation partagée avec `coverage-closure` : diacritiques et apostrophes typographiques. */
function fold(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[’‘]/g, "'")
    .toLowerCase();
}

type Regle = { famille: Famille; motifs: string[]; desamorcable: boolean };

const REGLES: Regle[] = [
  {
    // L'ALTITUDE NE FIGURE PLUS DANS LE PAYLOAD depuis le 11/08/2026. Sa mention ne peut donc plus
    // venir que d'une invention, ce qui rend ce motif à la fois strict et sans faux positif
    // possible : la valeur n'est pas connue du modèle.
    famille: "altitude",
    motifs: ["altitude", "metres au-dessus du niveau de la mer", "m ngf"],
    desamorcable: false,
  },
  {
    // Conclure une absence d'exposition à partir d'une absence de zonage. Le prompt cite
    // « aucun risque signalé » et « pas de plan de prévention » ; la sortie réelle de Nantes allait
    // plus loin (« ne porte aucune exposition aux inondations ni aux mouvements de sol »).
    famille: "absence_conclue",
    motifs: [
      "aucune exposition", "aucun risque", "sans risque particulier", "aucun zonage",
      "pas de plan de prevention", "aucun plan de prevention", "n'est pas expose",
      "n'est pas exposee", "aucun risque signale", "rien a signaler",
    ],
    desamorcable: true,
  },
  {
    // Un mécanisme ou une protection dont la donnée n'existe pas.
    famille: "protection_supposee",
    motifs: ["a l'abri", "protege des crues", "protegee des crues", "mise hors d'eau", "digue"],
    desamorcable: true,
  },
];

// Ce qui transforme une conclusion en constat de lacune. Cherché dans la FENÊTRE qui suit le motif :
// « aucune exposition n'a pu être établie » est honnête, « ne porte aucune exposition » ne l'est pas.
const INCERTITUDE = [
  "n'a pas pu", "n'a pu", "n'est pas etabli", "n'est pas etablie", "faute de", "non renseigne",
  "non renseignee", "pas ete mesure", "pas ete mesuree", "reste inconnu", "reste inconnue",
  "n'a pas ete", "impossible",
];
const FENETRE = 70;

/**
 * Le texte porte-t-il une affirmation que le moteur n'établit pas ?
 *
 * Rend le PREMIER motif rencontré : il suffit à refuser, et la relance cite ce motif au modèle.
 */
export function validateAssertions(text: string): AssertionVerdict {
  const t = fold(text);
  for (const regle of REGLES) {
    for (const motif of regle.motifs) {
      const i = t.indexOf(motif);
      if (i === -1) continue;
      if (regle.desamorcable) {
        const suite = t.slice(i, i + motif.length + FENETRE);
        if (INCERTITUDE.some((marqueur) => suite.includes(marqueur))) continue;
      }
      return {
        ok: false,
        motif,
        famille: regle.famille,
        // De quoi comprendre le refus dans un log sans rouvrir la base.
        extrait: text.slice(Math.max(0, i - 40), i + motif.length + 60).replace(/\s+/g, " ").trim(),
      };
    }
  }
  return { ok: true };
}

/** La correction envoyée au modèle pour sa seconde tentative. */
export function correctionPourAssertions(v: Extract<AssertionVerdict, { ok: false }>): string {
  const consigne: Record<Famille, string> = {
    altitude:
      "Vous avez mentionné l'altitude du terrain. Cette donnée ne vous est pas fournie et n'a aucun usage dans cette lecture : retirez-la entièrement, ainsi que toute déduction qui s'appuie sur elle.",
    absence_conclue:
      "Vous avez conclu l'absence d'une exposition ou d'un risque. Vous ne pouvez nommer qu'un zonage qui EXISTE. Une absence de plan ou de zonage ne se raconte pas : retirez la phrase, ou dites seulement que la dimension n'a pas pu être établie.",
    protection_supposee:
      "Vous avez suggéré une protection ou un mécanisme dont aucune donnée ne vous est fournie. Retirez-le : vous n'avez que ce qui est écrit dans le payload.",
  };
  return `Votre texte précédent a été refusé. ${consigne[v.famille]}\n\nPassage en cause : « ${v.extrait} »\n\nRéécrivez la lecture entière en respectant toutes vos règles.`;
}
