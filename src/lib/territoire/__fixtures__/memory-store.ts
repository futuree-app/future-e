// Un stockage de synthèses EN MÉMOIRE, pour les tests (FUT-6, FUT-76). Sans base ni réseau.
// La LECTURE passe par la vraie fonction du stockage (`lireLigneSynthese`) : ce faux ne réinvente pas
// ce qu'est un repli, une origine inconnue ou une génération en cours.
import type { HashedSnapshot } from "../../facts/contract.ts";
import { lireLigneSynthese, type StoredSynthesis, type TerritoireStore } from "../../server/territoire-facts-store.ts";

export type LigneMemoire = { status: "pending" | "ready"; text?: string; origin?: string | null; lease_until: string | null };

export function memoryStore(snapshot: HashedSnapshot) {
  const rows = new Map<string, LigneMemoire>();
  const lire = (r: LigneMemoire, now: Date) => lireLigneSynthese({ status: r.status, text: r.text, origin: r.origin, lease_until: r.lease_until }, now);
  const store: TerritoireStore = {
    async persistSnapshot() { return true; },
    async readSnapshot() { return snapshot; },
    async readSynthesis(key, now): Promise<StoredSynthesis | null> {
      const r = rows.get(key);
      return r ? lire(r, now) : null;
    },
    async readSyntheses(keys) {
      const out = new Map();
      for (const k of keys) {
        const r = rows.get(k);
        const e = r ? lire(r, new Date()) : null;
        if (e?.status === "ready") out.set(k, { text: e.text, origin: e.origin });
      }
      return out;
    },
    async claim(row, now) {
      const r = rows.get(row.key);
      const etat = r ? lire(r, now) : null;
      const libre = !r || etat === null || (etat.status === "failed" && (!etat.retryAt || etat.retryAt.getTime() <= now.getTime()));
      if (!libre) return false;
      rows.set(row.key, { ...r, status: "pending", lease_until: new Date(now.getTime() + 150_000).toISOString() });
      return true;
    },
    async complete(key, r) { rows.set(key, { status: "ready", text: r.text, origin: r.origin, lease_until: null }); },
    async fail(key, r) { rows.set(key, { status: "ready", text: r.text, origin: "deterministic", lease_until: r.retryAt.toISOString() }); },
    async release(key) { if (rows.get(key)?.status === "pending") rows.delete(key); },
  };
  return { store, rows };
}
