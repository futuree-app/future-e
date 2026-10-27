import React from "react";
import {
  AUTRE_PRESCRIPTION, CATEGORIES, NOTE_NEUTRE, PART_MIN, SURFACE_MIN_M2, TYPE_DOCUMENT, TYPE_SECTEUR, TYPE_ZONE,
} from "@/lib/urbanisme-nomenclature";
// Types seulement : l'écran n'embarque pas le calcul géométrique (cf. `urbanisme-nomenclature.ts`).
import type { DocumentUrbanisme, PrescriptionParcelle, UrbanismeParcelle, ZoneParcelle } from "@/lib/urbanisme-parcelle";
import { dateLongue } from "@/lib/data/gaspar-pprn-inondation";
import { bindOrphans } from "@/lib/typography";
import { Disclosure } from "./kit";

// Plan d'urbanisme de la parcelle (FUT-81), sous-bloc du statut réglementaire. Il dit CE QUI EST PUBLIÉ
// (document, zone, prescriptions, règlement) et CE QU'IL FAUT VÉRIFIER, jamais ce qui serait autorisé :
// un zonage ne vaut ni droit à construire ni certificat d'urbanisme.
//
// Revue du 27/10/2026 : une réserve qui conditionne toute la lecture (parcelle peut-être voisine, vigueur
// du document non vérifiée) se lit AVANT ce qu'elle conditionne, jamais dans le repli « Comprendre ».

const EYEBROW: React.CSSProperties = { fontSize: 12.5, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--fg-4)", margin: "0 0 8px" };
const TITRE: React.CSSProperties = { fontSize: 15, fontWeight: 500, color: "var(--fg-hi)", lineHeight: 1.5, margin: 0 };
const CORPS: React.CSSProperties = { fontSize: 14, color: "var(--fg-2)", lineHeight: 1.6, margin: 0 };
const DETAIL: React.CSSProperties = { fontSize: 13.5, color: "var(--fg-3)", lineHeight: 1.55, margin: 0 };
const SOURCE: React.CSSProperties = { fontSize: 12.5, color: "var(--fg-4)", lineHeight: 1.55, margin: 0 };
const LIEN: React.CSSProperties = { fontSize: 13, color: "var(--accent-dim, #7a6e60)", textDecoration: "underline" };
// Une réserve qui conditionne la lecture : même registre que le corps, marquée par un filet ambre.
const RESERVE: React.CSSProperties = { ...CORPS, color: "var(--fg-hi)", paddingLeft: 12, borderLeft: "2px solid var(--yellow, #b8a042)" };

// Espaces insécables : « 39 m² » et « 53 % » ne se coupent jamais en fin de ligne (AGENTS.md).
const NBSP = "\u00a0";
const m2 = (v: number) => `${Math.max(1, Math.round(v)).toLocaleString("fr-FR")}${NBSP}m²`;
const pct = (part: number) => `${Math.round(part * 100)}${NBSP}%`;
/** « toute la parcelle », « environ 13 % de la parcelle (≈ 490 m²) », ou en m² seuls sous 1 %. */
function etendueSurface(part: number, surfaceM2: number | null): string {
  if (part >= 0.995) return "toute la parcelle";
  if (part < 0.01 && surfaceM2 != null) return `environ ${m2(surfaceM2)} de la parcelle`;
  return `environ ${pct(part)} de la parcelle${surfaceM2 != null ? ` (≈${NBSP}${m2(surfaceM2)})` : ""}`;
}
/** Dans la liste des zones du titre : la part seule, sans parenthèses imbriquées. */
function partBreve(part: number): string {
  return part >= 0.995 ? "toute la parcelle" : part < 0.01 ? `moins de 1${NBSP}%` : `environ ${pct(part)}`;
}

/** « UE - correspondant aux secteurs… » -> « correspondant aux secteurs… » : le libellé long répète souvent le code. */
function libelleLong(z: ZoneParcelle): string | null {
  const l = z.libelong?.replace(new RegExp(`^${z.libelle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*[-:–]\\s*`, "i"), "").trim();
  return l ? l.charAt(0).toUpperCase() + l.slice(1) : null;
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

function etendue(p: PrescriptionParcelle): string | null {
  if (p.etendue === "incertaine") return "position par rapport à la parcelle non vérifiable";
  if (p.etendue === "marginale") {
    return p.forme === "ligne"
      ? "effleure la parcelle"
      : `recoupe la parcelle sur une très faible surface${p.surfaceM2 == null ? "" : p.surfaceM2 < 1 ? ` (moins d’1${NBSP}m²)` : ` (≈${NBSP}${m2(p.surfaceM2)})`}`;
  }
  if (p.forme === "ligne") return p.longueurM != null ? `traverse la parcelle sur environ ${Math.max(1, Math.round(p.longueurM))} m` : "traverse la parcelle";
  if (p.forme === "point") return "situé sur la parcelle";
  return p.part == null ? null : `sur ${etendueSurface(p.part, p.surfaceM2)}`;
}

function Prescription({ p }: { p: PrescriptionParcelle }) {
  const c = CATEGORIES[p.categorie];
  const titre = c?.titre ?? `Prescription cartographiée (code ${p.code}-${p.sousCode})`;
  const e = etendue(p);
  const libelleDistinct = p.libelle.trim().toLowerCase() !== titre.toLowerCase() ? p.libelle : null;
  return (
    <div style={{ display: "grid", gap: 3 }}>
      <p style={{ fontSize: 14, fontWeight: 500, color: "var(--fg-hi)", margin: 0 }}>
        {titre}{e ? <span style={{ fontWeight: 400, color: "var(--fg-3)" }}> · {e}</span> : null}
      </p>
      {libelleDistinct && <p style={DETAIL}>« {libelleDistinct} »</p>}
      <p style={{ ...DETAIL, color: "var(--fg-2)" }}>{bindOrphans(c?.note ?? NOTE_NEUTRE)}</p>
      {p.etendue !== "couvre" && (
        <p style={DETAIL}>
          {bindOrphans(p.etendue === "marginale"
            ? "Un recouvrement aussi faible peut venir d’un écart de tracé entre le plan et le cadastre : vérifiez sur le plan de zonage si elle concerne bien ce terrain."
            : "Sa géométrie publiée n’a pas pu être lue : vérifiez sur le plan de zonage si elle concerne ce terrain.")}
        </p>
      )}
    </div>
  );
}

/** Les prescriptions de la parcelle, nommées puis citées. Rendues dans tous les états où un document est lu. */
function Prescriptions({ u, surLaParcelle }: { u: UrbanismeParcelle; surLaParcelle: string }) {
  // « autre prescription » (code 99) se compte, il ne se nomme pas : il n'apprend rien au lecteur.
  const nommees = u.autresPrescriptions.filter((f) => f !== AUTRE_PRESCRIPTION);
  return (
    <>
      {u.prescriptions.length > 0 && (
        <div style={{ display: "grid", gap: 12 }}>
          <p style={{ ...EYEBROW, margin: 0 }}>Prescriptions cartographiées {surLaParcelle}</p>
          {u.prescriptions.map((p, i) => <Prescription key={i} p={p} />)}
        </div>
      )}
      {u.prescriptionsStatut === "indisponible" ? (
        <p style={RESERVE}>{bindOrphans("Les prescriptions cartographiées n’ont pas pu être toutes lues lors de la collecte : le règlement graphique reste à consulter.")}</p>
      ) : u.autresPrescriptions.length > 0 ? (
        <p style={DETAIL}>
          {bindOrphans(`${u.prescriptions.length > 0 ? "D’autres prescriptions" : "Des prescriptions"} s’appliquent aussi ${surLaParcelle}${nommees.length > 0 ? ` (${nommees.slice(0, 4).join(", ")}${nommees.length > 4 ? "…" : ""})` : ""} : elles se lisent dans le règlement.`)}
        </p>
      ) : null}
    </>
  );
}

/** Un règlement, et les zones qu'il régit (plusieurs zones renvoient souvent au même fichier). */
function LienReglement({ zones }: { zones: ZoneParcelle[] }) {
  const r = zones[0].reglement;
  const cible = zones.length === 1 ? `de la zone ${zones[0].libelle}` : `des zones ${zones.map((z) => z.libelle).join(", ")}`;
  if (r.statut === "publie") {
    return (
      <a href={r.url} target="_blank" rel="noopener noreferrer" style={LIEN}>
        Lire le règlement {cible}{r.source === "gpu" ? " (PDF, Géoportail de l’urbanisme)" : " (site de la collectivité)"} →
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

function Provenance({ documents }: { documents: DocumentUrbanisme[] }) {
  return (
    <>
      {documents.map((d) => {
        const appro = dateLongue(d.approbation);
        const pub = dateLongue(d.publication);
        return (
          <p key={d.id} style={SOURCE}>
            D’après le Géoportail de l’urbanisme : {d.titre ?? nomDocument(d)}
            {appro ? `, dernière évolution approuvée le ${appro}` : ""}
            {pub ? `, publiée le ${pub}` : ""}.
            {" "}
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
        ? "Le Géoportail ne donne pas ce document comme en vigueur. Faites confirmer en mairie la version qui s’applique avant de vous fonder sur cette lecture."
        : partiel
          ? "Le Géoportail signale ce document comme partiellement annulé. Faites confirmer en mairie les règles qui s’appliquent à ce terrain."
          : "Le statut de ce document, en vigueur ou non, n’a pas pu être vérifié lors de la collecte. Faites confirmer en mairie la version qui s’applique avant de vous fonder sur cette lecture.")}
    </p>
  );
}

/** LA RÉSERVE DE RATTACHEMENT, VISIBLE AVANT TOUT LE RESTE : les règles lues sont peut-être celles du voisin. */
function ReserveParcelle({ u, parcelCode }: { u: UrbanismeParcelle; parcelCode: string | null }) {
  const ref = parcelCode ? ` (${parcelCode})` : "";
  if (u.rattachement.mode === "repli") {
    const d = u.rattachement.distanceM;
    return (
      <p style={RESERVE}>
        {bindOrphans(`Le point de l’adresse ne tombe dans aucune parcelle. La plus proche${ref}${d == null ? "" : d < 1 ? ", à moins d’un mètre," : `, à environ ${Math.round(d)} m,`} a été retenue : elle peut être celle d’un voisin. Les règles ci-dessous ne valent pour ce logement que si c’est bien sa parcelle ; vérifiez la référence cadastrale sur l’acte ou le compromis.`)}
      </p>
    );
  }
  if (u.rattachement.mode === "limite") {
    return (
      <p style={RESERVE}>
        {bindOrphans(`Le point de l’adresse est sur la limite entre plusieurs parcelles. La lecture porte sur l’une d’elles${ref}, qui peut ne pas être celle du logement ; vérifiez la référence cadastrale sur l’acte ou le compromis.`)}
      </p>
    );
  }
  return null;
}

/** Ce que le zonage ne dit pas, et à qui le demander. Toujours affiché quand un document est lu. */
function AVerifier({ zones }: { zones: ZoneParcelle[] }) {
  const cible = zones.length === 1 ? `le chapitre de la zone ${zones[0].libelle}` : "les chapitres de ces zones";
  return (
    <p style={CORPS}>
      {bindOrphans(`Ce zonage ne dit pas, à lui seul, ce qui est autorisé. Avant d’acheter en vue d’une extension, d’une annexe, d’une surélévation ou d’un changement d’usage, lisez dans le règlement ${cible} et ses dispositions générales, puis faites confirmer le projet par le service urbanisme de la mairie. Un certificat d’urbanisme opérationnel peut aussi être demandé.`)}
    </p>
  );
}

function Methode({ u, parcelCode }: { u: UrbanismeParcelle; parcelCode: string | null }) {
  const n = u.prescriptionsContact;
  const contacts = u.zonesEnLimite.filter((z) => z.surfaceM2 < SURFACE_MIN_M2);
  return (
    <Disclosure summary="Comprendre cette lecture">
      <div>
        {u.grain === "parcelle"
          ? `Grain : parcelle cadastrale${parcelCode ? ` ${parcelCode}` : ""} rattachée à l’adresse. Une adresse peut couvrir plusieurs parcelles (jardin, dépendance) : cette lecture porte sur celle-ci seulement.`
          : "Grain : point géocodé de l’adresse. La parcelle n’a pas pu être lue : une zone voisine peut s’appliquer à une partie du terrain."}
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
        <p style={CORPS}>{bindOrphans("Hors des parties déjà urbanisées de la commune, les constructions nouvelles y sont en principe limitées. La mairie instruit chaque projet au regard de ces règles nationales ; un certificat d’urbanisme permet de connaître celles qui s’appliquent au terrain.")}</p>
        <p style={SOURCE}>D’après le Géoportail de l’urbanisme, qui recense la commune au règlement national d’urbanisme.</p>
        <Methode u={u} parcelCode={parcelCode} />
      </div>
    );
  }

  if (u.statut === "non_trouve") {
    return (
      <div style={cadre}>
        <div>{eyebrow}<p style={TITRE}>{bindOrphans("Nous n’avons pas pu identifier de règle d’urbanisme à cette parcelle à partir du Géoportail de l’urbanisme.")}</p></div>
        <p style={CORPS}>{bindOrphans(`Aucun document d’urbanisme n’y est publié pour cette commune${u.communeRnu === false ? ", et elle n’y est pas recensée au règlement national d’urbanisme" : ""}. Des règles s’appliquent pourtant : demandez au service urbanisme de la mairie le document en vigueur avant tout projet.`)}</p>
        <Methode u={u} parcelCode={parcelCode} />
      </div>
    );
  }

  const docDe = (id: string) => u.documents.find((d) => d.id === id);
  const incertaine = u.rattachement.mode === "repli" || u.rattachement.mode === "limite";
  const sujet = u.grain === "point" ? "Cette adresse" : incertaine ? "La parcelle retenue" : "Cette parcelle";
  // Une vigueur non établie ne laisse pas affirmer le zonage comme applicable : on dit d'où il vient.
  const selon = u.documents.some((d) => d.vigueur !== "etablie") ? "D’après le document publié, " : "";
  const phrase = (reste: string) => `${selon}${selon ? sujet.charAt(0).toLowerCase() + sujet.slice(1) : sujet} ${reste}`;
  const surLaParcelle = incertaine ? "sur la parcelle retenue" : "sur la parcelle";

  // Carte communale : des secteurs, pas de règlement propre.
  if (u.secteurs.length > 0 && u.zones.length === 0) {
    const s = u.secteurs[0];
    const nature = s.typesect ? TYPE_SECTEUR[s.typesect] : "secteur";
    return (
      <div style={cadre}>
        {eyebrow}
        <ReserveParcelle u={u} parcelCode={parcelCode} />
        <p style={TITRE}>{bindOrphans(phrase(`est dans un ${nature} de la carte communale (secteur « ${s.libelle} »).`))}</p>
        <ReserveVigueur documents={u.documents} />
        {u.secteurs.length > 1 && (
          <p style={DETAIL}>{bindOrphans(`La parcelle est partagée entre plusieurs secteurs : ${u.secteurs.map((x) => `« ${x.libelle} »${x.part != null ? ` (${partBreve(x.part)})` : ""}`).join(", ")}.`)}</p>
        )}
        <p style={CORPS}>
          {bindOrphans(s.typesect === "03"
            ? "La loi y admet en principe l’adaptation, la réfection et l’extension des constructions existantes, sous réserve de l’instruction de chaque demande. Une carte communale n’a pas de règlement propre : les règles nationales d’urbanisme s’appliquent."
            : "Une carte communale délimite seulement les secteurs où des constructions peuvent être admises. Elle n’a pas de règlement propre : un projet y reste instruit selon les règles nationales d’urbanisme, et seule l’instruction d’une demande dit s’il est autorisé.")}
        </p>
        <Prescriptions u={u} surLaParcelle={surLaParcelle} />
        <Provenance documents={u.documents} />
        <Methode u={u} parcelCode={parcelCode} />
      </div>
    );
  }

  // Document publié, mais aucune zone lue à cette parcelle.
  if (u.zones.length === 0) {
    return (
      <div style={cadre}>
        {eyebrow}
        <ReserveParcelle u={u} parcelCode={parcelCode} />
        <p style={TITRE}>{bindOrphans(`Un ${nomDocument(u.documents[0])} est publié pour cette commune, mais aucune zone n’a pu être lue à cette parcelle.`)}</p>
        <ReserveVigueur documents={u.documents} />
        {u.zonesNonMesurables.length > 0 && (
          <p style={DETAIL}>{bindOrphans(`La géométrie publiée de ${u.zonesNonMesurables.length === 1 ? `la zone ${u.zonesNonMesurables[0]}` : `des zones ${u.zonesNonMesurables.join(", ")}`} n’a pas pu être lue.`)}</p>
        )}
        <Prescriptions u={u} surLaParcelle={surLaParcelle} />
        <p style={CORPS}>{bindOrphans("Demandez au service urbanisme de la mairie la zone applicable et son règlement avant tout projet.")}</p>
        <Provenance documents={u.documents} />
        <Methode u={u} parcelCode={parcelCode} />
      </div>
    );
  }

  const z0 = u.zones[0];
  const liste = u.zones.map((z) => `${z.libelle}${z.part != null ? ` (${partBreve(z.part)})` : ""}`).join(", ");
  // Des zones dont les parts dépassent la parcelle ne la PARTAGENT pas, elles se SUPERPOSENT (à Besançon,
  // la zone du plan de sauvegarde et le périmètre du site patrimonial couvrent chacune toute la parcelle).
  const superposees = u.zones.reduce((s, z) => s + (z.part ?? 0), 0) > 1.05;
  const titre = u.zones.length === 1
    ? phrase(`est en zone ${z0.libelle} ${duDocument(docDe(z0.documentId))}.`)
    : superposees
      ? phrase(`est couverte par ${u.zones.length} zones superposées ${duDocument(docDe(z0.documentId))} : ${liste}.`)
      : phrase(`est partagée entre ${u.zones.length} zones ${duDocument(docDe(z0.documentId))} : ${liste}.`);
  // Les liserés mesurables se disent à l'écran ; les simples contacts restent dans la méthode.
  const bordures = u.zonesEnLimite.filter((z) => z.surfaceM2 >= SURFACE_MIN_M2);
  // Les règlements distincts : une seule ligne quand toutes les zones renvoient au même fichier.
  const reglements = new Map<string, ZoneParcelle[]>();
  for (const z of u.zones) {
    const cle = JSON.stringify(z.reglement);
    reglements.set(cle, [...(reglements.get(cle) ?? []), z]);
  }

  return (
    <div style={cadre}>
      {eyebrow}
      <ReserveParcelle u={u} parcelCode={parcelCode} />
      <p style={TITRE}>{bindOrphans(titre)}</p>
      <ReserveVigueur documents={u.documents} />
      {u.zones.map((z) => {
        const long = libelleLong(z);
        const categorie = z.typezone ? TYPE_ZONE[z.typezone] : null;
        if (!long && !categorie) return null;
        return (
          <p key={`${z.documentId}-${z.libelle}`} style={DETAIL}>
            {u.zones.length > 1 ? <strong style={{ fontWeight: 500, color: "var(--fg-2)" }}>{z.libelle} : </strong> : null}
            {long ?? ""}{long && categorie ? " · " : ""}{categorie ? `${categorie} dans la nomenclature nationale` : ""}
          </p>
        );
      })}
      {u.zones.some((z) => z.typezone === "A" || z.typezone === "N") && (
        <p style={CORPS}>{bindOrphans("En zone agricole ou naturelle, les constructions nouvelles sont strictement encadrées. L’extension d’une habitation existante n’y est possible que si le règlement la prévoit, et dans les limites qu’il fixe.")}</p>
      )}
      {u.zones.some((z) => z.typezone === "AUs") && (
        <p style={CORPS}>{bindOrphans("L’ouverture de cette zone à l’urbanisation suppose une évolution du plan : les constructions y sont en attente.")}</p>
      )}
      {u.ambiguites.includes("plusieurs_documents") && (
        <p style={CORPS}>{bindOrphans("Plusieurs documents d’urbanisme se superposent sur cette parcelle : la mairie confirme lequel s’applique à votre projet.")}</p>
      )}
      {bordures.length > 0 && (
        <p style={DETAIL}>{bindOrphans(`${bordures.length === 1 ? `La zone ${bordures[0].libelle} recoupe` : `Les zones ${bordures.map((z) => z.libelle).join(", ")} recoupent`} aussi la parcelle, sur ${bordures.length === 1 ? `environ ${m2(bordures[0].surfaceM2)}` : "quelques mètres carrés chacune"}, le long de sa limite. Un liseré aussi mince vient le plus souvent d’un écart de tracé entre le plan et le cadastre : vérifiez sur le plan de zonage.`)}</p>
      )}
      {u.zonesNonMesurables.length > 0 && (
        <p style={DETAIL}>{bindOrphans(`Le Géoportail rend aussi ${u.zonesNonMesurables.length === 1 ? `la zone ${u.zonesNonMesurables[0]}` : `les zones ${u.zonesNonMesurables.join(", ")}`}, dont la géométrie n’a pas pu être lue : vérifiez sur le plan de zonage si elle concerne ce terrain.`)}</p>
      )}

      <Prescriptions u={u} surLaParcelle={surLaParcelle} />

      <AVerifier zones={u.zones} />
      <div style={{ display: "grid", gap: 6 }}>
        {[...reglements].map(([cle, zs]) => <LienReglement key={cle} zones={zs} />)}
      </div>
      <Provenance documents={u.documents} />
      <Methode u={u} parcelCode={parcelCode} />
    </div>
  );
}
