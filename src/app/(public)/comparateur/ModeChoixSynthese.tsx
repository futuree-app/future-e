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
  // Texte affiché = ce que la machine à écrire a déjà « tapé ». Le texte reçu du réseau vit
  // dans un buffer (ref) qui grandit par chunks ; la machine le rattrape, plus vite que le flux.
  const [shown, setShown] = useState("");
  const bufferRef = useRef("");   // tout le texte reçu du stream jusqu'ici (cible mouvante)
  const doneRef = useRef(false);  // le flux est terminé : la frappe peut s'arrêter une fois rattrapée

  // Effet flux : récupère la synthèse en streaming et l'empile dans le buffer.
  useEffect(() => {
    // Un AbortController par exécution d'effet (pas un garde useRef) : sous React Strict
    // Mode (dev), l'effet est monté/démonté/remonté ; un garde `ran` laisserait le seul
    // fetch lancé être annulé par le cleanup du 1er passage et la synthèse ne s'afficherait
    // jamais. Ici le 1er fetch est proprement avorté (sans fallback parasite) et le 2e
    // streame. En prod (pas de Strict Mode), un seul fetch : une génération par chargement.
    const ac = new AbortController();
    bufferRef.current = "";
    doneRef.current = false;

    (async () => {
      try {
        const res = await fetch("/api/comparateur-vie/synthesize-choix", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ communes, divergence }),
          signal: ac.signal,
        });
        if (!res.ok || !res.body) throw new Error("synthese indisponible");
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          bufferRef.current += decoder.decode(value, { stream: true });
        }
        doneRef.current = true;
      } catch {
        // Un abort (Strict Mode ou navigation) n'est pas une panne : pas de fallback.
        if (!ac.signal.aborted) {
          bufferRef.current = fallbackSynthese(communes);
          doneRef.current = true;
        }
      }
    })();

    return () => ac.abort();
  }, [communes, divergence]);

  // Effet machine à écrire : avance un index vers la fin du buffer. Quand on est loin derrière
  // (le réseau a livré un gros bloc d'un coup), on accélère pour se caler sur le flux ; au bord
  // vivant, on retombe à une cadence lisible, caractère par caractère. S'arrête une fois le flux
  // fini ET le buffer rattrapé.
  useEffect(() => {
    let i = 0;
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      const buf = bufferRef.current;
      const lag = buf.length - i;
      if (lag > 0) {
        // plus on est en retard, plus on tape de caractères d'un coup (rattrapage)
        const stride = Math.max(1, Math.floor(lag / 22));
        i = Math.min(buf.length, i + stride);
        setShown(buf.slice(0, i));
        timer = setTimeout(tick, 22);
      } else if (!doneRef.current) {
        // rattrapé mais le flux continue : on attend le prochain chunk
        timer = setTimeout(tick, 50);
      }
      // rattrapé + flux fini : on s'arrête (aucun nouveau timer).
    };
    // Reset de l'affichage hors corps d'effet (dans le callback) pour éviter un setState
    // synchrone : sur changement de communes, on repart d'une frappe vierge.
    timer = setTimeout(() => {
      setShown("");
      tick();
    }, 120);
    return () => clearTimeout(timer);
  }, [communes, divergence]);

  return (
    <section className="mt-10">
      <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-accent mb-3">En un coup d&apos;œil</p>
      <p className="text-[17px] leading-[1.7] text-label" style={{ textWrap: "pretty" }}>
        {shown ? bindOrphans(shown) : "futur•e regarde vos communes…"}
      </p>
    </section>
  );
}
