// Tests for lib/formatPrice.ts
// Verifies the currency formatter returns correct output for various inputs.

import { formatPrice } from '@/lib/formatPrice';

describe('formatPrice', () => {
  it('should return a formatted MXN string for a large number', () => {
    const result = formatPrice('3200000');
    expect(result).toBe('$3,200,000 MXN');
  });

  it('should return \u2014 for the string "0"', () => {
    expect(formatPrice('0')).toBe('—');
  });

  it('should return \u2014 for an empty string', () => {
    expect(formatPrice('')).toBe('—');
  });

  it('should format 1000 correctly', () => {
    const result = formatPrice('1000');
    expect(result).toBe('$1,000 MXN');
  });

  it('should return \u2014 for a non-numeric string', () => {
    expect(formatPrice('abc')).toBe('—');
  });

  it('should format a maintenance price correctly', () => {
    const result = formatPrice('4500');
    expect(result).toBe('$4,500 MXN');
  });
});
