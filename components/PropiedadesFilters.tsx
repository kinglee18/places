'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useState, useEffect, useTransition, useRef } from 'react';
import { useTranslations } from 'next-intl';

interface FilterOptions {
  colonias: string[];
  tipos: string[];
  condiciones: string[];
  zonings: string[];
  energias: string[];
}

const inputStyle = (isPending: boolean): React.CSSProperties => ({
  background: 'var(--surface-2)', border: '1px solid var(--surface-border)', borderRadius: '10px',
  color: 'var(--foreground)', padding: '10px 14px', fontSize: '14px',
  fontFamily: "'Inter', sans-serif", outline: 'none',
  transition: 'border-color 0.2s, opacity 0.2s', width: '100%',
  opacity: isPending ? 0.6 : 1,
});

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '11px', fontWeight: 700,
  letterSpacing: '0.1em', color: 'var(--muted)', marginBottom: '6px',
};

export default function PropiedadesFilters({ filterOptions }: { filterOptions: FilterOptions }) {
  const t = useTranslations('PropiedadesFilters');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const get = (key: string) => searchParams.get(key) ?? '';
  const [localSearch, setLocalSearch] = useState(get('search'));

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setLocalSearch(get('search')); }, [searchParams]);

  const setParam = (key: string, value: string) => {
    const p = new URLSearchParams(searchParams.toString());
    value ? p.set(key, value) : p.delete(key);
    p.delete('page');
    startTransition(() => router.push(`${pathname}?${p.toString()}`));
  };

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setParam('search', localSearch), 350);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localSearch]);

  const hasFilters = ['search', 'colonia', 'tipo', 'modalidad', 'condicion', 'zoning', 'energia']
    .some(k => searchParams.get(k));

  const clearAll = () => {
    setLocalSearch('');
    const p = new URLSearchParams();
    const sort = searchParams.get('sort');
    if (sort) p.set('sort', sort);
    startTransition(() => router.push(`${pathname}?${p.toString()}`));
  };

  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--surface-border)', borderRadius: '16px',
      padding: '20px 24px', marginBottom: '36px',
      display: 'flex', flexDirection: 'column', gap: '14px',
      opacity: isPending ? 0.85 : 1, transition: 'opacity 0.2s',
    }}>
      {/* Row 1: search + sort */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'flex-end' }}>
        <div style={{ flex: '1 1 240px', minWidth: '200px' }}>
          <label style={labelStyle}>{t('labelSearch')}</label>
          <input
            value={localSearch}
            onChange={e => setLocalSearch(e.target.value)}
            placeholder={t('searchPlaceholder')}
            style={inputStyle(isPending)}
            onFocus={e => (e.target.style.borderColor = 'oklch(0.55 0.11 250)')}
            onBlur={e => (e.target.style.borderColor = 'var(--surface-border)')}
          />
        </div>
        <div style={{ flex: '1 1 160px', minWidth: '140px' }}>
          <label style={labelStyle}>{t('labelSortBy')}</label>
          <select
            value={get('sort') || 'recent'}
            onChange={e => setParam('sort', e.target.value)}
            style={{ ...inputStyle(isPending), cursor: 'pointer' }}
          >
            <option value="recent">{t('sortRecent')}</option>
            <option value="precio-asc">{t('sortPriceAsc')}</option>
            <option value="precio-desc">{t('sortPriceDesc')}</option>
            <option value="m2-asc">{t('sortM2Asc')}</option>
            <option value="m2-desc">{t('sortM2Desc')}</option>
          </select>
        </div>
      </div>

      {/* Row 2: categorical filters */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'flex-end' }}>
        <div style={{ flex: '1 1 130px', minWidth: '120px' }}>
          <label style={labelStyle}>{t('labelListingType')}</label>
          <select value={get('modalidad')} onChange={e => setParam('modalidad', e.target.value)} style={{ ...inputStyle(isPending), cursor: 'pointer' }}>
            <option value="">{t('all')}</option>
            <option value="rent">{t('forRent')}</option>
            <option value="sale">{t('forSale')}</option>
          </select>
        </div>
        <div style={{ flex: '1 1 160px', minWidth: '140px' }}>
          <label style={labelStyle}>{t('labelNeighborhood')}</label>
          <select value={get('colonia')} onChange={e => setParam('colonia', e.target.value)} style={{ ...inputStyle(isPending), cursor: 'pointer' }}>
            <option value="">{t('all')}</option>
            {filterOptions.colonias.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div style={{ flex: '1 1 180px', minWidth: '160px' }}>
          <label style={labelStyle}>{t('labelPropertyType')}</label>
          <select value={get('tipo')} onChange={e => setParam('tipo', e.target.value)} style={{ ...inputStyle(isPending), cursor: 'pointer' }}>
            <option value="">{t('all')}</option>
            {filterOptions.tipos.map(tp => <option key={tp} value={tp}>{tp}</option>)}
          </select>
        </div>
        {filterOptions.condiciones.length > 0 && (
          <div style={{ flex: '1 1 150px', minWidth: '130px' }}>
            <label style={labelStyle}>{t('labelCondition')}</label>
            <select value={get('condicion')} onChange={e => setParam('condicion', e.target.value)} style={{ ...inputStyle(isPending), cursor: 'pointer' }}>
              <option value="">{t('all')}</option>
              {filterOptions.condiciones.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        )}
        {filterOptions.zonings.length > 0 && (
          <div style={{ flex: '1 1 150px', minWidth: '130px' }}>
            <label style={labelStyle}>{t('labelZoning')}</label>
            <select value={get('zoning')} onChange={e => setParam('zoning', e.target.value)} style={{ ...inputStyle(isPending), cursor: 'pointer' }}>
              <option value="">{t('all')}</option>
              {filterOptions.zonings.map(z => <option key={z} value={z}>{z}</option>)}
            </select>
          </div>
        )}
        {filterOptions.energias.length > 0 && (
          <div style={{ flex: '1 1 140px', minWidth: '120px' }}>
            <label style={labelStyle}>{t('labelElectrical')}</label>
            <select value={get('energia')} onChange={e => setParam('energia', e.target.value)} style={{ ...inputStyle(isPending), cursor: 'pointer' }}>
              <option value="">{t('all')}</option>
              {filterOptions.energias.map(en => <option key={en} value={en}>{en}</option>)}
            </select>
          </div>
        )}
        {hasFilters && (
          <button
            onClick={clearAll}
            style={{ background: 'transparent', border: '1px solid var(--surface-border)', borderRadius: '10px', color: 'var(--muted)', padding: '10px 16px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#e53935'; e.currentTarget.style.color = '#e53935'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'oklch(0.9 0.015 250)'; e.currentTarget.style.color = 'oklch(0.45 0.03 260)'; }}
          >
            {t('clearAll')}
          </button>
        )}
      </div>
    </div>
  );
}
