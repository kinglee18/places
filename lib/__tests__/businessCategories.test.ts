import {
  BUSINESS_CATEGORIES,
  businessCategoryLabel,
  isBusinessCategoryId,
  normalizeRecommendations,
} from '../businessCategories';

describe('isBusinessCategoryId', () => {
  it('accepts every taxonomy id', () => {
    for (const c of BUSINESS_CATEGORIES) {
      expect(isBusinessCategoryId(c.id)).toBe(true);
    }
  });

  it('rejects unknown or non-string values', () => {
    expect(isBusinessCategoryId('restaurant')).toBe(false);
    expect(isBusinessCategoryId('')).toBe(false);
    expect(isBusinessCategoryId(null)).toBe(false);
    expect(isBusinessCategoryId(42)).toBe(false);
  });
});

describe('businessCategoryLabel', () => {
  it('returns locale-specific labels', () => {
    expect(businessCategoryLabel('taco', 'es')).toBe('Taquería');
    expect(businessCategoryLabel('taco', 'en')).toBe('Taco restaurant');
  });

  it('falls back to the raw id when unknown', () => {
    expect(businessCategoryLabel('unknown_id', 'es')).toBe('unknown_id');
  });
});

describe('normalizeRecommendations', () => {
  const use = (id: string | undefined, uso = 'Name', razon = 'Reason') => ({ id, uso, razon });

  it('keeps a valid best pick and dedupes recommended ids', () => {
    const result = normalizeRecommendations({
      mejor_uso: use('taco'),
      otros_usos: [use('pizza'), use('taco'), use('gimnasio')],
    });
    expect(result.bestUse).toBe('taco');
    expect(result.recommendedUses).toEqual(['taco', 'pizza', 'gimnasio']);
    expect(result.otrosUsos.map(u => u.id)).toEqual(['pizza', 'gimnasio']);
  });

  it('normalizes ids with casing and whitespace', () => {
    const result = normalizeRecommendations({
      mejor_uso: use(' Taco '),
      otros_usos: [use('Tienda Ropa')],
    });
    expect(result.bestUse).toBe('taco');
    expect(result.recommendedUses).toEqual(['taco', 'tienda_ropa']);
  });

  it('promotes the first valid secondary when the best id is invalid', () => {
    const result = normalizeRecommendations({
      mejor_uso: use('banco'),
      otros_usos: [use('made_up'), use('sushi'), use('bar')],
    });
    expect(result.bestUse).toBe('sushi');
    expect(result.mejorUso?.uso).toBe('Name');
    // demoted best pick is kept as a textual suggestion without id
    expect(result.otrosUsos.some(u => u.id === undefined)).toBe(true);
    expect(result.recommendedUses).toEqual(['sushi', 'bar']);
  });

  it('returns null columns when nothing validates', () => {
    const result = normalizeRecommendations({
      mejor_uso: use('banco'),
      otros_usos: [use('made_up')],
    });
    expect(result.bestUse).toBeNull();
    expect(result.recommendedUses).toBeNull();
    expect(result.mejorUso?.uso).toBe('Name');
  });

  it('tolerates missing or malformed input', () => {
    const result = normalizeRecommendations({});
    expect(result.mejorUso).toBeNull();
    expect(result.otrosUsos).toEqual([]);
    expect(result.bestUse).toBeNull();
    expect(result.recommendedUses).toBeNull();
  });
});
