const LABELS_ES: Record<string, string> = {
  // Business categories (from TYPE_TO_CATEGORY)
  'Café':                    'Café',
  'Café / Bakery':           'Café / Panadería',
  'Restaurant':              'Restaurante',
  'Bar':                     'Bar',
  'Gym / Wellness':          'Gimnasio / Bienestar',
  'Pharmacy':                'Farmacia',
  'Convenience / Grocery':   'Abarrotes / Minisuper',
  'Beauty / Salon':          'Estética / Salón',
  'Clothing / Retail':       'Ropa / Boutique',
  'Retail':                  'Tienda',
  'Laundry':                 'Lavandería',
  'Medical / Clinic':        'Médico / Clínica',

  // Food subcategory gaps (from CUISINE_KEYWORDS)
  'Chinese':                 'Comida china',
  'Japanese / Sushi':        'Japonés / Sushi',
  'Italian / Pizza':         'Italiana / Pizza',
  'Seafood':                 'Mariscos',
  'Vegan / Vegetarian':      'Vegano / Vegetariano',
  'Korean BBQ':              'Barbacoa coreana',
  'Thai':                    'Tailandesa',
  'Indian':                  'India',
  'Burgers':                 'Hamburguesas',
  'Breakfast / Brunch':      'Desayuno / Brunch',
  'Ice cream / Desserts':    'Helados / Postres',
  'Tacos / Street food':     'Tacos / Comida callejera',
  'Coffee / Specialty':      'Café de especialidad',
  'Bakery / Pastry':         'Panadería / Repostería',

  // Property type (tipo_local)
  'Street-facing (with storefront)': 'Local frontal',
  'Inside commercial plaza':         'Local en plaza',
  'Corner unit':                     'Local en esquina',
  'Basement / Semi-basement':        'Sótano / semi-sótano',
  'Market stall':                    'Puesto de mercado',

  // Condition (estado_conservacion)
  'New':                     'Nuevo',
  'Excellent':               'Excelente',
  'Good':                    'Bueno',
  'Fair':                    'Regular',
  'Needs renovation':        'Necesita renovación',

  // Zoning (uso_suelo)
  'Commercial':              'Comercial',
  'Industrial':              'Industrial',
  'Mixed-use':               'Uso mixto',
  'Residential with commercial': 'Residencial con comercial',
  'Not specified':           'No especificado',

  // Electrical (tipo_energia)
  'Single-phase':            'Monofásica',
  'Three-phase':             'Trifásica',
};

export function categoryLabel(raw: string, locale: string): string {
  if (locale !== 'es') return raw;
  return LABELS_ES[raw] ?? raw;
}
