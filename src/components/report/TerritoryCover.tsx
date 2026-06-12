"use client";

// Bande de couverture éditoriale du module Quartier — V1 « illustration ».
//
// Bande ultra-wide discrète posée sous le titre, avant la synthèse : pose
// l'identité du territoire sans concurrencer la synthèse qui se génère.
//
// - Cartouche HTML au-dessus (catégorie · horizon), dynamique — aucun texte
//   n'est gravé dans l'image.
// - Image résolue par chaîne de repli : bespoke commune → archétype catégorie
//   → générique. Le repli se fait à la volée via onError.
// - Fondu vers le canvas + bordure pour s'enchâsser dans le thème sombre.

import { useState } from "react";
import type { TerritoryMood } from "@/lib/territory-mood";

// Map type éditorial → nom de fichier d'archétype (fallback).
const ARCHETYPE: Record<TerritoryMood["type"], string> = {
  littoral_atlantique: "littoral_atlantique",
  mediterraneen: "mediterranee",
  montagne: "montagne",
  plaine: "plaine",
};

export function TerritoryCover({ mood }: { mood: TerritoryMood }) {
  // Chaîne de repli : commune sur-mesure → archétype catégorie → générique.
  const sources = [
    mood.inseeCode ? `/covers/bespoke/${mood.inseeCode}.webp` : null,
    `/covers/archetypes/${ARCHETYPE[mood.type]}.webp`,
    `/covers/archetypes/all.webp`,
  ].filter(Boolean) as string[];

  const [idx, setIdx] = useState(0);
  const [failed, setFailed] = useState(false);

  return (
    <figure style={{ margin: 0 }}>
      {/* bande ultra-fine */}
      <div
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: "5 / 1",
          borderRadius: 14,
          overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.1)",
          background: mood.colors.skyHorizon, // placeholder coloré pendant le chargement
        }}
      >
        {!failed && (
          <img
            src={sources[idx]}
            alt={`Illustration éditoriale de ${mood.title}`}
            onError={() => {
              if (idx + 1 < sources.length) setIdx((i) => i + 1);
              else setFailed(true);
            }}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "50% 62%",
              display: "block",
            }}
          />
        )}
        {/* fondu vers le canvas (bas + côtés) pour s'intégrer au fond sombre */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            background:
              "linear-gradient(to bottom, rgba(6,8,18,0) 62%, rgba(6,8,18,0.34) 100%)," +
              "linear-gradient(to right, rgba(6,8,18,0.22), rgba(6,8,18,0) 14%, rgba(6,8,18,0) 86%, rgba(6,8,18,0.22))",
          }}
        />
      </div>
    </figure>
  );
}
