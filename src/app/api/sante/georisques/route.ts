import { limiteParAdresse } from "@/lib/server/garde-appels-modele";

// ════════════════════════════════════════════════════════════════════════════════════════════
// GÉORISQUES RÉPOND-IL ? (24/09/2026)
//
// ── POURQUOI CETTE ROUTE EXISTE ──────────────────────────────────────────────────────────────
// Le 24/09, l'API de Géorisques a répondu « 503 » pendant des heures. Le produit s'est comporté
// comme il le devait (une mise à jour de dossier refusée plutôt qu'un dossier qui oublie l'argile),
// mais personne n'était prévenu : le porteur l'a appris par une capture d'écran.
//
// Un service de surveillance externe appelle cette route toutes les quelques minutes et envoie un
// courriel quand elle passe de 200 à 503, puis de 503 à 200. Externe, parce que l'offre Hobby de
// Vercel limite les tâches planifiées à une exécution par jour. C'est lui qui garde l'état et
// n'écrit qu'au changement : cette route ne fait que répondre à la question, sans base ni courriel.
//
// ── CE QU'ELLE TESTE ─────────────────────────────────────────────────────────────────────────
// Les deux interfaces dont le dossier dépend, sur un point de référence public (l'Hôtel de Ville de
// Paris, jamais l'adresse d'un client) :
//   — la v1, publique : les cavités (et, par le même service, les risques recensés) ;
//   — la v2, avec le jeton du produit : l'argile (et, par le même service, les plans de prévention).
// La v2 attrape aussi un jeton expiré ou révoqué, une panne qui serait de notre fait.
//
// ── TROIS ESSAIS AVANT DE CONCLURE ───────────────────────────────────────────────────────────
// Un échec isolé peut être un hoquet de quelques secondes. Deux contrôles ratés d'affilée auraient
// coûté une demi-heure de latence ; trois essais espacés de quelques secondes dans le même appel
// écartent le hoquet sans ce délai (proposition validée par le porteur).
// ════════════════════════════════════════════════════════════════════════════════════════════

const POINT = { latitude: 48.85661, longitude: 2.35222 };
const ESSAIS = 3;
const PAUSE_MS = 3000;
const DELAI_MS = 8000;

type Resultat = { ok: true } | { ok: false; detail: string };

async function interroger(url: string, headers: Record<string, string>): Promise<Resultat> {
  const controller = new AbortController();
  const minuteur = setTimeout(() => controller.abort(), DELAI_MS);
  try {
    const r = await fetch(url, { headers: { accept: "application/json", ...headers }, cache: "no-store", signal: controller.signal });
    // Un 200 qui ne serait pas du JSON (une page de maintenance servie en 200) n'est pas une réponse.
    if (!r.ok) return { ok: false, detail: `statut ${r.status}` };
    await r.json();
    return { ok: true };
  } catch (e) {
    return { ok: false, detail: e instanceof Error && e.name === "AbortError" ? `pas de réponse en ${DELAI_MS / 1000} s` : "réponse illisible" };
  } finally {
    clearTimeout(minuteur);
  }
}

async function avecEssais(test: () => Promise<Resultat>): Promise<Resultat> {
  let dernier: Resultat = { ok: false, detail: "non testé" };
  for (let i = 0; i < ESSAIS; i++) {
    dernier = await test();
    if (dernier.ok) return dernier;
    if (i < ESSAIS - 1) await new Promise((r) => setTimeout(r, PAUSE_MS));
  }
  return dernier;
}

export async function GET(request: Request) {
  // La route est publique, et chaque appel en déclenche jusqu'à six vers Géorisques : la limite par
  // adresse empêche qu'elle serve à marteler un service public. Un moniteur passe largement dessous.
  const tropVite = limiteParAdresse(request);
  if (tropVite) return tropVite;

  const token = process.env.GEORISQUES_API_TOKEN;
  const v1 = `https://georisques.gouv.fr/api/v1/cavites?latlon=${POINT.longitude},${POINT.latitude}&rayon=500`;
  const v2 = `https://www.georisques.gouv.fr/api/v2/rga?latitude=${POINT.latitude}&longitude=${POINT.longitude}&pageSize=1&pageNumber=0`;

  const [publique, authentifiee] = await Promise.all([
    avecEssais(() => interroger(v1, {})),
    token
      ? avecEssais(() => interroger(v2, { authorization: `Bearer ${token}` }))
      : Promise.resolve<Resultat>({ ok: false, detail: "jeton absent du serveur" }),
  ]);

  const ok = publique.ok && authentifiee.ok;
  return Response.json(
    {
      etat: ok ? "disponible" : "indisponible",
      interfaces: {
        publique: publique.ok ? "ok" : publique.detail,
        authentifiee: authentifiee.ok ? "ok" : authentifiee.detail,
      },
      verifieLe: new Date().toISOString(),
    },
    // 503 : c'est le code que le moniteur lit pour déclarer la panne.
    { status: ok ? 200 : 503, headers: { "cache-control": "no-store" } },
  );
}
