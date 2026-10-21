// Le retour Stripe n'est pas une preuve. Seule une activation acceptée par le
// serveur permet la navigation ; les droits restent attribués par le webhook.
export async function attendreTerritoire(
  insee: string,
  signal: AbortSignal,
  requete: typeof fetch = fetch,
  pause: (ms: number) => Promise<void> = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
): Promise<"ouvert" | "attente" | "connexion" | "erreur" | "annule"> {
  for (let essai = 0; essai < 15; essai++) {
    if (signal.aborted) return "annule";
    try {
      const res = await requete("/api/territoire/activer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ insee, rapportComplet: true }),
        signal: AbortSignal.any([signal, AbortSignal.timeout(5000)]),
      });
      if (signal.aborted) return "annule";
      if (res.ok && (await res.json()).success === true) return "ouvert";
      if (res.status === 401) return "connexion";
      if (res.status !== 403 && res.status !== 503) return "erreur";
    } catch {
      if (signal.aborted) return "annule";
      // Une coupure réseau ne doit ni ouvrir le rapport ni perdre le parcours.
    }
    if (essai < 14) await pause(2000);
  }
  return signal.aborted ? "annule" : "attente";
}
