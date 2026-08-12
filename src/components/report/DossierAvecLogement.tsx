// Augmentation Logement streamée (Server Component async). Suspense gère le "pending" (fallback) ;
// ce catch TYPÉ gère le "unavailable" (un bug d'adaptateur/règle/assembleur remonte). Faits communs
// reçus en prop (mêmes que le fallback, pas de reload).
//
// L'ASSEMBLAGE A QUITTÉ CE FICHIER le 05/08/2026, pour `server/assemble-address-dossier.ts` : le
// webhook Stripe doit produire le même dossier hors de toute page, et un pipeline qui n'existe que
// dans le corps d'un composant ne se rejoue pas. Ce composant ne fait plus que demander et rendre.
import { assembleAddressDossier } from "@/lib/server/assemble-address-dossier";
import { readLatestArtifact } from "@/lib/server/decision-artifact-store";
import {
  dossierAServir, artefactPerimeParLeDpe, prochaineVersionAutomatique,
} from "@/lib/decision/decision-artifact";
import { projetAChangeMateriellement } from "@/lib/decision/projet-materiel";
import { generateDecisionArtifact } from "@/lib/server/generate-decision-artifact";
import { after } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ResolvedAddress } from "@/lib/server/logement-decision-data";
import { DossierDecisionSection } from "@/components/report/DossierDecisionSection";
import type { NiveauTitre } from "@/components/report/ConclusionBlock";
import { ControlesDuDossier } from "@/components/report/ControlesDuDossier";
import type { Dossier, ModuleFacts } from "@/lib/decision/decision-fact";
import type { EvaluationContext } from "@/lib/hard-constraints";
import type { DpeRecord } from "@/lib/dpe";
import type { UserProject } from "@/lib/user-project";
import type { PermisSnapshot } from "@/lib/logement-autour-types";

export async function DossierAvecLogement({
  project, address, savedDpe, dpeChoisiLe, permis, communeFacts, communeDossier, logementLink, insee,
  scopeKey, hard, userId, espacement, titre,
}: {
  project: UserProject;
  address: ResolvedAddress;
  savedDpe: DpeRecord | null;
  /**
   * QUAND le diagnostic a été choisi (`selected_dpe_at`), ou `null` si aucun ne l'a été. C'est ce
   * qui permet de savoir si l'artefact figé a pu le voir : il est figé au webhook, où le choix
   * n'existe pas encore. Voir `artefactPerimeParLeDpe`.
   */
  dpeChoisiLe: string | null;
  /**
   * LE REGISTRE DES AUTORISATIONS, gelé à l'analyse. `null` veut dire NON CONSULTÉ (dossier
   * antérieur au 01/08/2026, ou API muette), et la règle rend alors `uncertain` : jamais une
   * absence d'autorisation qui n'a pas été établie.
   */
  permis: PermisSnapshot | null;
  communeFacts: ModuleFacts;
  communeDossier: Dossier;
  logementLink: { href: string; label: string } | null;
  // Slice 2 : identité de l'artefact narratif de CE dossier (augmenté de l'adresse).
  insee: string;
  scopeKey: string;
  // Les contraintes dures déjà hydratées au grain de la commune (références résolues une seule fois,
  // au-dessus des deux moteurs). On n'en change que le POINT.
  hard: EvaluationContext;
  /** Le compte qui lit, pour retrouver son artefact. */
  userId: string;
  /**
   * L'air au-dessus de la section, transmis tel quel. LE CHEMIN ADRESSE DOIT LE RECEVOIR AUSSI :
   * sans lui, le repli communal se poserait contre l'en-tête et le dossier d'adresse, servi quelques
   * instants plus tard, sauterait de 56 px au moment où le streaming se résout.
   */
  espacement?: string;
  /**
   * Le niveau du titre du verdict, transmis tel quel. LE CHEMIN ADRESSE DOIT LE RECEVOIR AUSSI :
   * sans lui, le repli communal s'afficherait en grand titre de page, puis le verdict d'adresse,
   * celui qui a été payé, reviendrait en petit au moment où le streaming se résout.
   */
  titre?: NiveauTitre;
}) {
  // L'ARTEFACT PASSE AVANT L'ASSEMBLAGE (05/08/2026).
  // ══════════════════════════════════════════════════════════════════════════════════════════
  // Ce qui a été vendu est la lecture du jour de l'achat, pas celle du moteur d'aujourd'hui. Quand
  // l'artefact existe, on ne rejoue RIEN : ni les huit lectures externes, ni les règles. C'est ce
  // qui rend la relecture reproductible, et accessoirement instantanée.
  //
  // Son absence n'est pas une panne : les dossiers achetés avant ce lot n'en ont pas, et une
  // génération peut avoir échoué. On assemble alors comme avant, et la date ne s'affiche pas,
  // puisqu'une lecture recalculée à l'instant n'a pas d'âge.
  const sb = await createClient();
  const stocke = await readLatestArtifact(sb, userId, insee, scopeKey).catch(() => null);

  // LA SEULE PIÈCE QUI PÉRIME UNE VERSION VENDUE : le diagnostic, parce qu'il arrive APRÈS elle.
  // L'artefact est figé au webhook, quand le client n'a pas encore pu le choisir. Sans cette
  // vérification, la carte de l'étiquette énergétique n'entrait dans AUCUN dossier vendu.
  const perime = artefactPerimeParLeDpe(stocke, dpeChoisiLe);

  // L'ASSEMBLAGE N'EST DEMANDÉ QUE S'IL SERVIRA. Un artefact prêt évite les huit lectures externes
  // et le moteur entier : c'est ce qui rend la relecture reproductible, et accessoirement immédiate.
  const assemble = stocke?.artifact && !perime
    ? null
    : await assembleAddressDossier({
        project, address, savedDpe, communeFacts, communeDossier, hard, scopeKey, permis,
      });
  // LE RATTRAPAGE, comme pour le territoire : un dossier d'adresse acheté avant ce lot n'aurait
  // jamais d'artefact. Il n'est tenté que si l'assemblage a ABOUTI : figer un repli communal comme
  // la version vendue d'un dossier d'adresse priverait l'acheteur de ce qu'il a payé, sous une page
  // d'apparence normale. C'est la même règle qu'au webhook, et elle vaut ici pour la même raison.
  //
  // UN ARTEFACT PÉRIMÉ N'EST PAS RÉÉCRIT, IL EST SUCCÉDÉ : on réserve la version SUIVANTE, et celle
  // sur laquelle le lecteur a pu décider reste en base, lisible. C'est la promesse écrite dans la
  // migration 28 le premier jour, tenue ici pour la première fois.
  //
  // LE NUMÉRO RÉSERVÉ EST CELUI D'APRÈS LA DERNIÈRE TENTATIVE, pas celui d'après la version SERVIE
  // (revue du 12/08/2026). Le calcul partait de la version servie : avec une v2 déjà en base (ratée,
  // ou écrite par un autre onglet), il redemandait indéfiniment la place v2, que la contrainte
  // unique refusait, et le diagnostic déposé par le lecteur n'entrait JAMAIS dans la décision.
  // `prochaineVersionAutomatique` rend `null` quand une génération est en cours, et quand trop de
  // tentatives se sont déjà empilées : ce rattrapage part à CHAQUE ouverture de page, et une panne
  // durable créerait sinon une version morte par rechargement.
  //
  // LA CONDITION PORTE SUR L'ABSENCE DE VERSION *SERVIE*, pas sur l'absence de LIGNE (revue du
  // 12/08/2026). Écrite `!stocke`, elle laissait un dossier d'adresse dont la toute première
  // génération avait échoué sans aucun rattrapage : la ligne existait, donc `stocke` n'était pas
  // nul, et `perime` ne pouvait pas l'être non plus faute d'artefact à périmer. Le dossier vendu se
  // réassemblait alors à chaque ouverture, sans jamais être figé. Le chemin Territoire, lui, testait
  // déjà l'artefact.
  const version = prochaineVersionAutomatique(stocke, new Date());
  if ((!stocke?.artifact || perime) && version !== null && assemble?.status === "done") {
    after(async () => {
      const r = await generateDecisionArtifact(sb, userId, project, {
        kind: "adresse", insee, dossierId: scopeKey.replace(/^logement:/, ""), address, savedDpe,
      }, version);
      if (r.status === "failed") console.error("[artefact] rattrapage adresse échoué", { insee, version, r });
    });
  }

  // Un artefact périmé ne s'affiche pas en attendant son successeur : il dirait le logement SANS son
  // diagnostic, alors que le module Logement, juste à côté, l'affiche. On sert l'assemblage vivant
  // le temps que la version suivante s'écrive, comme pour un dossier qui n'en a pas encore.
  const servi = dossierAServir(perime ? null : stocke, assemble?.dossier ?? communeDossier);
  const vue = {
    dossier: servi.dossier,
    status: servi.source === "artefact" ? ("done" as const) : (assemble?.status ?? "unavailable"),
    scope: servi.source === "artefact" ? scopeKey : (assemble?.scope ?? "commune"),
  };

  // LE RENDU EST HORS DE TOUT `try`, et ce n'est pas une préférence de style : React ne rend pas un
  // composant au moment où son JSX est construit, donc une erreur de rendu ne serait PAS attrapée
  // par un catch posé ici, qui promettrait pourtant de la traiter. Le rattrapage vit dans
  // `assembleAddressDossier` et ne couvre que ce qu'il peut vraiment couvrir : le chargement et
  // l'assemblage.
  return (
    <>
      <DossierDecisionSection
        dossier={vue.dossier} logement={logementLink} logementStatus={vue.status}
        insee={insee} scopeKey={vue.scope} generatedAt={servi.generatedAt} espacement={espacement} titre={titre}
        projetAChange={projetAChangeMateriellement(stocke?.artifact?.projectSnapshot ?? null, project)}
        // LA PROVENANCE N'EXISTE QUE S'IL Y A UNE VERSION FIGÉE. Sur un dossier assemblé à
        // l'instant, un lien qui désignerait un artefact enverrait la surface d'arrivée chercher
        // une preuve qui n'a jamais été vendue.
        provenance={servi.source === "artefact" ? scopeKey : undefined}
      />
      {/* La liste complète des contrôles est rendue par le MÊME dossier que la minute : une liste
          construite ailleurs, sur le dossier communal, contredirait le compte que le verdict vient
          d'annoncer. */}
      <ControlesDuDossier
        dossier={vue.dossier}
        provenance={servi.source === "artefact" ? scopeKey : undefined}
      />
    </>
  );
}
