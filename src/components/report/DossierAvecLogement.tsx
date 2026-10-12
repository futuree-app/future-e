// Augmentation Logement streamée (Server Component async). Suspense gère le "pending" (fallback) ;
// ce catch TYPÉ gère le "unavailable" (un bug d'adaptateur/règle/assembleur remonte). Faits communs
// reçus en prop (mêmes que le fallback, pas de reload).
//
// L'ASSEMBLAGE A QUITTÉ CE FICHIER le 05/08/2026, pour `server/assemble-address-dossier.ts` : le
// webhook Stripe doit produire le même dossier hors de toute page, et un pipeline qui n'existe que
// dans le corps d'un composant ne se rejoue pas. Ce composant ne fait plus que demander et rendre.
import { contexteAChangeMateriellement, type RelationAuLieu } from "@/lib/relation-au-lieu";
import { bucketDuProjet } from "@/lib/decision/logement-gestes";
import { assembleAddressDossier } from "@/lib/server/assemble-address-dossier";
import { readLatestArtifact } from "@/lib/server/decision-artifact-store";
import {
  dossierAServir, artefactPerimeParLeDpe, prochaineVersionAutomatique, voisinagePlusRecentQueLaVersion,
} from "@/lib/decision/decision-artifact";
import { projetAChangeMateriellement } from "@/lib/decision/projet-materiel";
import { generateDecisionArtifact } from "@/lib/server/generate-decision-artifact";
import { lireContexteDAchat } from "@/lib/server/contexte-achat";
import { contexteDeGeneration, operationDeGeneration } from "@/lib/contexte-livraison";
import { buildCommuneDossier } from "@/lib/decision/territory-facts";
import { dateFr } from "@/lib/decision/autour-permis";
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
import type { Face3Snapshot, PermisSnapshot } from "@/lib/logement-autour-types";
import type { ReactNode } from "react";

export async function DossierAvecLogement({
  project, address, savedDpe, selectionDpeChangeeLe, permis, snapshotAutour, relationAdresse, communeFacts, communeDossier, logementLink, insee,
  scopeKey, hard, userId, espacement, titre, supportingPane,
}: {
  project: UserProject;
  address: ResolvedAddress;
  savedDpe: DpeRecord | null;
  /**
   * QUAND LA SÉLECTION DE DIAGNOSTIC A CHANGÉ pour la dernière fois (`dpe_selection_at`), ou `null`
   * si elle n'a jamais bougé. C'est ce qui permet de savoir si l'artefact figé a pu voir l'état
   * courant : il est figé au webhook, où aucun choix n'existe encore.
   *
   * C'est la date du GESTE, et non `selected_dpe_at`, qui date le diagnostic figé et s'efface avec
   * lui : sinon, RETIRER un diagnostic mal désigné laisserait servir la conclusion écrite avec lui.
   * Voir `artefactPerimeParLeDpe`.
   */
  selectionDpeChangeeLe: string | null;
  /**
   * LE REGISTRE DES AUTORISATIONS, gelé à l'analyse. `null` veut dire NON CONSULTÉ (dossier
   * antérieur au 01/08/2026, ou API muette), et la règle rend alors `uncertain` : jamais une
   * absence d'autorisation qui n'a pas été établie.
   */
  permis: PermisSnapshot | null;
  /** Le voisinage gelé du dossier, projeté en faits par l'assemblage (cf. `autour-facts.ts`). */
  snapshotAutour: Face3Snapshot | null;
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
  /** Navigation secondaire rendue à droite du dossier sur desktop. */
  supportingPane?: ReactNode;
  /** FUT-26 : la relation déclarée à ce bien (`place_relation`). Absente = inconnue. */
  relationAdresse?: RelationAuLieu | null;
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
  const perime = artefactPerimeParLeDpe(stocke, selectionDpeChangeeLe);

  // ══════════════════════════════════════════════════════════════════════════════════════════
  // AVEC QUEL CONTEXTE ASSEMBLER ET FIGER (FUT-10, dernière revue).
  //
  // Ce rattrapage relisait le projet et la relation DU JOUR : une première génération échouée au
  // webhook, puis reprise ici après que le lecteur a modifié son projet, figeait comme version vendue
  // une lecture qu'il n'avait jamais payée. La règle vit dans `contexte-livraison.ts` :
  //   - aucune version prête → PREMIÈRE LIVRAISON : le contexte de l'ACHAT (intention verrouillée) ;
  //   - version périmée par un diagnostic → SUCCESSION : le contexte de la VERSION SERVIE ;
  //   - la mise à jour explicite, elle, passe par `/api/dossier/actualiser`, jamais par ici.
  // Un contexte d'achat INDISPONIBLE (intention introuvable, projet confirmé illisible, lecture en panne) :
  // on assemble avec le contexte du jour, à titre PROVISOIRE, en disant qu'on ne peut pas confirmer ce
  // qui a été acheté, et on ne fige RIEN. Le projet du jour ne remplace jamais une intention manquante.
  // ══════════════════════════════════════════════════════════════════════════════════════════
  const dossierId = scopeKey.replace(/^logement:/, "");
  const achat = await lireContexteDAchat(userId, dossierId)
    .catch(() => ({ contexte: { etat: "indisponible" as const, raison: "lecture_impossible" as const }, acheteLe: null }));
  const contexte = achat
    ? contexteDeGeneration({
        operation: operationDeGeneration({ versionPrete: Boolean(stocke?.artifact), demandeExplicite: false }),
        achat: achat.contexte,
        versionServie: stocke?.artifact
          ? { projet: stocke.artifact.projectSnapshot, contexteDuBien: stocke.artifact.contexteDuBien ?? null }
          : null,
        courant: { projet: project, relation: relationAdresse ?? null },
      })
    : null;
  const projetDeLecture = contexte?.genere ? contexte.projet : project;
  const relationDeLecture = contexte?.genere ? contexte.relation : (relationAdresse ?? null);

  // L'ASSEMBLAGE N'EST DEMANDÉ QUE S'IL SERVIRA. Un artefact prêt évite les huit lectures externes
  // et le moteur entier : c'est ce qui rend la relecture reproductible, et accessoirement immédiate.
  //
  // Le socle communal reçu de la page est construit avec le projet DU JOUR : quand la lecture suit un
  // autre projet (celui de l'achat, ou de la version servie), le socle est reconstruit avec lui, sans
  // quoi la lecture du bien mélangerait deux projets.
  const socle = projetDeLecture !== project && (!stocke?.artifact || perime)
    ? await buildCommuneDossier(insee, projetDeLecture, {
        hasAddress: true, citycode: address.citycode, relation: communeFacts.relationAuLieu ?? null,
      }).catch(() => null)
    : null;
  const assemble = stocke?.artifact && !perime
    ? null
    : await assembleAddressDossier({
        project: projetDeLecture, address, savedDpe,
        communeFacts: socle?.moduleFacts ?? communeFacts, communeDossier: socle?.dossier ?? communeDossier,
        hard: socle?.hard ?? hard, scopeKey, permis, snapshotAutour,
        relation: relationDeLecture,
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
  //
  // FUT-10 : on ne fige QUE si le contexte de la vente est établi (`contexte.genere`). Un achat sans
  // projet ne produit pas de version automatique, et une lecture impossible du contexte d'achat non
  // plus : figer avec le contexte du jour serait substituer un projet à celui qui a été payé.
  const version = prochaineVersionAutomatique(stocke, new Date());
  if ((!stocke?.artifact || perime) && version !== null && assemble?.status === "done" && contexte?.genere) {
    const projetAFiger = contexte.projet;
    // La relation de l'achat ou de la version servie est IMPOSÉE ; celle du jour reste lue sur la ligne.
    const relationImposee = contexte.source === "courant" ? undefined : contexte.relation;
    after(async () => {
      const r = await generateDecisionArtifact(sb, userId, projetAFiger, {
        kind: "adresse", insee, dossierId, address, savedDpe, relationImposee,
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
  // CE QUE L'ÉCRAN DOIT DIRE DE LA LECTURE QU'IL SERT, quand ce n'est pas une version figée ordinaire.
  //   - lecture PROVISOIRE : aucune version n'est encore figée ; elle suit le contexte de l'achat (ou,
  //     faute de pouvoir le lire, celui du jour), et elle n'est pas datée ;
  //   - lecture DEMANDÉE APRÈS UN ACHAT SANS PROJET : la version servie a été produite à la demande du
  //     lecteur, après coup ; l'historique le dit, pour ne pas la faire passer pour celle de l'achat.
  //   - lecture INCERTAINE : le contexte de l'achat est indisponible. Rien n'est promis sur la version à
  //     venir : on ne sait pas, à cet instant, avec quelles informations elle pourra être établie ;
  const avis = servi.source === "assemblage" && achat.contexte.etat === "confirme"
    ? "Lecture provisoire, établie avec le projet et les réponses confirmés à votre achat. Sa version datée n'a pas encore pu être figée ; elle le sera avec ces mêmes informations."
    : servi.source === "assemblage" && achat.contexte.etat === "indisponible"
      ? "La version de votre dossier n'a pas encore pu être établie, et nous ne pouvons pas confirmer pour l'instant les informations retenues lors de votre achat. La lecture affichée est provisoire : elle ne remplace pas votre analyse achetée."
    : servi.source === "artefact" && achat.contexte.etat === "absent"
      ? `Ce bien a été acheté sans projet${achat.acheteLe && dateFr(achat.acheteLe) ? `, le ${dateFr(achat.acheteLe)}` : ""}. Cette lecture personnalisée a été demandée ensuite, avec votre projet.`
      : null;

  return (
    <>
      {avis ? (
        <p className={`${espacement ?? "mt-14"} text-[13px] leading-relaxed text-muted glass rounded-xl px-4 py-3`}>{avis}</p>
      ) : null}
      <DossierDecisionSection
        dossier={vue.dossier} logement={logementLink} logementStatus={vue.status}
        insee={insee} scopeKey={vue.scope} generatedAt={servi.generatedAt} espacement={avis ? "mt-4" : espacement} titre={titre}
        supportingPane={supportingPane}
        projetAChange={projetAChangeMateriellement(stocke?.artifact?.projectSnapshot ?? null, project)}
        // FUT-10 : le lien déclaré avec ce bien a changé depuis la version SERVIE. Comparé avec
        // l'intention du projet figé dans cette version : c'est elle qui a produit la voix affichée.
        // Une version antérieure à FUT-10 ne porte pas de contexte, et on se tait.
        contexteAChange={servi.source === "artefact" && contexteAChangeMateriellement(
          stocke?.artifact?.contexteDuBien ?? null,
          relationAdresse ?? null,
          stocke?.artifact?.projectSnapshot?.intent ?? null,
          bucketDuProjet,
        )}
        // UN VOISINAGE RAFRAÎCHI APRÈS LA VERSION SERVIE : la décision peut être mise à jour, jamais
        // réécrite seule. Seulement quand on sert une version FIGÉE : un assemblage vivant utilise
        // déjà le voisinage courant.
        voisinageAChange={servi.source === "artefact"
          && voisinagePlusRecentQueLaVersion(servi.generatedAt, snapshotAutour?.computedAt)}
        // LA PROVENANCE N'EXISTE QUE S'IL Y A UNE VERSION FIGÉE. Sur un dossier assemblé à
        // l'instant, un lien qui désignerait un artefact enverrait la surface d'arrivée chercher
        // une preuve qui n'a jamais été vendue.
        provenance={servi.source === "artefact" ? scopeKey : undefined}
        // La liste complète des contrôles est rendue par le MÊME dossier que la minute : une liste
        // construite ailleurs, sur le dossier communal, contredirait le compte que le verdict vient
        // d'annoncer. Elle passe par la section (FUT-92), qui la pose juste après elle.
        controles={(
          <ControlesDuDossier
            dossier={vue.dossier}
            provenance={servi.source === "artefact" ? scopeKey : undefined}
          />
        )}
      />
    </>
  );
}
