// Adresse BAN sélectionnée = objet ATOMIQUE transmis au serveur (pas trois champs
// désynchronisables). Le même objet sert à sauvegarder l'adresse, lancer les risques au
// point, chercher les DPE et générer le snapshot.
export type SelectedBanAddress = {
  banId: string;
  label: string;
  housenumber?: string;
  street?: string;
  postcode: string;
  city: string;
  citycode: string;
  latitude: number;
  longitude: number;
  type: string | null;
};

export function validateSelectedBanAddress(input: unknown): SelectedBanAddress | null {
  if (typeof input !== "object" || input === null) return null;
  const o = input as Record<string, unknown>;
  const str = (v: unknown): v is string => typeof v === "string" && v.length > 0;
  if (!str(o.banId) || !str(o.label) || !str(o.postcode) || !str(o.city) || !str(o.citycode)) {
    return null;
  }
  const lat = o.latitude, lon = o.longitude;
  if (typeof lat !== "number" || typeof lon !== "number") return null;
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return null;
  return {
    banId: o.banId, label: o.label, postcode: o.postcode, city: o.city, citycode: o.citycode,
    latitude: lat, longitude: lon,
    type: typeof o.type === "string" ? o.type : null,
    housenumber: typeof o.housenumber === "string" ? o.housenumber : undefined,
    street: typeof o.street === "string" ? o.street : undefined,
  };
}
