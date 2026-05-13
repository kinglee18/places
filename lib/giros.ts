/**
 * Giros (business categories) catalog used by the /buscar pre-flight.
 *
 * Each giro maps to:
 *  - keywords:               quick local detection from the user description
 *  - competitionCategories:  Google-Places-derived categories (must match those in
 *                            app/api/nearby-places/route.ts) so we can look them up
 *                            inside `properties.competition_data.within_*` to compute
 *                            saturation around a property.
 *  - m2Hint:                 conservative defaults so preflight can size-filter
 *                            without waiting for the AI prompt.
 */

export interface GiroDef {
  id: string;
  label: string;
  emoji: string;
  keywords: string[];
  /** Categories in competition_data that count as "similar business". */
  competitionCategories: string[];
  /** Minimum reasonable m² so preflight does not discard decent spaces. */
  m2Hint: { min: number; ideal: number };
}

export const GIROS: GiroDef[] = [
  {
    id: 'cafeteria',
    label: 'Coffee Shop',
    emoji: '☕',
    keywords: ['cafe', 'cafetera', 'cafeteria', 'café', 'cafetería', 'barista', 'espresso', 'capuchino', 'latte', 'pasteleria', 'pastelería', 'reposteria', 'repostería', 'panaderia', 'panadería', 'bakery'],
    competitionCategories: ['Café', 'Café / Bakery'],
    m2Hint: { min: 25, ideal: 60 },
  },
  {
    id: 'restaurante',
    label: 'Restaurant',
    emoji: '🍽️',
    keywords: ['restaurante', 'restaurant', 'cocina', 'comida corrida', 'fonda', 'taqueria', 'taquería', 'tacos', 'parrilla', 'asador', 'menu del dia', 'menú', 'chef', 'comedor'],
    competitionCategories: ['Restaurant'],
    m2Hint: { min: 50, ideal: 120 },
  },
  {
    id: 'bar',
    label: 'Bar / Pub',
    emoji: '🍺',
    keywords: ['bar', 'cantina', 'cerveceria', 'cervecería', 'mezcaleria', 'mezcalería', 'pulqueria', 'pulquería', 'cocteles', 'cocteleria', 'cocktail', 'antro', 'night club'],
    competitionCategories: ['Bar'],
    m2Hint: { min: 50, ideal: 110 },
  },
  {
    id: 'estetica',
    label: 'Hair Salon',
    emoji: '💇',
    keywords: ['estetica', 'estética', 'estilista', 'salon de belleza', 'salón de belleza', 'tijeras', 'corte de pelo', 'cabello', 'tinte', 'manicure', 'pedicure', 'uñas', 'unas', 'barberia', 'barbería', 'barber'],
    competitionCategories: ['Beauty / Salon'],
    m2Hint: { min: 20, ideal: 45 },
  },
  {
    id: 'gimnasio',
    label: 'Gym / Wellness',
    emoji: '💪',
    keywords: ['gimnasio', 'gym', 'crossfit', 'pilates', 'yoga', 'spinning', 'entrenamiento', 'pesas', 'box', 'wellness', 'spa', 'masajes'],
    competitionCategories: ['Gym / Wellness'],
    m2Hint: { min: 80, ideal: 180 },
  },
  {
    id: 'farmacia',
    label: 'Pharmacy',
    emoji: '💊',
    keywords: ['farmacia', 'pharmacy', 'medicamentos', 'botica', 'drugstore'],
    competitionCategories: ['Pharmacy'],
    m2Hint: { min: 30, ideal: 70 },
  },
  {
    id: 'abarrotes',
    label: 'Grocery / Convenience',
    emoji: '🛒',
    keywords: ['abarrotes', 'tiendita', 'miscelanea', 'misceláneas', 'minisuper', 'mini super', 'conveniencia', 'supermercado', 'super', 'grocery'],
    competitionCategories: ['Convenience / Grocery'],
    m2Hint: { min: 25, ideal: 70 },
  },
  {
    id: 'tienda_ropa',
    label: 'Clothing Store',
    emoji: '👕',
    keywords: ['ropa', 'boutique', 'moda', 'vestidos', 'sastreria', 'sastrería', 'maquiladora', 'taller de costura', 'costura', 'maquina de coser', 'máquina de coser'],
    competitionCategories: ['Clothing / Retail', 'Retail'],
    m2Hint: { min: 25, ideal: 60 },
  },
  {
    id: 'retail_general',
    label: 'Retail / Store',
    emoji: '🏪',
    keywords: ['tienda', 'retail', 'venta al publico', 'showroom', 'punto de venta', 'mercancia'],
    competitionCategories: ['Retail', 'Clothing / Retail'],
    m2Hint: { min: 25, ideal: 80 },
  },
  {
    id: 'lavanderia',
    label: 'Laundry',
    emoji: '🧺',
    keywords: ['lavanderia', 'lavandería', 'tintoreria', 'tintorería', 'lavado de ropa', 'laundry'],
    competitionCategories: ['Laundry'],
    m2Hint: { min: 30, ideal: 60 },
  },
  {
    id: 'clinica',
    label: 'Clinic / Practice',
    emoji: '🩺',
    keywords: ['consultorio', 'medico', 'médico', 'doctora', 'clinica', 'clínica', 'dentista', 'odontologo', 'odontólogo', 'dental', 'fisioterapia', 'psicologo', 'psicólogo', 'nutriologo', 'nutriólogo'],
    competitionCategories: ['Medical / Clinic'],
    m2Hint: { min: 25, ideal: 60 },
  },
  {
    id: 'oficina',
    label: 'Office / Coworking',
    emoji: '💼',
    keywords: ['oficina', 'coworking', 'despacho', 'corporativo', 'home office'],
    competitionCategories: [],
    m2Hint: { min: 30, ideal: 80 },
  },
];

export const GIRO_BY_ID: Record<string, GiroDef> = Object.fromEntries(
  GIROS.map((g) => [g.id, g])
);

/** Normalize text: lowercase + strip accents. */
function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

/**
 * Quick keyword-based category detection.
 * Returns null if confidence is insufficient; caller should fall back to AI.
 */
export function detectGiroByKeywords(text: string): GiroDef | null {
  if (!text) return null;
  const haystack = ' ' + norm(text) + ' ';

  // Hit count per category: higher specificity when multiple keywords match (e.g. "coffee machine" + "pastry" → Coffee Shop).
  const scores = new Map<string, number>();

  for (const giro of GIROS) {
    let hits = 0;
    for (const kw of giro.keywords) {
      const needle = ' ' + norm(kw);
      // Boundary match: starts with space. Avoids partials like "barber" → "bar".
      if (haystack.includes(needle)) hits += 1;
    }
    if (hits > 0) scores.set(giro.id, hits);
  }

  if (scores.size === 0) return null;

  const [bestId] = [...scores.entries()].sort((a, b) => b[1] - a[1])[0];
  return GIRO_BY_ID[bestId] ?? null;
}

/**
 * Given a property with competition_data and a category, returns how many
 * similar businesses exist nearby.
 */
export interface SaturationCount {
  competidores_500m: number;
  competidores_2km: number;
  nivel: 'low' | 'medium' | 'high';
}

export function computeSaturation(
  giro: GiroDef,
  competitionData: { within_500m?: Record<string, number>; within_2km?: Record<string, number> } | null | undefined
): SaturationCount {
  const c500: Record<string, number> = competitionData?.within_500m ?? {};
  const c2k: Record<string, number> = competitionData?.within_2km ?? {};

  let near = 0;
  let far = 0;
  for (const cat of giro.competitionCategories) {
    near += c500[cat] ?? 0;
    far += c2k[cat] ?? 0;
  }

  let nivel: SaturationCount['nivel'] = 'low';
  if (near >= 4 || far >= 10) nivel = 'high';
  else if (near >= 2 || far >= 5) nivel = 'medium';

  return { competidores_500m: near, competidores_2km: far, nivel };
}
