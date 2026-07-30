"use client";

import { useEffect, useState } from "react";
import posthog from "posthog-js";
import { AddressAutocomplete } from "@/components/report/AddressAutocomplete";
import type { BanAddressResult } from "@/lib/ban";

type Candidate = {
  banId: string;
  label: string;
  city: string | null;
  postcode: string | null;
  latitude: number;
  longitude: number;
  distanceM: number;
};

type Warning =
  | { code: "no_exact_dpe_found" }
  | { code: "no_parcel_reading" }
  | { code: "source_unavailable"; source: "ademe" | "cadastre" };

type Outcome =
  | {
      status: "qualified";
      warnings: Warning[];
      quote: {
        status: "final" | "provisional";
        basePriceCents: number;
        amountDueCents: number;
        territoryDeductionCents?: number;
      };
    }
  | { status: "needs_precision"; candidates: Candidate[] }
  | { status: "unsupported_at_launch" };

// Ce que la qualification DIT, et ce qu'elle ne dit jamais. Elle nomme la MATIÈRE et les manques
// propres à cette adresse. Aucune valeur, aucun état, aucun verdict : sinon elle devient le
// produit gratuit qui rend le payant inutile.
//
// « le diagnostic EXACT n'a pas été retrouvé » plutôt que « aucun diagnostic » : la sonde cherche
// par identifiant BAN, qui couvre une adresse sur cinq, tandis que le dossier retrouvera peut-être
// un candidat par proximité. La formule reste vraie dans les deux cas, donc elle ne sera jamais
// démentie quelques minutes après l'achat.
const WARNING_COPY: Record<string, string> = {
  no_exact_dpe_found:
    "Le diagnostic exact de ce logement n'a pas été retrouvé. Le dossier le dira, et lira le bâtiment autrement.",
  no_parcel_reading:
    "La lecture parcellaire n'est pas disponible ici. Les risques au point et les alentours le restent.",
  source_unavailable_ademe:
    "Nous n'avons pas pu interroger les diagnostics à l'instant. Ce n'est pas une absence de diagnostic.",
  source_unavailable_cadastre:
    "Nous n'avons pas pu vérifier la parcelle à l'instant.",
};

const EUR = (cents: number) => `${Math.round(cents / 100)} €`;

export function DossierQualificationClient() {
  const [address, setAddress] = useState<BanAddressResult | null>(null);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Le dénominateur de tout le parcours. Émis au montage, une seule fois : le tableau de
  // dépendances vide est le contrat, sinon un rendu de plus double le volume mesuré.
  useEffect(() => {
    posthog.capture("address_qualification_viewed");
  }, []);

  async function qualify(a: BanAddressResult) {
    if (!a.id || !a.citycode || a.latitude == null || a.longitude == null) {
      setError("Adresse sans coordonnées exploitables.");
      return;
    }
    setBusy(true);
    setError(null);
    setOutcome(null);
    setAddress(a);
    try {
      const res = await fetch("/api/dossier/qualification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: {
            banId: a.id,
            label: a.label,
            postcode: a.postcode ?? "",
            city: a.city ?? "",
            citycode: a.citycode,
            latitude: a.latitude,
            longitude: a.longitude,
            type: a.type,
          },
        }),
      });
      if (res.status === 503) {
        setError("Vérification indisponible pour l'instant. Réessayez dans un moment.");
        return;
      }
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const payload = (await res.json()) as Outcome;
      setOutcome(payload);
      posthog.capture("address_qualification_result", {
        status: payload.status,
        insee: a.citycode,
        ban_feature_type: a.type,
        warnings: payload.status === "qualified" ? payload.warnings.map((w) => w.code) : [],
      });
    } catch {
      setError("Qualification impossible pour l'instant.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <AddressAutocomplete
        placeholder="Saisissez une adresse"
        onSelect={qualify}
        onModify={() => {
          setOutcome(null);
          setError(null);
        }}
      />

      {busy && (
        <p className="text-[14px] text-muted mt-6">
          Nous vérifions ce que nous savons de cette adresse.
        </p>
      )}

      {error && <p className="text-[14px] text-muted mt-6">{error}</p>}

      {outcome?.status === "qualified" && address && (
        <div className="glass rounded-xl p-6 mt-8">
          <p className="text-[16.5px] text-label leading-snug mb-4">{address.label}</p>

          {outcome.warnings.length > 0 && (
            <ul className="mb-6 list-none p-0" style={{ display: "grid", gap: 10 }}>
              {outcome.warnings.map((w) => (
                <li
                  key={w.code + ("source" in w ? w.source : "")}
                  className="text-[14px] text-muted leading-relaxed"
                >
                  {WARNING_COPY["source" in w ? `${w.code}_${w.source}` : w.code]}
                </li>
              ))}
            </ul>
          )}

          <p className="text-[15px] text-label mb-1">{EUR(outcome.quote.amountDueCents)}</p>

          {outcome.quote.status === "provisional" && (
            <p className="font-mono text-[12px] text-ghost mb-5">
              14 € sont déduits si vous avez déjà la lecture de cette commune.
            </p>
          )}
          {outcome.quote.status === "final" && (outcome.quote.territoryDeductionCents ?? 0) > 0 && (
            <p className="font-mono text-[12px] text-ghost mb-5">
              Vous avez déjà la lecture de cette commune : 14 € déduits.
            </p>
          )}

          <a
            href={`/checkout/dossier?banId=${encodeURIComponent(address.id!)}&label=${encodeURIComponent(address.label)}&insee=${encodeURIComponent(address.citycode!)}`}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-accent/[0.12] text-accent text-[14px] no-underline border border-accent/[0.25]"
            onClick={() =>
              posthog.capture("address_checkout_viewed", {
                insee: address.citycode,
                amount_due_cents: outcome.quote.amountDueCents,
              })
            }
          >
            Créer mon dossier
          </a>
        </div>
      )}

      {outcome?.status === "needs_precision" && (
        <div className="glass rounded-xl p-6 mt-8">
          <p className="text-[16.5px] text-label leading-snug mb-2">
            Nous n&apos;avons pas encore identifié le bien avec assez de précision.
          </p>
          <p className="text-[14px] text-muted leading-relaxed mb-5">
            {outcome.candidates.length > 0
              ? "Cette adresse désigne une voie. Voici les adresses numérotées les plus proches."
              : "Saisissez une adresse précise dans cette commune, avec son numéro."}
          </p>

          {outcome.candidates.length > 0 && (
            <div style={{ display: "grid", gap: 10 }}>
              {outcome.candidates.map((c) => (
                <button
                  key={c.banId}
                  type="button"
                  className="text-left px-5 py-3 rounded-lg bg-white/[0.05] text-label text-[14px] border border-white/[0.08] cursor-pointer"
                  onClick={() =>
                    qualify({
                      id: c.banId,
                      label: c.label,
                      city: c.city ?? address?.city ?? null,
                      citycode: address?.citycode ?? null,
                      postcode: c.postcode ?? address?.postcode ?? null,
                      type: "housenumber",
                      // LES COORDONNÉES DU CANDIDAT, jamais celles de la feature grossière.
                      // Reprendre le point de la voie sonderait le cadastre au centroïde tout en
                      // affichant l'adresse d'un numéro précis.
                      latitude: c.latitude,
                      longitude: c.longitude,
                    })
                  }
                >
                  {c.label}
                  <span className="font-mono text-[12px] text-ghost">
                    {" "}
                    · à {Math.round(c.distanceM)} m
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {outcome?.status === "unsupported_at_launch" && address && (
        <div className="glass rounded-xl p-6 mt-8">
          <p className="text-[16.5px] text-label leading-snug mb-3">
            Nous ne pouvons pas encore identifier ce bien assez précisément.
          </p>
          <p className="text-[14px] text-muted leading-relaxed mb-5">
            Cette adresse ne porte pas de point de bâtiment fiable. Pour éviter d&apos;analyser la
            mauvaise parcelle ou de mesurer les alentours depuis un point approximatif, nous
            préférons ne pas vous vendre ce dossier.
          </p>
          {/* Offert comme une INFORMATION, jamais comme le bouton dominant : un refus qui débouche
              sur une vente mise en avant devient une technique commerciale, et il perd exactement
              ce qui le rendait crédible. */}
          {address.citycode && (
            <a
              href={`/territoire/${address.citycode}`}
              className="text-[14px] text-muted underline"
              onClick={() =>
                posthog.capture("address_qualification_exit", { choice: "territory_14" })
              }
            >
              Lire ce que devient {address.city ?? "cette commune"}
            </a>
          )}
        </div>
      )}
    </div>
  );
}
