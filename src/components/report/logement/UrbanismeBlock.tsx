import React from "react";
import {
  AUTRE_PRESCRIPTION, FAMILLES, PART_MIN, SURFACE_MIN_M2, TYPE_DOCUMENT, TYPE_SECTEUR, TYPE_ZONE,
  type DocumentUrbanisme, type PrescriptionParcelle, type UrbanismeParcelle, type ZoneParcelle,
} from "@/lib/urbanisme-parcelle";
import { dateLongue } from "@/lib/data/gaspar-pprn-inondation";
import { bindOrphans } from "@/lib/typography";
import { Disclosure } from "./kit";

// Plan d'urbanisme de la parcelle (FUT-81), sous-bloc du statut réglementaire. Il dit CE QUI EST PUBLIÉ
// (document, zone, prescriptions, règlement) et CE QU'IL FAUT VÉRIFIER, jamais ce qui serait autorisé :
// un zonage ne vaut ni droit à construire ni certificat d'urbanisme.

const EYEBROW: React.CSSProperties = { fontSize: 12.5, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--fg-4)", margin: "0 0 8px" };
const TITRE: React.CSSProperties = { fontSize: 15, fontWeight: 500, color: "var(--fg-hi)", lineHeight: 1.5, margin: 0 };
const CORPS: React.CSSProperties = { fontSize: 14, color: "var(--fg-2)", lineHeight: 1.6, margin: 0 };
const DETAIL: React.CSSProperties = { fontSize: 13.5, color: "var(--fg-3)", lineHeight: 1.55, margin: 0 };
const SOURCE: React.CSSProperties = { fontSize: 12.5, color: "var(--fg-4)", lineHeight: 1.55, margin: 0 };
const LIEN: React.CSSProperties = { fontSize: 13, color: "var(--accent-dim, #7a6e60)", textDecoration: "underline" };

const pourcent = (part: number) => (part >= 0.995 ? "toute la parcelle" : `environ ${Math.max(1, Math.round(part * 100))} % de la parcelle`);

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
  if (p.forme === "ligne") return "traverse la parcelle";
  if (p.forme === "point") return "situé sur la parcelle";
  return p.part == null ? null : `sur ${pourcent(p.part)}`;
}

function Prescription({ p }: { p: PrescriptionParcelle }) {
  const f = FAMILLES[p.famille];
  const e = etendue(p);
  const libelleDistinct = p.libelle.trim().toLowerCase() !== f.titre.toLowerCase() ? p.libelle : null;
  return (
    <div style={{ display: "grid", gap: 3 }}>
      <p style={{ fontSize: 14, fontWeight: 500, color: "var(--fg-hi)", margin: 0 }}>
        {f.titre}{e ? <span style={{ fontWeight: 400, color: "var(--fg-3)" }}> · {e}</span> : null}
      </p>
      {libelleDistinct && <p style={DETAIL}>« {libelleDistinct} »</p>}
      <p style={{ ...DETAIL, color: "var(--fg-2)" }}>{bindOrphans(f.note)}</p>
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
            {d.enVigueur === false ? " Le Géoportail ne le donne pas comme en vigueur : vérifiez en mairie la version applicable." : ""}
            {" "}
            <a href={d.url} target="_blank" rel="noopener noreferrer" style={{ color: "inherit", textDecoration: "underline" }}>Voir le document</a>
          </p>
        );
      })}
    </>
  );
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

function Methode({ u, parcelCode, parcelleParRepli }: { u: UrbanismeParcelle; parcelCode: string | null; parcelleParRepli: boolean }) {
  return (
    <Disclosure summary="Comprendre cette lecture">
      <div>
        {u.grain === "parcelle"
          ? `Grain : parcelle cadastrale${parcelCode ? ` ${parcelCode}` : ""} rattachée à l’adresse. Une adresse peut couvrir plusieurs parcelles (jardin, dépendance) : cette lecture porte sur celle-ci seulement.`
          : "Grain : point géocodé de l’adresse. La parcelle n’a pas pu être lue : une zone voisine peut s’appliquer à une partie du terrain."}
      </div>
      {parcelleParRepli && (
        <div>Le point de l’adresse ne tombait dans aucune parcelle : la plus proche a été retenue. Elle peut être celle d’un voisin, vérifiez la référence cadastrale du bien.</div>
      )}
      {u.zonesEnLimite.length > 0 && (
        <div>
          {u.zonesEnLimite.length === 1 ? `La zone ${u.zonesEnLimite[0]} touche` : `Les zones ${u.zonesEnLimite.join(", ")} touchent`} la
          limite de la parcelle sans la couvrir de façon significative (moins de {Math.round(PART_MIN * 100)} % et de {SURFACE_MIN_M2} m²
          estimés). C’est le plus souvent un écart de tracé entre le plan et le cadastre, à confirmer sur le plan de zonage.
        </div>
      )}
      {u.grain === "parcelle" && (
        <div>Les parts de parcelle sont estimées en superposant le plan publié et la parcelle cadastrale : ce sont des ordres de grandeur, qui ne mesurent pas ce qui peut être bâti.</div>
      )}
      <div>Les prescriptions nommées ici sont celles dont l’effet change une vérification avant achat ou travaux. Les autres sont citées par famille et se lisent dans le règlement. Une prescription qui ne fait que border la parcelle n’est pas retenue : elle peut concerner le voisin.</div>
      <div>Règle applicable n’est pas autorisation obtenue : les permis effectivement déposés autour de l’adresse se lisent dans le module Autour de l’adresse.</div>
      <div>Géoportail de l’urbanisme (API Carto IGN, nomenclature nationale du CNIG). futur•e n’est pas un certificat d’urbanisme : seuls le certificat et l’instruction d’une demande engagent l’administration.</div>
    </Disclosure>
  );
}

export function UrbanismeBlock({
  urbanisme: u, parcelCode, parcelleParRepli, withDivider,
}: {
  urbanisme: UrbanismeParcelle | undefined;
  parcelCode: string | null;
  parcelleParRepli: boolean;
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
        <Methode u={u} parcelCode={parcelCode} parcelleParRepli={parcelleParRepli} />
      </div>
    );
  }

  if (u.statut === "non_trouve") {
    return (
      <div style={cadre}>
        <div>{eyebrow}<p style={TITRE}>{bindOrphans("Nous n’avons pas pu identifier de règle d’urbanisme à cette parcelle à partir du Géoportail de l’urbanisme.")}</p></div>
        <p style={CORPS}>{bindOrphans(`Aucun document d’urbanisme n’y est publié pour cette commune${u.communeRnu === false ? ", et elle n’y est pas recensée au règlement national d’urbanisme" : ""}. Des règles s’appliquent pourtant : demandez au service urbanisme de la mairie le document en vigueur avant tout projet.`)}</p>
        <Methode u={u} parcelCode={parcelCode} parcelleParRepli={parcelleParRepli} />
      </div>
    );
  }

  const docDe = (id: string) => u.documents.find((d) => d.id === id);
  const sujet = u.grain === "parcelle" ? "Cette parcelle" : "Cette adresse";

  // Carte communale : des secteurs, pas de règlement propre.
  if (u.secteurs.length > 0 && u.zones.length === 0) {
    const s = u.secteurs[0];
    const nature = s.typesect ? TYPE_SECTEUR[s.typesect] : "secteur";
    return (
      <div style={cadre}>
        <div>
          {eyebrow}
          <p style={TITRE}>{bindOrphans(`${sujet} est dans un ${nature} de la carte communale (secteur « ${s.libelle} »).`)}</p>
        </div>
        {u.secteurs.length > 1 && (
          <p style={DETAIL}>{bindOrphans(`La parcelle est partagée entre plusieurs secteurs : ${u.secteurs.map((x) => `« ${x.libelle} »${x.part != null ? ` (${pourcent(x.part)})` : ""}`).join(", ")}.`)}</p>
        )}
        <p style={CORPS}>
          {bindOrphans(s.typesect === "03"
            ? "La loi y admet en principe l’adaptation, la réfection et l’extension des constructions existantes, sous réserve de l’instruction de chaque demande. Une carte communale n’a pas de règlement propre : les règles nationales d’urbanisme s’appliquent."
            : "Une carte communale délimite seulement les secteurs où des constructions peuvent être admises. Elle n’a pas de règlement propre : un projet y reste instruit selon les règles nationales d’urbanisme, et seule l’instruction d’une demande dit s’il est autorisé.")}
        </p>
        <Provenance documents={u.documents} />
        <Methode u={u} parcelCode={parcelCode} parcelleParRepli={parcelleParRepli} />
      </div>
    );
  }

  // Document publié, mais aucune zone lue à cette parcelle.
  if (u.zones.length === 0) {
    return (
      <div style={cadre}>
        <div>{eyebrow}<p style={TITRE}>{bindOrphans(`Un ${nomDocument(u.documents[0])} est publié pour cette commune, mais aucune zone n’a pu être lue à cette parcelle.`)}</p></div>
        <p style={CORPS}>{bindOrphans("Demandez au service urbanisme de la mairie la zone applicable et son règlement avant tout projet.")}</p>
        <Provenance documents={u.documents} />
        <Methode u={u} parcelCode={parcelCode} parcelleParRepli={parcelleParRepli} />
      </div>
    );
  }

  const z0 = u.zones[0];
  const titre = u.zones.length === 1
    ? `${sujet} est en zone ${z0.libelle} ${duDocument(docDe(z0.documentId))}.`
    : `${sujet} est partagée entre ${u.zones.length} zones ${duDocument(docDe(z0.documentId))} : ${u.zones.map((z) => `${z.libelle}${z.part != null ? ` (${pourcent(z.part)})` : ""}`).join(", ")}.`;
  // « autre prescription » (code 99) se compte, il ne se nomme pas : il n'apprend rien au lecteur.
  const nommees = u.autresPrescriptions.filter((f) => f !== AUTRE_PRESCRIPTION);
  // Les règlements distincts : une seule ligne quand toutes les zones renvoient au même fichier.
  const reglements = new Map<string, ZoneParcelle[]>();
  for (const z of u.zones) {
    const cle = JSON.stringify(z.reglement);
    reglements.set(cle, [...(reglements.get(cle) ?? []), z]);
  }

  return (
    <div style={cadre}>
      <div>{eyebrow}<p style={TITRE}>{bindOrphans(titre)}</p></div>
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

      {u.prescriptions.length > 0 && (
        <div style={{ display: "grid", gap: 12 }}>
          <p style={{ ...EYEBROW, margin: 0 }}>Prescriptions cartographiées sur la parcelle</p>
          {u.prescriptions.map((p, i) => <Prescription key={i} p={p} />)}
        </div>
      )}
      {u.prescriptionsStatut === "indisponible" ? (
        <p style={DETAIL}>{bindOrphans("Les prescriptions cartographiées n’ont pas pu être toutes lues lors de la collecte : le règlement graphique reste à consulter.")}</p>
      ) : u.autresPrescriptions.length > 0 ? (
        <p style={DETAIL}>
          {bindOrphans(`${u.prescriptions.length > 0 ? "D’autres prescriptions" : "Des prescriptions"} s’appliquent aussi à la parcelle${nommees.length > 0 ? ` (${nommees.slice(0, 4).join(", ")}${nommees.length > 4 ? "…" : ""})` : ""} : elles se lisent dans le règlement.`)}
        </p>
      ) : null}

      <AVerifier zones={u.zones} />
      <div style={{ display: "grid", gap: 6 }}>
        {[...reglements].map(([cle, zs]) => <LienReglement key={cle} zones={zs} />)}
      </div>
      <Provenance documents={u.documents} />
      <Methode u={u} parcelCode={parcelCode} parcelleParRepli={parcelleParRepli} />
    </div>
  );
}
