// LES DOSSIERS DE TEST DES PAGES DE DÉVELOPPEMENT (FUT-87, FUT-91). Serveur uniquement, lecture seule.
//
// Un dossier communal par `buildCommuneDossier` (mêmes données et règles que `/dev/dossier`), ou un
// DOSSIER D'ADRESSE réel : l'adresse est géocodée par la BAN puis assemblée par la fonction de
// production `assembleAddressDossier`. Aucune écriture, aucun compte. N'y passer que l'adresse d'un
// bâtiment public.
import "server-only";
import { buildCommuneDossier } from "@/lib/decision/territory-facts";
import { assembleAddressDossier } from "@/lib/server/assemble-address-dossier";
import type { ResolvedAddress } from "@/lib/server/logement-decision-data";
import { urlRechercheBan } from "@/lib/geocodeur-ban";
import type { Dossier } from "@/lib/decision/decision-fact";
import { DEFAUT, projetDeTest } from "./projet-de-test";

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

export type DossierDeTest = {
  dossier: Dossier;
  insee: string;
  libelles: string[];
  adresse: ResolvedAddress | null;
  /** `unavailable` : la lecture d'adresse a échoué, le dossier communal fait office (production). */
  statutAdresse: "done" | "unavailable" | null;
};

export async function dossierDeTest(sp: { insee?: string; prefs?: string; adresse?: string; confirmer?: string; lieu?: string }): Promise<DossierDeTest | null> {
  const { projet, libelles } = projetDeTest(sp.prefs ?? DEFAUT.prefs, sp.confirmer ?? "");
  const adresse = sp.lieu ? await geocoder(sp.lieu) : null;
  const insee = (adresse?.citycode ?? sp.insee ?? DEFAUT.insee).trim();
  const communal = await buildCommuneDossier(insee, projet, { hasAddress: Boolean(adresse) || sp.adresse !== "0", citycode: adresse?.citycode ?? null });
  if (!communal) return null;
  if (!adresse) return { dossier: communal.dossier, insee, libelles, adresse: null, statutAdresse: null };
  const r = await assembleAddressDossier({
    project: projet, address: adresse, savedDpe: null,
    communeFacts: communal.moduleFacts, communeDossier: communal.dossier, hard: communal.hard,
    scopeKey: "dev-test", permis: null, snapshotAutour: null, relation: null,
  });
  return { dossier: r.dossier, insee, libelles, adresse, statutAdresse: r.status };
}
