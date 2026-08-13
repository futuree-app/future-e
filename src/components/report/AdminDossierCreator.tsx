"use client";

import { useState } from "react";
import { AddressAutocomplete } from "@/components/report/AddressAutocomplete";

// Créer un dossier sans passer par Stripe, pour éprouver les écrans.
//
// Il ne contourne rien : il produit une VRAIE ligne, identique à celle que le webhook créera. Tout
// ce qui suit est donc le parcours d'un acheteur. C'est la raison de ne pas avoir donné au compte
// de service un laissez-passer de lecture, qui l'aurait fait voyager sur un chemin que personne
// d'autre n'emprunte, et lui aurait caché exactement les endroits où ça casse.
export function AdminDossierCreator() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div
      className="rounded-xl p-6 mb-8"
      style={{ border: "1px dashed var(--border-2)", background: "var(--bg-elev)" }}
    >
      <p className="font-mono text-[11px] tracking-[0.12em] uppercase text-ghost mb-3">
        Outil de test
      </p>
      <AddressAutocomplete
        placeholder="Créer un dossier sur une adresse"
        showModify={false}
        onSelect={async (a) => {
          if (!a.id || !a.citycode || a.latitude == null || a.longitude == null) {
            setError("Adresse sans coordonnées exploitables.");
            return;
          }
          setBusy(true);
          setError(null);
          try {
            const res = await fetch("/api/admin/dossier", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                address: {
                  banId: a.id, label: a.label, postcode: a.postcode ?? "", city: a.city ?? "",
                  citycode: a.citycode, latitude: a.latitude, longitude: a.longitude, type: a.type,
                },
              }),
            });
            const payload = (await res.json().catch(() => null)) as
              | { dossierId?: string; error?: string }
              | null;
            if (!res.ok || !payload?.dossierId) {
              throw new Error(payload?.error ?? `Erreur ${res.status}`);
            }
            // LE MÊME CHEMIN QU'UN ACHETEUR, et c'est la raison d'être de cet outil : il produit
            // une vraie ligne pour que le porteur rencontre les mêmes écrans, les mêmes états
            // dégradés et les mêmes refus. Depuis le 13/08/2026, un achat mène au hub, où se lit la
            // décision ; y arriver par le module Logement ferait tester un parcours que personne
            // d'autre n'emprunte.
            window.location.href = `/rapport/dossiers/ouvrir?id=${encodeURIComponent(payload.dossierId)}&vers=dossier`;
          } catch (err) {
            setError(err instanceof Error ? err.message : "Création impossible.");
          } finally {
            setBusy(false);
          }
        }}
      />
      {busy && (
        <p className="font-mono text-[12px] text-ghost mt-3">Création…</p>
      )}
      {error && (
        <p className="font-mono text-[12px] mt-3" style={{ color: "var(--red, #f87171)" }}>
          {error}
        </p>
      )}
    </div>
  );
}
