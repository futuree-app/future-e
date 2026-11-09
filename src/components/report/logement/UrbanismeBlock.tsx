import React from "react";
import {
  AUTRE_PRESCRIPTION, CATEGORIES, NOTE_NEUTRE, PART_MIN, SURFACE_MIN_M2, TYPE_DOCUMENT, TYPE_SECTEUR, TYPE_ZONE,
} from "@/lib/urbanisme-nomenclature";
// Types seulement : l'écran n'embarque pas le calcul géométrique (cf. `urbanisme-nomenclature.ts`).
import type { DocumentUrbanisme, PrescriptionParcelle, UrbanismeParcelle, ZoneParcelle } from "@/lib/urbanisme-parcelle";
import { dateLongue } from "@/lib/data/gaspar-pprn-inondation";
import { bindOrphans } from "@/lib/typography";
import { Disclosure } from "./kit";
import {
  EFFET_NEUTRE, LIBELLES_SIMPLES, MOTIF_AU_PREMIER_NIVEAU, SECTEUR_SIMPLE, ZONE_SIMPLE,
} from "./urbanisme-libelles";

// Plan d'urbanisme de la parcelle (FUT-81), sous-bloc du statut réglementaire. Il dit CE QUI EST PUBLIÉ
// (document, zone, prescriptions, règlement) et CE QU'IL FAUT VÉRIFIER, jamais ce qui serait autorisé :
// un zonage ne vaut ni droit à construire ni certificat d'urbanisme.
//
// FUT-144 (08/11/2026) : trois niveaux de lecture, comme le reste du module Logement.
//  1. Ce qu'il faut retenir : une phrase, le type de zone en mots courants (« zone urbaine »).
//  2. À vérifier : une ligne par prescription (étiquette courte, étendue, une phrase d'effet), les limites
//     de la lecture, puis le lien vers le règlement de la zone.
//  3. Détails et sources (dépliable) : codes de zone, parts, intitulés nationaux et du producteur, notes
//     complètes, dates, provenance et méthode. Rien n'est supprimé, tout ce qui était dit l'est encore.
//
// Revue du 27/10/2026, conservée : une réserve qui conditionne toute la lecture (parcelle peut-être
// voisine, vigueur du document non vérifiée) se lit AVANT ce qu'elle conditionne, jamais dans le repli.

const EYEBROW: React.CSSProperties = { fontSize: 12.5, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--fg-4)", margin: "0 0 8px" };
const TITRE: React.CSSProperties = { fontSize: 15, fontWeight: 500, color: "var(--fg-hi)", lineHeight: 1.5, margin: 0 };
const CORPS: React.CSSProperties = { fontSize: 14, color: "var(--fg-2)", lineHeight: 1.6, margin: 0 };
const DETAIL: React.CSSProperties = { fontSize: 13.5, color: "var(--fg-3)", lineHeight: 1.55, margin: 0 };
const SOURCE: React.CSSProperties = { fontSize: 12.5, color: "var(--fg-4)", lineHeight: 1.55, margin: 0 };
const LIEN: React.CSSProperties = { fontSize: 13, color: "var(--accent-dim, #7a6e60)", textDecoration: "underline" };
// Une réserve qui conditionne la lecture : même registre que le corps, marquée par un filet ambre.
const RESERVE: React.CSSProperties = { ...CORPS, color: "var(--fg-hi)", paddingLeft: 12, borderLeft: "2px solid var(--yellow, #b8a042)" };
const LISTE: React.CSSProperties = { listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 12 };

// Espaces insécables : « 39 m² » et « 53 % » ne se coupent jamais en fin de ligne (AGENTS.md).
const NBSP = " ";
const m2 = (v: number) => `${Math.max(1, Math.round(v)).toLocaleString("fr-FR")}${NBSP}m²`;
const pct = (part: number) => `${Math.round(part * 100)}${NBSP}%`;
/** « toute la parcelle », « environ 13 % de la parcelle (≈ 490 m²) », ou en m² seuls sous 1 %. */
function etendueSurface(part: number, surfaceM2: number | null): string {
  if (part >= 0.995) return "toute la parcelle";
  if (part < 0.01 && surfaceM2 != null) return `environ ${m2(surfaceM2)} de la parcelle`;
  return `environ ${pct(part)} de la parcelle${surfaceM2 != null ? ` (≈${NBSP}${m2(surfaceM2)})` : ""}`;
}
/** La part d'une zone, pour le détail. */
function partBreve(part: number): string {
  return part >= 0.995 ? "toute la parcelle" : part < 0.01 ? `moins de 1${NBSP}%` : `environ ${pct(part)}`;
}
/** Des guillemets qui ne se séparent jamais de leur texte en fin de ligne. */
const cite = (s: string) => `«${NBSP}${s}${NBSP}»`;
const partDetail = (part: number) => (part >= 0.995 ? "toute la parcelle" : `${partBreve(part)} de la parcelle`);
const majuscule = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const echapper = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * « UE - correspondant aux secteurs… » -> « Correspondant aux secteurs… » : le libellé long répète souvent
 * le code, parfois sous une forme plus longue (« UILO1O1O1O1OO : » pour la zone UILO1O1O1O1O, à Sucy).
 */
function libelleLong(z: ZoneParcelle): string | null {
  const l = z.libelong?.replace(new RegExp(`^${echapper(z.libelle)}\\S*\\s*[-:–]\\s*`, "i"), "").trim();
  return l ? majuscule(l) : null;
}

function nomDocument(d: DocumentUrbanisme | undefined): string {
  if (!d) return "document d'urbanisme";
  const long = TYPE_DOCUMENT[d.type];
  return long ? `${long} (${d.type})` : d.type;
}

/** « du plan local d'urbanisme » / « de la carte communale » : l'article suit le genre du document. */
function duDocument(d: DocumentUrbanisme | undefined): string {
  return d?.type === "CC" ? "de la carte communale" : `du ${nomDocument(d)}`;
}

/** Les zones en mots courants : « zone urbaine », « 2 zones urbaines », « une zone urbaine et une zone agricole ». */
function naturesZones(zones: ZoneParcelle[]): string | null {
  if (zones.some((z) => !z.typezone || !ZONE_SIMPLE[z.typezone])) return null;
  const parType = new Map<string, number>();
  for (const z of zones) parType.set(z.typezone!, (parType.get(z.typezone!) ?? 0) + 1);
  if (zones.length === 1) return ZONE_SIMPLE[zones[0].typezone!].un;
  if (parType.size === 1) return `${zones.length} ${ZONE_SIMPLE[zones[0].typezone!].des}`;
  const parts = [...parType].map(([t, n]) => (n === 1 ? `une ${ZONE_SIMPLE[t].un}` : `${n} ${ZONE_SIMPLE[t].des}`));
  return `${parts.slice(0, -1).join(", ")} et ${parts[parts.length - 1]}`;
}

function etendue(p: PrescriptionParcelle, auPoint: boolean): string | null {
  if (p.etendue === "incertaine") return auPoint ? "position par rapport à l’adresse non vérifiable" : "position par rapport à la parcelle non vérifiable";
  // Au point de l'adresse, il n'y a ni part ni longueur : la prescription contient le point, c'est tout.
  if (auPoint) return p.forme === "surface" ? "à l’adresse" : p.forme === "ligne" ? "passe à l’adresse" : "situé à l’adresse";
  if (p.etendue === "marginale") {
    return p.forme === "ligne"
      ? "effleure la parcelle"
      : `recoupe la parcelle sur une très faible surface${p.surfaceM2 == null ? "" : p.surfaceM2 < 1 ? ` (moins d’1${NBSP}m²)` : ` (≈${NBSP}${m2(p.surfaceM2)})`}`;
  }
  if (p.forme === "ligne") return p.longueurM != null ? `traverse la parcelle sur environ ${Math.max(1, Math.round(p.longueurM))} m` : "traverse la parcelle";
  if (p.forme === "point") return "situé sur la parcelle";
  return p.part == null ? null : `sur ${etendueSurface(p.part, p.surfaceM2)}`;
}

/** Pourquoi une prescription non confirmée reste à vérifier. Le détail ; le premier niveau dit seulement « à vérifier ». */
function raisonIncertitude(p: PrescriptionParcelle, sansPreuve: boolean): string | null {
  if (p.etendue === "couvre") return null;
  return p.etendue === "marginale"
    ? "Un recouvrement aussi faible peut venir d’un écart de tracé entre le plan et le cadastre : vérifiez sur le plan de zonage si elle concerne bien ce terrain."
    : sansPreuve
      ? "Sa position par rapport à l’adresse n’a pas pu être établie : vérifiez sur le plan de zonage si elle concerne ce terrain."
      : "Sa géométrie publiée n’a pas pu être lue : vérifiez sur le plan de zonage si elle concerne ce terrain.";
}

/** L'intitulé du producteur, s'il dit autre chose que l'intitulé national ou que le code. */
function intituleProducteur(p: PrescriptionParcelle): string | null {
  const l = p.libelle.trim();
  const titre = CATEGORIES[p.categorie]?.titre;
  if (!l || (titre && l.toLowerCase() === titre.toLowerCase())) return null;
  if (new RegExp(`^Prescription ${echapper(p.code)}-${echapper(p.sousCode)}$`).test(l)) return null;
  return l;
}

/** L'étiquette et l'effet d'une prescription au premier niveau. */
function libelleSimple(p: PrescriptionParcelle): { court: string; effet: string } {
  const simple = LIBELLES_SIMPLES[p.categorie];
  const producteur = intituleProducteur(p);
  // Sous-code non reconnu : nommée par l'intitulé de son producteur, sans effet énoncé.
  if (!simple) return { court: producteur ? `Règle du plan : ${cite(producteur)}` : "Règle cartographiée par le plan", effet: EFFET_NEUTRE };
  const motif = producteur && MOTIF_AU_PREMIER_NIVEAU.has(p.categorie) ? ` Intitulé du plan : ${cite(producteur)}.` : "";
  return { court: simple.court, effet: simple.effet + motif };
}

/**
 * NIVEAU 2 : une ligne par NATURE de prescription (étiquette, étendues), puis ce que ça change. Deux
 * prescriptions de même nature et de même certitude (à Sucy, une zone humide et un cours d'eau, tous deux
 * « préservés pour l'écologie ») partagent une ligne : chaque étendue reste dite, l'effet n'est pas répété.
 */
function Prescription({ ps, auPoint, sansPreuve: sp }: { ps: PrescriptionParcelle[]; auPoint: boolean; sansPreuve: boolean }) {
  const { court, effet } = libelleSimple(ps[0]);
  const etendues = [...new Set(ps.map((p) => etendue(p, auPoint)).filter((e): e is string => !!e))];
  // Une prescription non confirmée le dit dans son étendue ; l'action suit. Sans preuve, la réserve de
  // tête dit déjà qu'aucune n'est située : la répéter à chaque ligne n'apprendrait rien.
  const aVerifier = ps[0].etendue === "couvre" || sp ? "" : " À vérifier sur le plan de zonage.";
  return (
    <li style={{ display: "grid", gap: 2 }}>
      <p style={{ fontSize: 14, fontWeight: 500, color: "var(--fg-hi)", lineHeight: 1.5, margin: 0 }}>
        {court}{etendues.length > 0 ? <span style={{ fontWeight: 400, color: "var(--fg-3)" }}> · {etendues.join(" ; ")}</span> : null}
      </p>
      <p style={DETAIL}>{bindOrphans(`${effet}${aVerifier}`)}</p>
    </li>
  );
}

/** Les familles citées sans être nommées (le code 99 se compte, il ne se nomme pas). */
const famillesNommees = (u: UrbanismeParcelle) => u.autresPrescriptions.filter((f) => f !== AUTRE_PRESCRIPTION);

/**
 * NIVEAU 2, LES PRESCRIPTIONS : chacune nommée, puis les autres familles citées. Une panne de lecture est
 * dite en réserve, en tête : elle conditionne tout ce qui suit.
 */
function itemsPrescriptions(u: UrbanismeParcelle, surLaParcelle: string): React.ReactNode[] {
  const items: React.ReactNode[] = [];
  if (u.prescriptionsStatut === "indisponible") {
    items.push(<li key="indispo"><p style={RESERVE}>{bindOrphans("Les prescriptions cartographiées n’ont pas pu être toutes lues : consultez le plan de zonage et le règlement.")}</p></li>);
  }
  const groupes = new Map<string, PrescriptionParcelle[]>();
  for (const p of u.prescriptions) {
    const { court, effet } = libelleSimple(p);
    const cle = `${court}|${effet}|${p.etendue === "couvre"}`;
    groupes.set(cle, [...(groupes.get(cle) ?? []), p]);
  }
  [...groupes.values()].forEach((ps, i) => items.push(<Prescription key={`p${i}`} ps={ps} auPoint={u.grain === "point"} sansPreuve={sansPreuve(u)} />));
  if (u.prescriptionsStatut !== "indisponible" && u.autresPrescriptions.length > 0) {
    const nommees = famillesNommees(u);
    items.push(
      <li key="autres"><p style={DETAIL}>
        {bindOrphans(`${u.prescriptions.length > 0 ? "D’autres règles" : "Des règles"} s’appliquent aussi ${surLaParcelle}${nommees.length > 0 ? ` (${nommees.slice(0, 4).join(", ")}${nommees.length > 4 ? "…" : ""})` : ""} : elles se lisent dans le règlement.`)}
      </p></li>,
    );
  }
  return items;
}

/** La liste « À vérifier », avec son intitulé. Rien ne s'affiche si elle est vide. */
function AVerifier({ titre, items }: { titre: string; items: React.ReactNode[] }) {
  if (items.length === 0) return null;
  return (
    <div style={{ display: "grid", gap: 10 }}>
      <p style={{ ...EYEBROW, margin: 0 }}>{titre}</p>
      <ul style={LISTE}>{items}</ul>
    </div>
  );
}

/** Un règlement, et les zones qu'il régit (plusieurs zones renvoient souvent au même fichier). */
function LienReglement({ zones }: { zones: ZoneParcelle[] }) {
  const r = zones[0].reglement;
  const cible = zones.length === 1 ? `de la zone ${zones[0].libelle}` : `des zones ${zones.map((z) => z.libelle).join(", ")}`;
  if (r.statut === "publie") {
    return (
      <a href={r.url} target="_blank" rel="noopener noreferrer" style={LIEN}>
        Lire le règlement {cible}{r.source === "gpu" ? " (PDF)" : " (site de la collectivité)"} →
      </a>
    );
  }
  return (
    <p style={DETAIL}>
      {r.statut === "non_publie"
        ? bindOrphans(`Le règlement ${cible} n’est pas publié avec le document au Géoportail : demandez-le au service urbanisme de la mairie.`)
        : bindOrphans(`Le lien vers le règlement ${cible} n’a pas pu être vérifié lors de la collecte.`)}
    </p>
  );
}

/** La source au premier niveau : une ligne, et le lien vers le document officiel. */
function Source({ documents }: { documents: DocumentUrbanisme[] }) {
  return (
    <>
      {documents.map((d) => {
        const appro = dateLongue(d.approbation);
        return (
          <p key={d.id} style={SOURCE}>
            D’après le Géoportail de l’urbanisme{appro ? ` (dernière évolution approuvée le ${appro})` : ""}.{" "}
            <a href={d.url} target="_blank" rel="noopener noreferrer" style={{ color: "inherit", textDecoration: "underline" }}>Voir le document</a>
          </p>
        );
      })}
    </>
  );
}

/**
 * LA RÉSERVE DE VIGUEUR, VISIBLE. Hors vigueur : le GPU l'a dit. Non vérifiée : il ne l'a pas dit (détail
 * muet, statut incomplet, annulation partielle). Dans les deux cas, la mairie confirme la version applicable.
 */
function ReserveVigueur({ documents }: { documents: DocumentUrbanisme[] }) {
  const hors = documents.filter((d) => d.vigueur === "hors_vigueur");
  const nonVerifies = documents.filter((d) => d.vigueur === "non_verifiee");
  if (hors.length === 0 && nonVerifies.length === 0) return null;
  const partiel = nonVerifies.some((d) => d.statutJuridique === "PARTIALLY_ANNULLED");
  return (
    <p style={RESERVE}>
      {bindOrphans(hors.length > 0
        ? "Le Géoportail ne donne pas ce document comme en vigueur : faites confirmer en mairie la version qui s’applique avant de vous y fier."
        : partiel
          ? "Le Géoportail signale ce document comme partiellement annulé : faites confirmer en mairie les règles qui s’appliquent à ce terrain."
          : "Le statut de ce document, en vigueur ou non, n’a pas pu être vérifié : faites confirmer en mairie la version qui s’applique avant de vous y fier.")}
    </p>
  );
}

/** Une réponse demandée sur une parcelle qu'on ne sait pas mesurer : rien n'a pu être situé (troisième revue). */
const sansPreuve = (u: UrbanismeParcelle) => u.interrogation === "parcelle" && u.grain === "point";

const VERIFIER_REFERENCE = "Vérifiez la référence cadastrale sur l’acte ou le compromis.";

/** LA RÉSERVE DE RATTACHEMENT, VISIBLE AVANT TOUT LE RESTE : les règles lues sont peut-être celles du voisin. */
function ReserveParcelle({ u, parcelCode }: { u: UrbanismeParcelle; parcelCode: string | null }) {
  const ref = parcelCode ? ` (${parcelCode})` : "";
  const d = u.rattachement.distanceM;
  const distance = d == null ? "" : d < 1 ? ", à moins d’un mètre," : `, à environ ${Math.round(d)} m,`;
  // Troisième revue : une parcelle qu'on ne sait pas mesurer ne fait pas disparaître le rattachement.
  if (u.ambiguites.includes("parcelle_non_mesurable")) {
    const quelle = u.rattachement.mode === "repli"
      ? `L’adresse ne tombe dans aucune parcelle, et le tracé de la plus proche${ref}${distance} n’a pas pu être mesuré.`
      : u.rattachement.mode === "limite"
        ? `L’adresse est sur la limite entre plusieurs parcelles, et le tracé de celle retenue${ref} n’a pas pu être mesuré.`
        : `Le tracé cadastral de la parcelle${ref} n’a pas pu être mesuré.`;
    const suite = u.interrogation === "parcelle"
      ? " Les zones et prescriptions trouvées autour n’ont donc pas pu être situées : aucune n’est retenue. Demandez en mairie celles qui s’appliquent à ce terrain."
      : ` La lecture porte donc sur le point de l’adresse seul : une autre zone ou prescription peut toucher une partie du terrain. ${VERIFIER_REFERENCE.slice(0, -1)}, et le plan de zonage.`;
    return <p style={RESERVE}>{bindOrphans(quelle + suite)}</p>;
  }
  if (u.rattachement.mode === "repli") {
    return (
      <p style={RESERVE}>
        {bindOrphans(`L’adresse ne tombe dans aucune parcelle : la lecture porte sur la plus proche${ref}${distance} qui peut être celle d’un voisin. Tout ce qui suit en dépend. ${VERIFIER_REFERENCE}`)}
      </p>
    );
  }
  if (u.rattachement.mode === "limite") {
    return (
      <p style={RESERVE}>
        {bindOrphans(`L’adresse est sur la limite entre plusieurs parcelles : la lecture porte sur l’une d’elles${ref}, peut-être pas celle du logement. ${VERIFIER_REFERENCE}`)}
      </p>
    );
  }
  return null;
}

/** La limite du zonage, et à qui le demander. Toujours dite quand une zone est lue. */
function limiteDuZonage(n: number): string {
  return `Ce zonage ne dit pas, à lui seul, ce qui est autorisé. Avant d’agrandir, d’ajouter une annexe, de surélever ou de changer l’usage, lisez le règlement ${n === 1 ? "de la zone" : "de ces zones"} et faites confirmer le projet par le service urbanisme de la mairie.`;
}

// ── NIVEAU 3 : les détails et les sources ─────────────────────────────────────────────────────

function DetailDocuments({ documents }: { documents: DocumentUrbanisme[] }) {
  return (
    <>
      {documents.map((d) => {
        const appro = dateLongue(d.approbation);
        const pub = dateLongue(d.publication);
        return (
          <div key={d.id}>
            Document : {d.titre ?? nomDocument(d)}
            {appro ? `, dernière évolution approuvée le ${appro}` : ""}
            {pub ? `, publiée au Géoportail de l’urbanisme le ${pub}` : ""}.{" "}
            <a href={d.url} target="_blank" rel="noopener noreferrer" style={{ color: "inherit", textDecoration: "underline" }}>Voir le document</a>
          </div>
        );
      })}
    </>
  );
}

function DetailPrescription({ p, auPoint, sansPreuve: sp }: { p: PrescriptionParcelle; auPoint: boolean; sansPreuve: boolean }) {
  const c = CATEGORIES[p.categorie];
  const titre = c?.titre ?? "Prescription dont le sous-code n’est pas reconnu pour ce document";
  const e = etendue(p, auPoint);
  const producteur = intituleProducteur(p);
  const raison = raisonIncertitude(p, sp);
  return (
    <div>
      {titre} (code national {p.code}-{p.sousCode}){e ? ` · ${e}` : ""}.
      {producteur ? ` Intitulé du plan : « ${producteur} ».` : ""} {c?.note ?? NOTE_NEUTRE}{raison ? ` ${raison}` : ""}
    </div>
  );
}

function Details({ u, parcelCode, children }: { u: UrbanismeParcelle; parcelCode: string | null; children?: React.ReactNode }) {
  const n = u.prescriptionsContact;
  const contacts = u.zonesEnLimite.filter((z) => z.surfaceM2 < SURFACE_MIN_M2);
  const nommees = famillesNommees(u);
  return (
    <Disclosure summary="Détails et sources">
      {u.documents.length > 0 && <DetailDocuments documents={u.documents} />}
      {children}
      {u.prescriptions.map((p, i) => <DetailPrescription key={i} p={p} auPoint={u.grain === "point"} sansPreuve={sansPreuve(u)} />)}
      {nommees.length > 4 && <div>Autres familles de prescriptions citées par le plan : {nommees.join(", ")}.</div>}
      {u.zones.length > 0 && (
        <div>Avant un projet, lisez aussi les dispositions générales du règlement. Un certificat d’urbanisme opérationnel peut être demandé en mairie pour un projet précis.</div>
      )}
      <div>
        {u.grain === "parcelle"
          ? `Grain : parcelle cadastrale${parcelCode ? ` ${parcelCode}` : ""} rattachée à l’adresse. Une adresse peut couvrir plusieurs parcelles (jardin, dépendance) : cette lecture porte sur celle-ci seulement.`
          : `Grain : point géocodé de l’adresse. ${u.ambiguites.includes("parcelle_non_mesurable") ? (u.interrogation === "parcelle" ? "Le tracé de la parcelle n’a pas pu être mesuré : ce que le Géoportail a rendu pour elle n’a pas pu être situé, et rien n’en est retenu." : "Le tracé de la parcelle n’a pas pu être mesuré : le Géoportail a été interrogé au point, et seules les zones et prescriptions qui contiennent ce point sont retenues.") : "La parcelle n’a pas pu être lue : une zone voisine peut s’appliquer à une partie du terrain."}`}
      </div>
      {contacts.length > 0 && (
        <div>
          {contacts.length === 1 ? `La zone ${contacts[0].libelle} touche` : `Les zones ${contacts.map((z) => z.libelle).join(", ")} touchent`} la
          limite de la parcelle sans la couvrir de façon significative (moins de {SURFACE_MIN_M2} m², et moins de {Math.round(PART_MIN * 100)} % de sa surface).
          C’est le plus souvent un écart de tracé entre le plan et le cadastre, à confirmer sur le plan de zonage.
        </div>
      )}
      {n > 0 && (
        <div>
          {n === 1
            ? "Une prescription touche la limite de la parcelle sans la recouvrir : elle peut concerner le voisin, et n’a pas été retenue."
            : `${n} prescriptions touchent la limite de la parcelle sans la recouvrir : elles peuvent concerner le voisin, et n’ont pas été retenues.`}
        </div>
      )}
      {u.grain === "parcelle" && (
        <div>Les surfaces sont calculées en superposant le plan publié et la parcelle cadastrale : ce sont des ordres de grandeur, qui ne mesurent pas ce qui peut être bâti.</div>
      )}
      <div>Une prescription est nommée selon son code et son sous-code nationaux, et selon le type de document. Son effet n’est énoncé que lorsque la nomenclature le fixe ; sinon, il se lit dans le règlement. Les autres prescriptions sont citées par famille.</div>
      <div>Règle applicable n’est pas autorisation obtenue : les permis effectivement déposés autour de l’adresse se lisent dans le module Autour de l’adresse.</div>
      <div>Géoportail de l’urbanisme (API Carto IGN, nomenclatures nationales du CNIG). futur•e n’est pas un certificat d’urbanisme : seuls le certificat et l’instruction d’une demande engagent l’administration.</div>
    </Disclosure>
  );
}

export function UrbanismeBlock({
  urbanisme: u, parcelCode, withDivider,
}: {
  urbanisme: UrbanismeParcelle | undefined;
  parcelCode: string | null;
  withDivider: boolean;
}) {
  const cadre: React.CSSProperties = { display: "grid", gap: 12, ...(withDivider ? { paddingTop: 12, borderTop: "1px solid var(--border-1)" } : {}) };
  const eyebrow = <p style={EYEBROW}>Plan d’urbanisme de la parcelle</p>;

  // Rapport collecté avant FUT-81 : on ne sait rien, on ne dit rien de plus que cela.
  if (!u) {
    return (
      <div style={cadre}>
        {eyebrow}
        <p style={SOURCE}>Ce dossier a été collecté avant la lecture du plan d’urbanisme. Une actualisation des données l’ajoutera.</p>
      </div>
    );
  }

  if (u.statut === "indisponible") {
    return (
      <div style={cadre}>
        <div>{eyebrow}<p style={TITRE}>Plan d’urbanisme non lu</p></div>
        <p style={CORPS}>{bindOrphans("Le Géoportail de l’urbanisme n’a pas répondu lors de la collecte. Cela ne veut pas dire qu’aucune règle ne s’applique : une actualisation du dossier pourra le relire.")}</p>
      </div>
    );
  }

  if (u.regime === "rnu") {
    return (
      <div style={cadre}>
        <div>{eyebrow}<p style={TITRE}>{bindOrphans("La commune n’a ni plan local d’urbanisme ni carte communale : le règlement national d’urbanisme s’applique.")}</p></div>
        <p style={CORPS}>{bindOrphans("Hors des parties déjà urbanisées de la commune, les constructions nouvelles y sont en principe limitées. La mairie instruit chaque projet ; un certificat d’urbanisme indique les règles qui s’appliquent au terrain.")}</p>
        <p style={SOURCE}>D’après le Géoportail de l’urbanisme, qui recense la commune au règlement national d’urbanisme.</p>
        <Details u={u} parcelCode={parcelCode} />
      </div>
    );
  }

  if (u.statut === "non_trouve") {
    return (
      <div style={cadre}>
        <div>{eyebrow}<p style={TITRE}>{bindOrphans("Nous n’avons pas pu identifier de règle d’urbanisme à cette parcelle à partir du Géoportail de l’urbanisme.")}</p></div>
        <p style={CORPS}>{bindOrphans(`Aucun document d’urbanisme n’y est publié pour cette commune${u.communeRnu === false ? ", et elle n’y est pas recensée au règlement national d’urbanisme" : ""}. Des règles s’appliquent pourtant : demandez au service urbanisme de la mairie le document en vigueur avant tout projet.`)}</p>
        <Details u={u} parcelCode={parcelCode} />
      </div>
    );
  }

  const docDe = (id: string) => u.documents.find((d) => d.id === id);
  const incertaine = u.rattachement.mode === "repli" || u.rattachement.mode === "limite";
  const sujet = u.grain === "point" ? "Cette adresse" : incertaine ? "La parcelle retenue" : "Cette parcelle";
  // Une vigueur non établie ne laisse pas affirmer le zonage comme applicable : on dit d'où il vient.
  const selon = u.documents.some((d) => d.vigueur !== "etablie") ? "D’après le document publié, " : "";
  const phrase = (reste: string) => `${selon}${selon ? sujet.charAt(0).toLowerCase() + sujet.slice(1) : sujet} ${reste}`;
  const surLaParcelle = u.grain === "point" ? "à l’adresse" : incertaine ? "sur la parcelle retenue" : "sur la parcelle";
  const titreVerifier = `À vérifier ${surLaParcelle}`;

  // Carte communale : des secteurs, pas de règlement propre.
  if (u.secteurs.length > 0 && u.zones.length === 0) {
    const s = u.secteurs[0];
    const nature = (s.typesect && SECTEUR_SIMPLE[s.typesect]) || "un secteur de la carte communale";
    const items = [
      ...(u.secteurs.length > 1
        ? [<li key="secteurs"><p style={DETAIL}>{bindOrphans(`La parcelle est partagée entre ${u.secteurs.length} secteurs de la carte communale : leurs parts sont dans le détail.`)}</p></li>]
        : []),
      <li key="cc"><p style={CORPS}>
        {bindOrphans(s.typesect === "03"
          ? "La loi y admet en principe l’adaptation, la réfection et l’extension des constructions existantes, sous réserve de l’instruction de chaque demande. Une carte communale n’a pas de règlement propre : les règles nationales d’urbanisme s’appliquent."
          : "Une carte communale n’a pas de règlement propre : chaque projet est instruit selon les règles nationales d’urbanisme, et seule l’instruction d’une demande tranche. Faites confirmer le vôtre par le service urbanisme de la mairie.")}
      </p></li>,
      ...itemsPrescriptions(u, surLaParcelle),
    ];
    return (
      <div style={cadre}>
        {eyebrow}
        <ReserveParcelle u={u} parcelCode={parcelCode} />
        <p style={TITRE}>{bindOrphans(phrase(`est dans ${nature}.`))}</p>
        <ReserveVigueur documents={u.documents} />
        <AVerifier titre={titreVerifier} items={items} />
        <Source documents={u.documents} />
        <Details u={u} parcelCode={parcelCode}>
          {u.secteurs.map((x) => (
            <div key={`${x.documentId}-${x.libelle}`}>
              Secteur « {x.libelle} »{x.typesect ? ` : ${TYPE_SECTEUR[x.typesect]} (type ${x.typesect} de la nomenclature nationale)` : ""}{x.part != null ? `, ${partDetail(x.part)}` : ""}.
            </div>
          ))}
        </Details>
      </div>
    );
  }

  // Document publié, mais aucune zone lue à cette parcelle.
  if (u.zones.length === 0) {
    const items = [
      ...(u.zonesNonMesurables.length > 0
        ? [<li key="nonmes"><p style={DETAIL}>{bindOrphans(sansPreuve(u)
            ? `Le Géoportail rend ${u.zonesNonMesurables.length === 1 ? `la zone ${u.zonesNonMesurables[0]}` : `les zones ${u.zonesNonMesurables.join(", ")}`} pour cette parcelle, sans que ${u.zonesNonMesurables.length === 1 ? "sa" : "leur"} position par rapport à l’adresse puisse être établie.`
            : `${u.zonesNonMesurables.length === 1 ? `La géométrie publiée de la zone ${u.zonesNonMesurables[0]} n’a` : `Les géométries publiées des zones ${u.zonesNonMesurables.join(", ")} n’ont`} pas pu être lue${u.zonesNonMesurables.length === 1 ? "" : "s"}.`)}</p></li>]
        : []),
      ...itemsPrescriptions(u, surLaParcelle),
      <li key="mairie"><p style={CORPS}>{bindOrphans("Demandez au service urbanisme de la mairie la zone applicable et son règlement avant tout projet.")}</p></li>,
    ];
    return (
      <div style={cadre}>
        {eyebrow}
        <ReserveParcelle u={u} parcelCode={parcelCode} />
        <p style={TITRE}>{bindOrphans(`Un ${nomDocument(u.documents[0])} est publié pour cette commune, mais aucune zone n’a pu être lue ${u.grain === "point" ? "à cette adresse" : "à cette parcelle"}.`)}</p>
        <ReserveVigueur documents={u.documents} />
        <AVerifier titre={titreVerifier} items={items} />
        <Source documents={u.documents} />
        <Details u={u} parcelCode={parcelCode} />
      </div>
    );
  }

  const z0 = u.zones[0];
  const du = duDocument(docDe(z0.documentId));
  const natures = naturesZones(u.zones);
  // Sans type national, la zone se nomme par son code : on ne devine pas sa nature.
  const desZones = natures ?? `${u.zones.length} zones`;
  // Des zones dont les parts dépassent la parcelle ne la PARTAGENT pas, elles se SUPERPOSENT (à Besançon,
  // la zone du plan de sauvegarde et le périmètre du site patrimonial couvrent chacune toute la parcelle).
  const superposees = u.zones.reduce((s, z) => s + (z.part ?? 0), 0) > 1.05;
  const titre = u.zones.length === 1
    ? phrase(`est en ${natures ?? `zone ${z0.libelle}`} ${du}.`)
    : superposees
      ? phrase(`est couverte par ${desZones} superposées ${du}.`)
      : u.grain === "point"
        // Un point n'est pas « partagé ». Plusieurs zones le contiennent : superposées (Besançon : plan de
        // sauvegarde et site patrimonial) ou jointives à sa position. Sans parcelle, on ne tranche pas.
        ? phrase(`relève de ${desZones} ${du}.`)
        : phrase(`est partagée entre ${desZones} ${du}.`);
  // Comment le plan décrit ses zones (« Zone urbaine d'habitat pavillonnaire », « Secteur d'activités ») :
  // c'est souvent ce qui parle le plus au lecteur. Au premier niveau quand c'est court, sinon dans le détail.
  const descriptions = [...new Set(u.zones.map(libelleLong).filter((l): l is string => !!l).map((l) => l.replace(/\s*\.$/, "")))];
  const descriptionVisible = descriptions.length > 0 && descriptions.join("").length <= 160;
  // Les liserés mesurables se disent à l'écran ; les simples contacts restent dans le détail.
  const bordures = u.zonesEnLimite.filter((z) => z.surfaceM2 >= SURFACE_MIN_M2);
  // Les règlements distincts : une seule ligne quand toutes les zones renvoient au même fichier.
  const reglements = new Map<string, ZoneParcelle[]>();
  for (const z of u.zones) {
    const cle = JSON.stringify(z.reglement);
    reglements.set(cle, [...(reglements.get(cle) ?? []), z]);
  }

  const items: React.ReactNode[] = [
    ...itemsPrescriptions(u, surLaParcelle),
    ...(u.zones.some((z) => z.typezone === "A" || z.typezone === "N")
      ? [<li key="an"><p style={CORPS}>{bindOrphans("En zone agricole ou naturelle, les constructions nouvelles sont strictement encadrées. L’extension d’une habitation existante n’y est possible que si le règlement la prévoit, et dans ses limites.")}</p></li>]
      : []),
    ...(u.zones.some((z) => z.typezone === "AUs")
      ? [<li key="aus"><p style={CORPS}>{bindOrphans("L’ouverture de cette zone à l’urbanisation suppose une évolution du plan : les constructions y sont en attente.")}</p></li>]
      : []),
    ...(u.ambiguites.includes("plusieurs_documents")
      ? [<li key="docs"><p style={CORPS}>{bindOrphans("Plusieurs documents d’urbanisme se superposent sur cette parcelle : la mairie confirme lequel s’applique à votre projet.")}</p></li>]
      : []),
    ...(bordures.length > 0
      ? [<li key="bordures"><p style={DETAIL}>{bindOrphans(`${bordures.length === 1 ? `Une zone voisine recoupe aussi la parcelle sur environ ${m2(bordures[0].surfaceM2)}` : "Des zones voisines recoupent aussi la parcelle de quelques mètres carrés chacune"}, le long de sa limite. C’est le plus souvent un écart de tracé entre le plan et le cadastre : vérifiez sur le plan de zonage.`)}</p></li>]
      : []),
    ...(u.zonesNonMesurables.length > 0
      ? [<li key="nonmes"><p style={DETAIL}>{bindOrphans(`Le Géoportail rend aussi ${u.zonesNonMesurables.length === 1 ? `la zone ${u.zonesNonMesurables[0]}` : `les zones ${u.zonesNonMesurables.join(", ")}`}, sans tracé lisible : vérifiez sur le plan de zonage si elle concerne ce terrain.`)}</p></li>]
      : []),
    <li key="limite" style={{ display: "grid", gap: 6 }}>
      <p style={CORPS}>{bindOrphans(limiteDuZonage(u.zones.length))}</p>
      {[...reglements].map(([cle, zs]) => <LienReglement key={cle} zones={zs} />)}
    </li>,
  ];

  return (
    <div style={cadre}>
      {eyebrow}
      <ReserveParcelle u={u} parcelCode={parcelCode} />
      <div style={{ display: "grid", gap: 4 }}>
        <p style={TITRE}>{bindOrphans(titre)}</p>
        {descriptionVisible && (
          <p style={DETAIL}>{bindOrphans(`Le plan ${descriptions.length === 1 && u.zones.length === 1 ? "la" : "les"} décrit ainsi : ${descriptions.map(cite).join(", ")}.`)}</p>
        )}
      </div>
      <ReserveVigueur documents={u.documents} />
      <AVerifier titre={titreVerifier} items={items} />
      <Source documents={u.documents} />
      <Details u={u} parcelCode={parcelCode}>
        {u.zones.map((z) => {
          const long = libelleLong(z);
          return (
            <div key={`${z.documentId}-${z.libelle}`}>
              Zone {z.libelle}{z.part != null ? ` (${partDetail(z.part)})` : ""}
              {z.typezone ? ` : ${TYPE_ZONE[z.typezone]} dans la nomenclature nationale` : ""}
              {long ? `. Le plan la décrit ainsi : « ${long} »` : ""}.
            </div>
          );
        })}
        {bordures.length > 0 && (
          <div>{bordures.length === 1 ? `Zone en bordure : ${bordures[0].libelle}, sur environ ${m2(bordures[0].surfaceM2)}.` : `Zones en bordure : ${bordures.map((z) => `${z.libelle} (environ ${m2(z.surfaceM2)})`).join(", ")}.`}</div>
        )}
      </Details>
    </div>
  );
}
