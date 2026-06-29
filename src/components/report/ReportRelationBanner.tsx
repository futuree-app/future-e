"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { usePostHog } from "posthog-js/react";

type Relation =
  | "current_residence"
  | "considering_living"
  | "information_only"
  | "unknown";

const LABEL: Record<Relation, string> = {
  current_residence: "Lecture adaptée à votre commune de résidence",
  considering_living: "Lecture adaptée à une commune que vous envisagez",
  information_only: "Lecture d'une commune que vous explorez",
  unknown: "Lecture d'une commune que vous explorez",
};

// Les deux relations que l'utilisateur peut poser explicitement (le reste est
// inféré). On reste sur le couple cœur ; information_only viendra plus tard.
const CHOICES: { value: Relation; label: string }[] = [
  { value: "current_residence", label: "J'y vis" },
  { value: "considering_living", label: "J'envisage d'y vivre" },
];

export function ReportRelationBanner({
  insee,
  relation,
  communeName,
}: {
  insee: string;
  relation: Relation;
  communeName: string | null;
}) {
  const router = useRouter();
  const posthog = usePostHog();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  async function choose(next: Relation) {
    if (next === relation) {
      setOpen(false);
      return;
    }
    setSaving(true);
    posthog?.capture("report_relation_corrected", {
      insee_code: insee,
      commune: communeName,
      from_relation: relation,
      to_relation: next,
    });
    try {
      const res = await fetch("/api/report-context", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ insee, relation: next }),
      });
      if (res.ok) {
        setOpen(false);
        router.refresh(); // re-rend la page serveur avec la relation corrigée
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-muted">
      <span className="inline-flex items-center gap-2">
        <span className="w-1 h-1 rounded-full bg-info/70 shrink-0" />
        {LABEL[relation]}
      </span>
      {!open ? (
        <button
          type="button"
          onClick={() => {
            posthog?.capture("report_relation_selector_opened", { insee_code: insee, relation });
            setOpen(true);
          }}
          className="underline underline-offset-2 text-muted hover:text-label transition-colors"
        >
          Modifier
        </button>
      ) : (
        <span className="inline-flex items-center gap-2">
          {CHOICES.map((c) => (
            <button
              key={c.value}
              type="button"
              disabled={saving}
              onClick={() => choose(c.value)}
              className={`px-2.5 py-1 rounded-md border text-[12px] transition-colors disabled:opacity-50 ${
                c.value === relation
                  ? "border-info/50 text-label"
                  : "border-white/[0.12] text-muted hover:text-label hover:border-white/25"
              }`}
            >
              {c.label}
            </button>
          ))}
        </span>
      )}
    </div>
  );
}
