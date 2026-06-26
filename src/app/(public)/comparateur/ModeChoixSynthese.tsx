"use client";

import { useEffect, useRef, useState } from "react";
import { bindOrphans } from "@/lib/typography";

type Commune = { nom: string; region: string | null; identite: string; compromis: string; distinctive: string | null };
type Props = { communes: Commune[]; divergence: { domine: boolean; dominatorInsee: string | null } | null };

// Repli déterministe si l'IA est indisponible : on assemble identité + compromis, sobrement.
function fallbackSynthese(communes: Commune[]): string {
  const phrases = communes.map((c) => `${c.nom} : ${c.identite} ${c.compromis}`.trim());
  return `Ces communes ne proposent pas la même vie. ${phrases.join(" ")} Aucune ne réunit tout : à vous de voir quel compromis vous ressemble le plus.`;
}

export function ModeChoixSynthese({ communes, divergence }: Props) {
  const [text, setText] = useState("");
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return; // une seule génération par montage (cf. spec 2.4)
    ran.current = true;
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/comparateur-vie/synthesize-choix", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ communes, divergence }),
        });
        if (!res.ok || !res.body) throw new Error("synthese indisponible");
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let acc = "";
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          if (cancelled) return;
          acc += decoder.decode(value, { stream: true });
          setText(acc);
        }
      } catch {
        if (!cancelled) setText(fallbackSynthese(communes));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [communes, divergence]);

  return (
    <section className="mt-10">
      <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-accent mb-3">En un coup d&apos;œil</p>
      <p className="text-[17px] leading-[1.7] text-label" style={{ textWrap: "pretty" }}>
        {text ? bindOrphans(text) : "futur•e regarde vos communes…"}
      </p>
    </section>
  );
}
