// ════════════════════════════════════════════════════════════════════════════════════════════
// LA CONCLUSION DU MODULE AUTOUR, DÉTERMINISTE.
//
// POURQUOI ELLE MANQUAIT. Le module rendait des faits et s'arrêtait : cinq lignes « type le plus
// proche · distance », l'équipement automobile, l'espace vert, l'îlot de chaleur, puis un renvoi
// vers le Logement. Le lecteur repartait avec des nombres et sans lecture. C'est le module le plus
// mince des trois, et la mesure du 31/07/2026 lui donne un poids nouveau : la face Énergie du
// dossier est vide pour 75 à 86 % des adresses, donc ce sont Territoire, les risques de l'adresse
// et Autour qui portent le dossier payé.
//
// AUCUN TROISIÈME PROMPT. Contrainte posée avec le chantier : cette conclusion s'assemble à partir
// des faits, comme `equipementAutoStatement` le fait déjà pour le secteur. Un modèle de plus
// coûterait un appel, une version, un cache et un risque d'invention, pour dire ce que quatre
// nombres disent déjà.
//
// AUCUN SCORE, AUCUN JUGEMENT. Ni note, ni « bien desservi », ni « quartier vivant » : l'ADR-0001
// interdit la note composite, et un adjectif de qualité serait une note déguisée. On DÉCRIT une
// configuration : ce qui est à portée de pas, ce qui ne l'est pas, ce qui n'existe pas dans le
// périmètre cherché. Le lecteur juge.
//
// Pur, testé sous `node --test`.
// ════════════════════════════════════════════════════════════════════════════════════════════

import {
  BPE_WALK_RADIUS_M,
  type Face3Cat,
  type Face3Snapshot,
  type PermisSnapshot,
} from "../logement-autour-types.ts";

/**
 * LE SEUIL « À PORTÉE DE PAS » : 500 mètres, à vol d'oiseau.
 *
 * C'est la distance qu'on parcourt en six à sept minutes à pied. Elle est mesurée À VOL D'OISEAU,
 * donc le trajet réel est plus long, de l'ordre de 1,2 à 1,4 fois selon la trame des rues. Le
 * texte le dit plutôt que de convertir avec un coefficient inventé.
 *
 * Convention de produit, donc NOMMÉE ET DITE dans la phrase, au même titre que le seuil de
 * `ECART_SECTEUR_NOTABLE` : un seuil qui gouverne une phrase sans être affiché est un jugement
 * caché.
 *
 * LA VALEUR VIT DANS LE CONTRAT PARTAGÉ (`BPE_WALK_RADIUS_M`), parce que le comptage des
 * équipements s'en sert aussi. Deux constantes pour un même seuil finiraient par diverger, et
 * l'écran dirait « 3 à moins de 500 m » sous une phrase parlant d'un autre périmètre.
 */
export const SEUIL_A_PIED_M = BPE_WALK_RADIUS_M;

/**
 * Le libellé de famille, quand aucun type précis n'est renseigné.
 *
 * Le GENRE est porté ici parce que la phrase d'absence l'accorde deux fois : « Aucune école n'est
 * recensée » contre « Aucun commerce alimentaire n'est recensé ». Une première version l'ignorait
 * et écrivait « Aucun école n'est recensé », attrapé par un test.
 */
const FAMILLE: Record<Face3Cat, { article: string; nom: string; genre: "m" | "f" }> = {
  sante: { article: "un", nom: "repère de santé", genre: "m" },
  alimentation: { article: "un", nom: "commerce alimentaire", genre: "m" },
  education: { article: "une", nom: "école", genre: "f" },
  transports: { article: "un", nom: "point de transport", genre: "m" },
  services: { article: "un", nom: "service du quotidien", genre: "m" },
};

/** L'article de chaque type précis de la nomenclature BPE. Fini, connu, donc écrit. */
const ARTICLE_TYPE: Record<string, string> = {
  "Médecin généraliste": "un", "Pharmacie": "une",
  "Supermarché": "un", "Supérette": "une", "Épicerie": "une",
  "Boucherie-charcuterie": "une", "Boulangerie": "une", "Primeur": "un",
  "École maternelle": "une", "École primaire": "une", "École élémentaire": "une",
  "Gare": "une", "Halte ferroviaire": "une",
  "Banque": "une", "Bureau de poste": "un",
};

function nomme(cat: Face3Cat, typeLabel: string | null): string {
  if (typeLabel && ARTICLE_TYPE[typeLabel]) return `${ARTICLE_TYPE[typeLabel]} ${typeLabel.toLowerCase()}`;
  if (typeLabel) return `un ${typeLabel.toLowerCase()}`;
  const f = FAMILLE[cat];
  return `${f.article} ${f.nom}`;
}

/** Distance en mètres, écrite comme on la lit. */
export function distanceFr(m: number): string {
  if (m < 1000) return `${m} m`;
  return `${(m / 1000).toFixed(1).replace(".", ",")} km`;
}

/** Une énumération française : « a, b et c ». */
function et(parts: string[]): string {
  if (parts.length <= 1) return parts[0] ?? "";
  return `${parts.slice(0, -1).join(", ")} et ${parts[parts.length - 1]}`;
}

export type AutourConclusion = {
  /** La configuration du secteur, en une ou deux phrases. */
  lead: string;
  /**
   * LA CHARNIÈRE TEMPORELLE. `null` quand aucun permis non achevé n'est retenu.
   *
   * Le bloc des permis, rendu juste au-dessus, porte déjà toute la charge factuelle : présence ou
   * absence, périmètre, objet du registre, année, état, date de consultation. Ce que ces faits ne
   * disent pas, et que la conclusion pose : la configuration décrite est celle observée lors de
   * l'analyse, et elle n'était peut-être pas stabilisée.
   *
   * ── CE CHAMP NE SE SUFFIT PAS À LUI-MÊME ─────────────────────────────────────────────────
   * La phrase peut porter l'année de DÉPÔT du dossier, jamais la date de CONSULTATION du registre,
   * qui est celle qui borne l'état observé. « Peut encore changer » n'est au présent que parce que
   * le lecteur voit, sur la même surface, à quelle date le registre a été consulté.
   *
   * Toute réutilisation de `AutourConclusion` hors de `AutourModule` (un PDF, un partage, une
   * synthèse qui en cite le texte) doit donc afficher cette date quelque part, sans quoi un lecteur
   * de 2028 lira au présent une possibilité constatée en 2026.
   */
  mouvement: string | null;
  /** Ce qui est absent du périmètre cherché. Vide si tout a été trouvé. */
  absences: string[];
  /** Ce que ces nombres ne disent pas. Toujours présent. */
  limite: string;
};

/**
 * LA CHARNIÈRE TEMPORELLE DES PERMIS.
 *
 * Elle ne dit qu'une chose : ce qui est décrit au-dessus n'est peut-être pas stabilisé. Jamais la
 * nature du changement, jamais son ampleur, jamais sa date.
 *
 * NON ACHEVÉ SEULEMENT. Un achevé ne signale plus une transformation à venir au moment de
 * l'analyse. L'absence, elle, est déjà dite par le bloc au-dessus, où elle est bornée par le
 * périmètre et l'objet du registre ; la répéter ici coûterait une phrase sur trois dossiers sur
 * quatre pour ne rien ajouter.
 *
 * LE MODAL EST OBLIGATOIRE. Une autorisation EST une permission de changer, elle ne prouve pas que
 * le changement aura lieu. « Peut encore changer » est donc plus faible que la donnée elle-même, ce
 * qui est exactement le but. Le verbe est « changer » et non « évoluer », qui penche vers
 * l'amélioration en français, sur une phrase dont tout l'enjeu est de ne rien qualifier.
 */
function buildMouvement(p: PermisSnapshot | undefined): string | null {
  if (!p) return null;
  const retenus = p.permis.filter((x) => x.etat !== "acheve");
  if (retenus.length === 0) return null;
  return "Cette configuration peut encore changer.";
}

/**
 * Assemble la conclusion. Rend `null` quand il n'y a rien à conclure : source BPE en échec, ou
 * aucune catégorie examinée. Une conclusion sur des données absentes dirait « rien à proximité »
 * là où il faudrait dire « on n'a pas pu regarder », et c'est exactement la confusion que le
 * produit s'interdit ailleurs.
 */
export function buildAutourConclusion(s: Face3Snapshot): AutourConclusion | null {
  if (s.sourceStatus.bpe !== "complete") return null;
  const cats = s.bpe.categories;
  if (cats.length === 0) return null;

  const trouves = cats.filter((c) => c.nearest != null);
  const manquants = cats.filter((c) => c.nearest == null);
  const aPied = trouves.filter((c) => c.nearest!.distanceMeters <= SEUIL_A_PIED_M);

  const convention = `à moins de ${SEUIL_A_PIED_M} m à vol d'oiseau`;
  const total = cats.length;

  let lead: string;

  if (aPied.length === 0 && trouves.length === 0) {
    // Rien de recensé nulle part dans le périmètre : le lead ne peut porter que sur l'absence.
    lead =
      `Aucun des ${total} repères du quotidien examinés n'est recensé autour de cette adresse, ` +
      `dans les périmètres analysés.`;
  } else if (aPied.length === 0) {
    // Le plus proche fixe l'échelle : sans lui, « aucun à 500 m » laisse imaginer le désert.
    const plusProche = [...trouves].sort((a, b) => a.nearest!.distanceMeters - b.nearest!.distanceMeters)[0];
    lead =
      `Aucun des ${total} repères du quotidien examinés n'est ${convention} de cette adresse. ` +
      `Le plus proche est ${nomme(plusProche.category, plusProche.nearest!.typeLabel)}, ` +
      `à ${distanceFr(plusProche.nearest!.distanceMeters)}.`;
  } else {
    const noms = aPied
      .sort((a, b) => a.nearest!.distanceMeters - b.nearest!.distanceMeters)
      .map((c) => nomme(c.category, c.nearest!.typeLabel));
    lead =
      `Sur les ${total} repères du quotidien examinés, ${aPied.length} ${aPied.length > 1 ? "sont" : "est"} ` +
      `${convention} : ${et(noms)}. Le trajet réel est plus long que cette distance.`;

    // La contrainte dominante : le plus ÉLOIGNÉ de ceux qui existent, quand il sort du périmètre
    // de marche. C'est lui qui décidera d'un déplacement, donc il vaut d'être nommé.
    const loin = trouves
      .filter((c) => c.nearest!.distanceMeters > SEUIL_A_PIED_M)
      .sort((a, b) => b.nearest!.distanceMeters - a.nearest!.distanceMeters)[0];
    if (loin) {
      lead +=
        ` Le plus éloigné est ${nomme(loin.category, loin.nearest!.typeLabel)}, ` +
        `à ${distanceFr(loin.nearest!.distanceMeters)}.`;
    }
  }

  const absences = manquants.map((c) => {
    const f = FAMILLE[c.category];
    const aucun = f.genre === "f" ? "Aucune" : "Aucun";
    const recense = f.genre === "f" ? "recensée" : "recensé";
    return (
      `${aucun} ${f.nom} n'est ${recense} dans les ` +
      `${distanceFr(c.searchCapMeters)} analysés autour de l'adresse.`
    );
  });

  return {
    lead,
    mouvement: buildMouvement(s.permis),
    absences,
    limite:
      "Ces distances mesurent la présence, jamais la qualité, les horaires ni la capacité d'accueil " +
      "de ces équipements, et elles se comptent à vol d'oiseau.",
  };
}
