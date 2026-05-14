'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useState, useEffect, useTransition, useRef } from 'react';

interface FilterOptions {
  colonias: string[];
  tipos: string[];
  condiciones: string[];
  zonings: string[];
  energias: string[];
}

const inputStyle = (isPending: boolean): React.CSSProperties => ({
  background: '#12122a', border: '1px solid #2a2a4a', borderRadius: '10px',
  color: '#e0e0ff', padding: '10px 14px', fontSize: '14px',
  fontFamily: "'Inter', sans-serif", outline: 'none',
  transition: 'border-color 0.2s, opacity 0.2s', width: '100%',
  opacity: isPending ? 0.6 : 1,
});

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '11px', fontWeight: 700,
  letterSpacing: '0.1em', color: '#6b6b9a', marginBottom: '6px',
};

export default function PropiedadesFilters({ filterOptions }: { filterOptions: FilterOptions }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const get = (key: string) => searchParams.get(key) ?? '';
  const [localSearch, setLocalSearch] = useState(get('search'));

  // Sync localSearch if browser back/forward changes URL
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
      background: '#0d0d1a', border: '1px solid #1e1e35', borderRadius: '16px',
      padding: '20px 24px', marginBottom: '36px',
      display: 'flex', flexDirection: 'column', gap: '14px',
      opacity: isPending ? 0.85 : 1, transition: 'opacity 0.2s',
    }}>
      {/* Row 1: search + sort */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'flex-end' }}>
        <div style={{ flex: '1 1 240px', minWidth: '200px' }}>
          <label style={labelStyle}>SEARCH</label>
          <input
            value={localSearch}
            onChange={e => setLocalSearch(e.target.value)}
            placeholder="Neighborhood, street, description..."
            style={inputStyle(isPending)}
            onFocus={e => (e.target.style.borderColor = '#00f5a0')}
            onBlur={e => (e.target.style.borderColor = '#2a2a4a')}
          />
        </div>
        <div style={{ flex: '1 1 160px', minWidth: '140px' }}>
          <label style={labelStyle}>SORT BY</label>
          <select
            value={get('sort') || 'recent'}
            onChange={e => setParam('sort', e.target.value)}
            style={{ ...inputStyle(isPending), cursor: 'pointer' }}
          >
            <option value="recent">Most recent</option>
            <option value="precio-asc">Price: lowest first</option>
            <option value="precio-desc">Price: highest first</option>
            <option value="m2-asc">Size: smallest first</option>
            <option value="m2-desc">Size: largest first</option>
          </select>
        </div>
      </div>

      {/* Row 2: categorical filters */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'flex-end' }}>
        <div style={{ flex: '1 1 130px', minWidth: '120px' }}>
          <label style={labelStyle}>LISTING TYPE</label>
          <select value={get('modalidad')} onChange={e => setParam('modalidad', e.target.value)} style={{ ...inputStyle(isPending), cursor: 'pointer' }}>
            <option value="">All</option>
            <option value="rent">For rent</option>
            <option value="sale">For sale</option>
          </select>
        </div>
        <div style={{ flex: '1 1 160px', minWidth: '140px' }}>
          <label style={labelStyle}>NEIGHBORHOOD</label>
          <select value={get('colonia')} onChange={e => setParam('colonia', e.target.value)} style={{ ...inputStyle(isPending), cursor: 'pointer' }}>
            <option value="">All</option>
            {filterOptions.colonias.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div style={{ flex: '1 1 180px', minWidth: '160px' }}>
          <label style={labelStyle}>PROPERTY TYPE</label>
          <select value={get('tipo')} onChange={e => setParam('tipo', e.target.value)} style={{ ...inputStyle(isPending), cursor: 'pointer' }}>
            <option value="">All</option>
            {filterOptions.tipos.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        {filterOptions.condiciones.length > 0 && (
          <div style={{ flex: '1 1 150px', minWidth: '130px' }}>
            <label style={labelStyle}>CONDITION</label>
            <select value={get('condicion')} onChange={e => setParam('condicion', e.target.value)} style={{ ...inputStyle(isPending), cursor: 'pointer' }}>
              <option value="">All</option>
              {filterOptions.condiciones.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        )}
        {filterOptions.zonings.length > 0 && (
          <div style={{ flex: '1 1 150px', minWidth: '130px' }}>
            <label style={labelStyle}>ZONING</label>
            <select value={get('zoning')} onChange={e => setParam('zoning', e.target.value)} style={{ ...inputStyle(isPending), cursor: 'pointer' }}>
              <option value="">All</option>
              {filterOptions.zonings.map(z => <option key={z} value={z}>{z}</option>)}
            </select>
          </div>
        )}
        {filterOptions.energias.length > 0 && (
          <div style={{ flex: '1 1 140px', minWidth: '120px' }}>
            <label style={labelStyle}>ELECTRICAL</label>
            <select value={get('energia')} onChange={e => setParam('energia', e.target.value)} style={{ ...inputStyle(isPending), cursor: 'pointer' }}>
              <option value="">All</option>
              {filterOptions.energias.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
        )}
        {hasFilters && (
          <button
            onClick={clearAll}
            style={{ background: 'transparent', border: '1px solid #2a2a4a', borderRadius: '10px', color: '#6b6b9a', padding: '10px 16px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#ff6b6b'; e.currentTarget.style.color = '#ff6b6b'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#2a2a4a'; e.currentTarget.style.color = '#6b6b9a'; }}
          >
            ✕ Clear all
          </button>
        )}
      </div>
    </div>
  );
}
