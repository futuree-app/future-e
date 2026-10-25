// Pression agricole / phytosanitaire (V1.6), partagée par la construction de l'index et par la règle de
// périmètre des indicateurs ADEME (FUT-109, scripts/lib/perimetre-ademe.mjs). Logique pure.
// pression = intensité de traitement (IFT) × prévalence agricole (part SAU).
// Une commune très traitée mais peu agricole (ville avec une vigne) a une
// pression modérée ; une commune très agricole et très traitée (Champagne) max.
// C'est une PRESSION territoriale, pas une exposition des habitants.
function lerpAnchors(anchors, x) {
  if (x == null) return null;
  if (x <= anchors[0][0]) return anchors[0][1];
  const last = anchors[anchors.length - 1];
  if (x >= last[0]) return last[1];
  for (let i = 1; i < anchors.length; i++) {
    if (x <= anchors[i][0]) {
      const [x0, y0] = anchors[i - 1];
      const [x1, y1] = anchors[i];
      return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
    }
  }
  return last[1];
}
const IFT_INTENSITY = [[0, 0], [1, 15], [2, 35], [3.5, 55], [6, 80], [10, 95], [16, 100]];
const SAU_PREVALENCE = [[0, 0.25], [5, 0.45], [15, 0.7], [30, 0.9], [50, 1]];
export function pressionAgricole(ift_t, p_sau) {
  if (ift_t == null) return null;
  const intensity = lerpAnchors(IFT_INTENSITY, ift_t);
  const prev = lerpAnchors(SAU_PREVALENCE, p_sau ?? 0);
  return Math.round(intensity * prev);
}
