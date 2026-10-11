// FUT-87 · PROTOTYPE 2 · « MA DÉCISION ». DEV UNIQUEMENT : 404 en production.
//
// Le dossier est le VRAI dossier du moteur (`buildCommuneDossier`, mêmes données et mêmes règles que
// `/dev/dossier`), pour une commune publique et un projet décrit dans l'URL. Aucun appel au modèle :
// la conclusion est le texte déterministe du plan. Seule la mise en page change.
//
// `?lieu=` : un DOSSIER D'ADRESSE réel, pour vérifier le périmètre « commune + adresse ». L'adresse est
// géocodée par la BAN, puis le dossier est assemblé par la fonction de production
// (`assembleAddressDossier`), en lecture seule : aucune écriture, aucun dossier de compte. N'y mettre
// que l'adresse d'un bâtiment public (les cas de test utilisent l'hôtel de ville de Nîmes).
import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import { buildCommuneDossier } from "@/lib/decision/territory-facts";
import { assembleAddressDossier } from "@/lib/server/assemble-address-dossier";
import type { ResolvedAddress } from "@/lib/server/logement-decision-data";
import { urlRechercheBan } from "@/lib/geocodeur-ban";
import { lireDossier } from "@/components/prototypes/fut87/lecture-dossier";
import { DecisionReleve } from "@/components/prototypes/fut87/DecisionReleve";
import { releve as s, BandeauPrototype } from "@/components/prototypes/fut87/primitives";
import { DEFAUT, CAS_DECISION, projetDeTest } from "../projet-de-test";

export const dynamic = "force-dynamic";

async function geocoder(lieu: string): Promise<ResolvedAddress | null> {
  const res = await fetch(urlRechercheBan({ q: lieu, limit: 1 }), { cache: "no-store" }).catch(() => null);
  if (!res?.ok) return null;
  const f = (await res.json() as { features?: { properties: Record<string, string>; geometry: { coordinates: [number, number] } }[] }).features?.[0];
  if (!f) return null;
  const p = f.properties;
  return {
    id: p.id ?? null, label: p.label ?? lieu, city: p.city ?? null, citycode: p.citycode ?? null,
    postcode: p.postcode ?? null, latitude: f.geometry.coordinates[1], longitude: f.geometry.coordinates[0],
  };
}

export default async function PrototypeDecision({ searchParams }: { searchParams: Promise<{ insee?: string; prefs?: string; adresse?: string; confirmer?: string; lieu?: string }> }) {
  if (process.env.NODE_ENV === "production") notFound();
  const sp = await searchParams;
  const prefs = sp.prefs ?? DEFAUT.prefs;
  const confirmer = sp.confirmer ?? "";
  const { projet, libelles } = projetDeTest(prefs, confirmer);

  const adresse = sp.lieu ? await geocoder(sp.lieu) : null;
  const insee = (adresse?.citycode ?? sp.insee ?? DEFAUT.insee).trim();
  const hasAddress = Boolean(adresse) || sp.adresse !== "0";
  const communal = await buildCommuneDossier(insee, projet, { hasAddress, citycode: adresse?.citycode ?? null });
  if (!communal) notFound();

  // LE DOSSIER D'ADRESSE, par la fonction de production. En panne des sources, elle rend le dossier
  // communal (`status: "unavailable"`) : le bandeau le dit, et l'emblème le montre (périmètre commune).
  const parAdresse = adresse
    ? await assembleAddressDossier({
        project: projet, address: adresse, savedDpe: null,
        communeFacts: communal.moduleFacts, communeDossier: communal.dossier, hard: communal.hard,
        scopeKey: "prototype-fut87", permis: null, snapshotAutour: null, relation: null,
      })
    : null;
  const dossier = parAdresse?.dossier ?? communal.dossier;

  const requete = `insee=${encodeURIComponent(insee)}&prefs=${encodeURIComponent(prefs)}&adresse=${hasAddress ? "1" : "0"}${confirmer ? `&confirmer=${encodeURIComponent(confirmer)}` : ""}`;
  return (
    <main className={s.releve}>
      <Navbar />
      <BandeauPrototype>
        Prototype FUT-87 · direction « Le relevé » · dossier réel du moteur,{" "}
        {adresse
          ? <>dossier d&apos;adresse ({adresse.label}){parAdresse?.status === "unavailable" ? ", lecture d'adresse indisponible : repli communal" : ""}</>
          : <>commune {insee}</>}
        , projet de test ·{" "}
        <Link href={`/dev/fut87/avant/decision?${requete}`}>voir le rendu actuel</Link> · <Link href="/dev/fut87">index</Link>
        <nav aria-label="Cas de test" className={s.cas}>
          {CAS_DECISION.map((c) => <Link key={c.nom} href={`/dev/fut87/decision?${c.requete}`}>{c.nom}</Link>)}
        </nav>
      </BandeauPrototype>
      <DecisionReleve lecture={lireDossier(dossier)} projet={libelles} lienAvant={`/dev/fut87/avant/decision?${requete}`} />
    </main>
  );
}
