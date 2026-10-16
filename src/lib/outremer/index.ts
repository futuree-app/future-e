// FUT-104 · LE CLIMAT ULTRAMARIN, LIÉ AUX DONNÉES EMBARQUÉES. Point d'entrée du produit (serveur uniquement :
// `climat-outremer.json` pèse ~1,3 Mo, chargé une fois par processus, sans réseau).
//
// Contrat détaillé : docs/audits/2026-10-15-fut104-climat-outremer.md, § « Raccordement à FUT-50 ».
import climat from "@/data/outremer/climat-outremer.json";
import communes from "@/data/outremer/communes-outremer.json";
import { creerLecteurOutremer } from "./climat-outremer";

export * from "./climat-outremer";

export const { getEntiteOutremer, listerEntitesOutremer, lireClimatOutremer, couvertureOutremer } =
  creerLecteurOutremer(climat, communes);
