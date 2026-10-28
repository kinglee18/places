// Closed taxonomy of business categories the AI analysis must pick from.
// Ids are stable snake_case values persisted in properties.best_use /
// properties.recommended_uses — never rename an id once shipped.

export type CategoryGroup = 'food' | 'food_service' | 'service' | 'retail' | 'health' | 'other';

export interface BusinessCategory {
  id: string;
  group: CategoryGroup;
  labelEn: string;
  labelEs: string;
}

export const BUSINESS_CATEGORIES: BusinessCategory[] = [
  // Google Maps restaurant categories
  { id: 'argentinian', group: 'food', labelEn: 'Argentinian restaurant', labelEs: 'Restaurante argentino' },
  { id: 'asian',       group: 'food', labelEn: 'Asian restaurant',       labelEs: 'Restaurante asiático' },
  { id: 'chinese',     group: 'food', labelEn: 'Chinese restaurant',     labelEs: 'Restaurante chino' },
  { id: 'french',      group: 'food', labelEn: 'French restaurant',      labelEs: 'Restaurante francés' },
  { id: 'hamburger',   group: 'food', labelEn: 'Hamburger restaurant',   labelEs: 'Hamburguesas' },
  { id: 'italian',     group: 'food', labelEn: 'Italian restaurant',     labelEs: 'Restaurante italiano' },
  { id: 'japanese',    group: 'food', labelEn: 'Japanese restaurant',    labelEs: 'Restaurante japonés' },
  { id: 'mexican',     group: 'food', labelEn: 'Mexican restaurant',     labelEs: 'Restaurante mexicano' },
  { id: 'pizza',       group: 'food', labelEn: 'Pizza restaurant',       labelEs: 'Pizzería' },
  { id: 'seafood',     group: 'food', labelEn: 'Seafood restaurant',     labelEs: 'Mariscos' },
  { id: 'spanish',     group: 'food', labelEn: 'Spanish restaurant',     labelEs: 'Restaurante español' },
  { id: 'steak',       group: 'food', labelEn: 'Steak house',            labelEs: 'Cortes / Asador' },
  { id: 'sushi',       group: 'food', labelEn: 'Sushi restaurant',       labelEs: 'Sushi' },
  { id: 'taco',        group: 'food', labelEn: 'Taco restaurant',        labelEs: 'Taquería' },
  // Food venues that are not cuisines
  { id: 'cafeteria',   group: 'food_service', labelEn: 'Coffee shop / Bakery', labelEs: 'Cafetería / Panadería' },
  { id: 'bar',         group: 'food_service', labelEn: 'Bar / Pub',            labelEs: 'Bar' },
  // Non-food giros (ids match lib/giros.ts)
  { id: 'estetica',       group: 'service', labelEn: 'Hair salon / Beauty',    labelEs: 'Estética / Salón' },
  { id: 'gimnasio',       group: 'service', labelEn: 'Gym / Wellness',         labelEs: 'Gimnasio / Bienestar' },
  { id: 'farmacia',       group: 'health',  labelEn: 'Pharmacy',               labelEs: 'Farmacia' },
  { id: 'abarrotes',      group: 'retail',  labelEn: 'Grocery / Convenience',  labelEs: 'Abarrotes / Minisúper' },
  { id: 'tienda_ropa',    group: 'retail',  labelEn: 'Clothing store',         labelEs: 'Tienda de ropa' },
  { id: 'retail_general', group: 'retail',  labelEn: 'Retail store',           labelEs: 'Tienda / Retail' },
  { id: 'lavanderia',     group: 'service', labelEn: 'Laundry',                labelEs: 'Lavandería' },
  { id: 'clinica',        group: 'health',  labelEn: 'Clinic / Practice',      labelEs: 'Clínica / Consultorio' },
  { id: 'oficina',        group: 'other',   labelEn: 'Office / Coworking',     labelEs: 'Oficina / Coworking' },
];

export const BUSINESS_CATEGORY_BY_ID: Record<string, BusinessCategory> = Object.fromEntries(
  BUSINESS_CATEGORIES.map(c => [c.id, c]),
);

export function isBusinessCategoryId(id: unknown): id is string {
  return typeof id === 'string' && id in BUSINESS_CATEGORY_BY_ID;
}

export function businessCategoryLabel(id: string, locale: string): string {
  const c = BUSINESS_CATEGORY_BY_ID[id];
  return c ? (locale === 'es' ? c.labelEs : c.labelEn) : id;
}

// Maps the CUISINE_KEYWORDS gap labels stored in competition_data.food_subcategories
// to taxonomy ids, so the analyze prompt can tie detected gaps to valid ids.
// Labels without a taxonomy equivalent are simply absent.
export const GAP_LABEL_TO_CATEGORY_IDS: Record<string, string[]> = {
  'Chinese':              ['chinese'],
  'Japanese / Sushi':     ['japanese', 'sushi'],
  'Italian / Pizza':      ['italian', 'pizza'],
  'Seafood':              ['seafood'],
  'Burgers':              ['hamburger'],
  'Tacos / Street food':  ['taco', 'mexican'],
  'Coffee / Specialty':   ['cafeteria'],
  'Bakery / Pastry':      ['cafeteria'],
  'Argentinian':          ['argentinian'],
  'French':               ['french'],
  'Spanish':              ['spanish'],
  'Steak':                ['steak'],
};

export interface AiUse {
  id?: string;
  uso: string;
  razon: string;
}

export interface NormalizedRecommendations {
  mejorUso: AiUse | null;
  otrosUsos: AiUse[];
  bestUse: string | null;
  recommendedUses: string[] | null;
}

const normalizeId = (v: unknown): string =>
  typeof v === 'string' ? v.trim().toLowerCase().replace(/\s+/g, '_') : '';

const asUse = (v: unknown): AiUse | null => {
  if (!v || typeof v !== 'object') return null;
  const { id, uso, razon } = v as Record<string, unknown>;
  if (typeof uso !== 'string' || typeof razon !== 'string') return null;
  const cleanId = normalizeId(id);
  return isBusinessCategoryId(cleanId) ? { id: cleanId, uso, razon } : { uso, razon };
};

// Validates the model output against the taxonomy. Invalid ids are dropped;
// if the best pick has no valid id, the first valid secondary is promoted.
// When nothing validates, bestUse/recommendedUses stay null (columns unset)
// while the textual recommendations are still returned for the JSONB blob.
export function normalizeRecommendations(raw: {
  mejor_uso?: unknown;
  otros_usos?: unknown;
}): NormalizedRecommendations {
  let mejorUso = asUse(raw.mejor_uso);
  let otrosUsos = (Array.isArray(raw.otros_usos) ? raw.otros_usos : [])
    .map(asUse)
    .filter((u): u is AiUse => u !== null);

  if (!mejorUso?.id) {
    const promotedIdx = otrosUsos.findIndex(u => u.id);
    if (promotedIdx >= 0) {
      const [promoted] = otrosUsos.splice(promotedIdx, 1);
      if (mejorUso) otrosUsos.unshift(mejorUso);
      mejorUso = promoted;
    }
  }

  otrosUsos = otrosUsos.filter(u => u.id !== mejorUso?.id || !u.id);

  const bestUse = mejorUso?.id ?? null;
  const recommendedUses = bestUse
    ? [...new Set([bestUse, ...otrosUsos.map(u => u.id).filter((id): id is string => !!id)])]
    : null;

  return { mejorUso, otrosUsos, bestUse, recommendedUses };
}
