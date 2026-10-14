"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { relireLaPage } from "@/components/interaction/relire-la-page";
import type { AddressObjective, AddressRelation } from "@/lib/relation-au-lieu";
import { OBJECTIF_LIBELLE, RELATION_LIBELLE, noteDuCouple } from "@/lib/dossier-contexte-ecran";

// ════════════════════════════════════════════════════════════════════════════════════════════
// « CE BIEN » : déclarer ou corriger, après l'achat, pourquoi on examine ce logement et son lien avec
// lui (FUT-10). Une ligne `address_dossiers`, jamais le projet : changer l'un ne touche pas l'autre.
//
// CE QU'UNE MODIFICATION FAIT, ET NE FAIT PAS. Elle est enregistrée tout de suite ; la version figée du
// dossier, elle, ne bouge pas. Si la modification change la voix ou les gestes, le bandeau au-dessus du
// verdict le dit et propose la mise à jour (`AnalyseAncienProjet`, raison « lien ») : l'ancienne
// version reste datée et consultable. Aucune génération ne part d'ici.
//
// Même forme que le bloc de relation à la commune de « Votre projet » (deux sous-contrôles, une
// sauvegarde par geste) : le stockage n'offre pas d'atomicité entre les deux, on n'en prétend pas.
// ════════════════════════════════════════════════════════════════════════════════════════════

const RELATIONS: AddressRelation[] = ["lives_here", "studying"];
const OBJECTIFS = Object.keys(OBJECTIF_LIBELLE) as AddressObjective[];

function classePuce(actif: boolean): string {
  return actif
    ? "rounded-lg px-3.5 py-2 text-[13px] font-medium bg-accent text-canvas border border-transparent transition-colors disabled:opacity-40"
    : "rounded-lg px-3.5 py-2 text-[13px] text-muted bg-[var(--bg-elev-2)] border border-[var(--border-2)] hover:text-label hover:border-white/25 transition-colors disabled:opacity-40";
}

export function LienAvecCeBien({
  dossierId, adresse, relationInitiale, objectifInitial,
}: {
  dossierId: string;
  adresse: string;
  relationInitiale: AddressRelation | null;
  objectifInitial: AddressObjective | null;
}) {
  const [relation, setRelation] = useState(relationInitiale);
  const [objectif, setObjectif] = useState(objectifInitial);
  const [busy, setBusy] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const router = useRouter();

  // Re-cliquer la valeur active l'efface : « je préfère ne plus le préciser » reste toujours possible.
  async function enregistrer(champ: "relation" | "objectif", valeur: string | null) {
    setBusy(true);
    setErreur(null);
    try {
      const res = await fetch("/api/dossier/relation", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dossierId, [champ]: valeur }),
      });
      const corps = (await res.json().catch(() => null)) as { relation?: AddressRelation | null; objectif?: AddressObjective | null } | null;
      if (!res.ok || !corps) throw new Error(String(res.status));
      // Confirmé par le serveur, et seulement là : l'écran montre ce qui est enregistré.
      setRelation(corps.relation ?? null);
      setObjectif(corps.objectif ?? null);
      relireLaPage(router);
    } catch {
      setErreur("Enregistrement impossible pour le moment. Réessayez.");
    } finally {
      setBusy(false);
    }
  }

  const note = noteDuCouple(objectif, relation);

  return (
    <section aria-labelledby="lien-bien-titre" className="glass rounded-2xl p-6 md:p-7">
      <p className="font-mono text-[11px] tracking-[0.14em] uppercase text-ghost mb-2">Ce bien</p>
      <h2 id="lien-bien-titre" className="text-[16px] text-label leading-snug mb-5">{adresse}</h2>

      <p className="font-mono text-[10px] tracking-[0.1em] uppercase text-ghost mb-2.5">
        Pourquoi vous l&apos;examinez
      </p>
      <div className="flex gap-2 flex-wrap mb-5">
        {OBJECTIFS.map((o) => (
          <button
            key={o} type="button" disabled={busy} aria-pressed={objectif === o}
            onClick={() => enregistrer("objectif", objectif === o ? null : o)}
            className={classePuce(objectif === o)}
          >
            {OBJECTIF_LIBELLE[o]}
          </button>
        ))}
      </div>

      <p className="font-mono text-[10px] tracking-[0.1em] uppercase text-ghost mb-2.5">
        Votre lien actuel avec ce bien
      </p>
      <div className="flex gap-2 flex-wrap">
        {RELATIONS.map((r) => (
          <button
            key={r} type="button" disabled={busy} aria-pressed={relation === r}
            onClick={() => enregistrer("relation", relation === r ? null : r)}
            className={classePuce(relation === r)}
          >
            {RELATION_LIBELLE[r]}
          </button>
        ))}
      </div>

      {note && <p className="text-[12.5px] leading-[1.5] text-ghost mt-3">{note}</p>}
      {objectif == null && relation == null && (
        <p className="text-[12.5px] leading-[1.5] text-ghost mt-3">
          Rien n&apos;est déclaré pour ce bien : le dossier ne suppose ni que vous y vivez, ni que vous
          vous apprêtez à l&apos;acheter ou à le louer.
        </p>
      )}
      <p className="text-[12.5px] leading-[1.5] text-ghost mt-3">
        Re-cliquez une réponse pour l&apos;effacer. Votre projet n&apos;est pas modifié.
      </p>
      {erreur && <p className="text-danger text-[13px] mt-2.5" role="alert">{erreur}</p>}
    </section>
  );
}
