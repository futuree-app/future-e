// ════════════════════════════════════════════════════════════════════════════════════════════
// CE QUI EST AUTORISÉ AUTOUR DE L'ADRESSE.
//
// La question qu'aucune visite ne tranche : on visite un dimanche matin, on ne voit pas le terrain
// voisin autorisé depuis six mois. Cette lib assemble la lecture à partir du snapshot gelé ; la
// sélection (rayon, ancienneté, jointure) a eu lieu ailleurs, à la création du dossier.
//
// ── L'ABSENCE EST UNE RÉPONSE, ET C'EST MÊME LA PLUS FRÉQUENTE ────────────────────────────────
// Mesuré le 01/08/2026 sur 160 adresses : une adresse sur quatre a un permis récent à moins de
// 50 m. Les trois autres n'en ont pas, et c'est une information — à condition de dire de QUOI il
// n'y en a pas. Le registre SDES ne recense que les autorisations CRÉANT DES LOGEMENTS : un
// entrepôt, un commerce, une extension sans logement nouveau n'y sont pas. « Aucune autorisation »
// tout court promettrait un quartier immobile que la source ne permet pas d'affirmer, donc la
// phrase porte toujours l'objet du registre.
//
// ── LE PÉRIMÈTRE SE LIT DANS LE SNAPSHOT, JAMAIS DANS LES CONSTANTES ──────────────────────────
// Rayon et fenêtre sont gelés avec les permis qu'ils ont sélectionnés (cf. `PermisSnapshot`). Un
// texte bâti sur `RAYON_PERMIS_M` décrirait les dossiers anciens avec le rayon d'aujourd'hui.
//
// Pur, testé sous `node --test`.
// ════════════════════════════════════════════════════════════════════════════════════════════

import type { Face3Snapshot, PermisSnapshot } from "../logement-autour-types.ts";
import { LIBELLE_ETAT, type EtatAutorisation } from "../sitadel-etat.ts";
import { limitePermis } from "../sitadel-selection.ts";

type EtatMontrable = Exclude<EtatAutorisation, "sans_date">;

/**
 * L'ORDRE DES ÉTATS À L'INTÉRIEUR D'UNE MÊME ANNÉE.
 *
 * Du plus à venir au plus révolu : un chantier qui n'a pas commencé est ce qui reste à découvrir
 * en s'installant, un chantier achevé est déjà dans le paysage qu'on a visité.
 */
const RANG: Record<EtatMontrable, number> = {
  autorise_non_commence: 0,
  chantier_ouvert: 1,
  acheve: 2,
};

const NOMBRE_FR = ["", "Une", "Deux", "Trois", "Quatre", "Cinq", "Six", "Sept", "Huit", "Neuf"];
const MOIS_FR = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];

/** « le 1ᵉʳ août 2026 ». Écrit à la main plutôt que délégué à Intl : la lib reste pure et testable. */
export function dateFr(iso: string): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return null;
  const jour = Number.parseInt(m[3], 10);
  const mois = MOIS_FR[Number.parseInt(m[2], 10) - 1];
  if (!mois || !Number.isFinite(jour)) return null;
  return `${jour === 1 ? "1er" : jour} ${mois} ${m[1]}`;
}

export type PermisLecture = {
  /** La phrase d'ouverture. Porte toujours l'objet du registre et le rayon gelé. */
  lead: string;
  /** Une ligne par (année, état), de la plus récente à la plus ancienne. Vide si aucun permis. */
  lignes: { label: string; annee: number; nombre: number }[];
  /** La convention de lecture, bâtie sur le périmètre QUI A SERVI. Toujours présente. */
  limite: string;
  /** « Registre consulté le … ». `null` si la date gelée est illisible. */
  consultation: string | null;
};

/**
 * Assemble la lecture des permis.
 *
 * Rend `null` quand le registre n'a PAS été consulté (snapshot antérieur au 01/08/2026, ou API
 * muette au moment de l'analyse). Le bloc disparaît alors entièrement : afficher « aucune
 * autorisation » sur la foi d'une panne serait affirmer un fait qu'on n'a pas établi.
 */
export function buildPermisLecture(s: Face3Snapshot): PermisLecture | null {
  const p: PermisSnapshot | undefined = s.permis;
  if (!p) return null;

  const depuis = p.anneeReference - p.ancienneteMaxAns;

  // Regroupement (année, état) : à 50 m sur trois ans, il y a au plus trois années et trois
  // états, donc neuf lignes au maximum. Aucune troncature n'est nécessaire, et il n'y en a donc
  // aucune de silencieuse.
  const groupes = new Map<string, { annee: number; etat: EtatMontrable; nombre: number }>();
  for (const permis of p.permis) {
    const cle = `${permis.annee}|${permis.etat}`;
    const g = groupes.get(cle);
    if (g) g.nombre += 1;
    else groupes.set(cle, { annee: permis.annee, etat: permis.etat, nombre: 1 });
  }

  const lignes = [...groupes.values()]
    .sort((a, b) => b.annee - a.annee || RANG[a.etat] - RANG[b.etat])
    .map((g) => {
      const etat = LIBELLE_ETAT[g.etat];
      return {
        annee: g.annee,
        nombre: g.nombre,
        label: g.nombre > 1
          ? `${g.nombre} dossiers · ${etat}`
          : `${etat.charAt(0).toUpperCase()}${etat.slice(1)}`,
      };
    });

  const total = p.permis.length;
  const lead = total === 0
    ? `Aucune autorisation d'urbanisme créant des logements sur les parcelles situées à moins ` +
      `de ${p.rayonMeters} m de l'adresse, parmi les dossiers déposés depuis ${depuis}.`
    : `${total < NOMBRE_FR.length ? NOMBRE_FR[total] : String(total)} autorisation` +
      `${total > 1 ? "s" : ""} d'urbanisme créant des logements porte${total > 1 ? "nt" : ""} sur ` +
      `des parcelles situées à moins de ${p.rayonMeters} m de l'adresse.`;

  const jour = dateFr(p.consulteLe);
  return {
    lead,
    lignes,
    limite: limitePermis(p.rayonMeters, p.ancienneteMaxAns),
    consultation: jour ? `Registre national des autorisations d'urbanisme, consulté le ${jour}` : null,
  };
}
