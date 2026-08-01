// ════════════════════════════════════════════════════════════════════════════════════════════
// QUELS PERMIS MONTRER, ET COMMENT LES DIRE.
//
// Deuxième brique du chantier (la première, `sitadel-etat.ts`, déduit l'état des dates). Ici vit
// tout ce qui se décide : le périmètre, l'ancienneté, la clé de jointure et les phrases. L'appel
// réseau, lui, n'a plus qu'à remplir une liste.
//
// ── LE PÉRIMÈTRE, TRANCHÉ PAR LA MESURE DU 01/08/2026 ─────────────────────────────────────────
// Sur 160 adresses tirées uniformément dans la BAN
// (`docs/audits/mesure-permis-2026-08-01.json`), part des adresses ayant au moins un permis :
//
//   rayon     tout état   non achevé   déposé depuis 3 ans
//    50 m       55,0 %      43,1 %          24,4 %
//   100 m       80,6 %      71,3 %          46,9 %
//   200 m       95,6 %      91,9 %          67,5 %
//
// Le problème n'était pas la rareté, c'était le BRUIT : à 200 m, 95,6 % des adresses ont un permis
// à côté, et une information que presque tout le monde reçoit ne distingue plus rien. À 50 m
// filtré aux trois dernières années, le signal concerne une adresse sur quatre.
//
// ── LA CLÉ DE JOINTURE ────────────────────────────────────────────────────────────────────────
// Le cadastre rend le numéro de parcelle COMPLÉTÉ À QUATRE CHIFFRES (« 0300 »), Sitadel le rend
// brut (« 300 »). Sans normalisation, la jointure ne trouve jamais rien : le premier essai de la
// mesure a rendu zéro permis sur huit adresses, ce qui aurait fermé le chantier sur un faux
// verdict.
//
// Pur, testé sous `node --test`.
// ════════════════════════════════════════════════════════════════════════════════════════════

import { etatAutorisation, etatMontrable, type EtatAutorisation, type SitadelDates } from "./sitadel-etat.ts";

/** Le rayon retenu, en mètres. NOMMÉ dans le texte, comme les 500 m du comptage. */
export const RAYON_PERMIS_M = 50;

/** L'ancienneté maximale d'un dépôt, en années. Au-delà, un permis raconte le passé lointain. */
export const ANCIENNETE_MAX_ANS = 3;

/** Une autorisation, réduite à ce dont l'affichage a besoin. */
export type Autorisation = SitadelDates & {
  /** Les parcelles du dossier, jusqu'à trois. */
  parcelles: string[];
  /** AN_DEPOT. */
  annee: number;
};

/**
 * La clé de jointure, normalisée des deux côtés. Voir l'en-tête : c'est le zéro de tête qui a
 * failli faire conclure que la fonctionnalité était inutile.
 */
export function cleParcelle(section: string | null | undefined, numero: string | null | undefined): string {
  const s = String(section ?? "").trim().toUpperCase();
  const n = String(numero ?? "").trim().replace(/^0+/, "");
  return `${s}|${n}`;
}

/**
 * UN PERMIS RETENU PORTE SON ÉTAT, PAS SA PHRASE.
 *
 * Ces objets sont GELÉS dans le snapshot du dossier. Y écrire le libellé figerait la formulation
 * du jour de l'analyse : réécrire « chantier déclaré ouvert » plus tard laisserait les dossiers
 * déjà créés parler l'ancienne langue, et deux dossiers voisins diraient deux choses de la même
 * situation. L'état est le FAIT, le libellé est de la présentation : il se calcule au rendu par
 * `LIBELLE_ETAT`.
 */
export type PermisRetenu = { annee: number; etat: Exclude<EtatAutorisation, "sans_date"> };

/**
 * Les permis à montrer pour une adresse.
 *
 * `parcelles` sont les clés normalisées des parcelles dans `RAYON_PERMIS_M` autour du point.
 * `anneeCourante` est un paramètre pour que la fonction reste PURE : une fonction qui lit
 * l'horloge ne peut pas être testée sur sa règle d'ancienneté, qui est précisément la règle.
 *
 * L'ordre est du plus récent au plus ancien : ce qui vient de se décider prime sur ce qui a été
 * achevé il y a deux ans.
 */
export function permisAMontrer(
  autorisations: Autorisation[],
  parcelles: Set<string>,
  anneeCourante: number,
): PermisRetenu[] {
  return autorisations
    .filter((a) => a.parcelles.some((p) => parcelles.has(p)))
    .filter((a) => a.annee >= anneeCourante - ANCIENNETE_MAX_ANS)
    .flatMap((a) => {
      const etat = etatAutorisation(a);
      if (!etatMontrable(etat)) return [];
      return [{ annee: a.annee, etat }];
    })
    .sort((x, y) => y.annee - x.annee);
}

/**
 * LA LIMITE, toujours dite quand le bloc s'affiche, présence ou absence de permis.
 *
 * Trois réserves, et chacune a coûté une vérification : un permis autorisé peut n'être jamais
 * construit ; le jeu est mensuel, donc un dossier déposé le mois dernier n'y figure pas encore ;
 * et le périmètre est nommé, sans quoi l'absence se lirait « rien ne se construit », alors qu'elle
 * dit seulement « rien dans ces cinquante mètres ».
 *
 * ── POURQUOI UNE FONCTION, ET PAS UNE CONSTANTE ───────────────────────────────────────────────
 * Le rayon et la fenêtre sont GELÉS dans le snapshot avec les permis qu'ils ont sélectionnés. Une
 * constante bâtie sur `RAYON_PERMIS_M` décrirait tous les dossiers avec le rayon D'AUJOURD'HUI :
 * le jour où il change, les dossiers anciens continueraient d'afficher leurs permis à 50 m sous
 * une phrase annonçant le nouveau rayon. La phrase doit donc se construire à partir des valeurs
 * QUI ONT SERVI, que l'appelant lit dans le snapshot.
 */
export function limitePermis(
  rayonMeters: number = RAYON_PERMIS_M,
  ancienneteMaxAns: number = ANCIENNETE_MAX_ANS,
): string {
  return (
    `Le registre a été interrogé sur les parcelles situées à moins de ${rayonMeters} m de ` +
    `l'adresse, pour les dossiers déposés depuis moins de ${ancienneteMaxAns} ans. Une ` +
    `autorisation n'est pas un bâtiment : elle peut n'être jamais construite. Le registre ` +
    `national est mis à jour chaque mois, donc un dossier déposé récemment peut ne pas encore ` +
    `y figurer.`
  );
}
