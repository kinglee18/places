'use client';

import Link from 'next/link';
import { useState } from 'react';

interface PricingStrings {
  basicTag: string;
  basicPrice: string;
  basicSubtitle: string;
  basicDesc: string;
  basicFeatures: string[];
  basicCta: string;
  proTag: string;
  proPrice: string;
  proUnit: string;
  proSubtitle: string;
  proDesc: string;
  proFeatures: Array<{ label: string; isPro: boolean }>;
  proCta: string;
}

export default function PricingCards({ s }: { s: PricingStrings }) {
  const [hovered, setHovered] = useState<'basic' | 'pro' | null>(null);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '28px' }}>
      {/* ── BASIC PLAN ── */}
      <div
        className="card"
        onMouseEnter={() => setHovered('basic')}
        onMouseLeave={() => setHovered(null)}
        style={{
          padding: '40px',
          background: hovered === 'basic' ? 'rgba(0,245,160,0.03)' : 'var(--plan-basic-bg)',
          borderColor: hovered === 'basic' ? 'rgba(0,245,160,0.4)' : 'var(--plan-basic-border)',
          transition: 'all 0.3s ease',
        }}
      >
        <div style={{ marginBottom: '32px' }}>
          <span className="tag tag-accent" style={{ marginBottom: '20px', display: 'inline-flex' }}>
            ✓ {s.basicTag}
          </span>
          <div style={{ fontSize: '44px', fontWeight: 900, letterSpacing: '-0.02em', marginBottom: '4px' }}>
            {s.basicPrice}
          </div>
          <div style={{ color: 'var(--muted)', fontSize: '15px' }}>{s.basicSubtitle}</div>
        </div>

        <div style={{ borderTop: '1px solid var(--plan-basic-border)', paddingTop: '28px', marginBottom: '36px' }}>
          <p style={{ color: 'var(--muted)', fontSize: '15px', marginBottom: '24px', lineHeight: 1.6 }}>
            {s.basicDesc}
          </p>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {s.basicFeatures.map((label, i) => (
              <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', fontSize: '15px' }}>
                <span style={{ color: 'var(--accent)', fontSize: '16px', flexShrink: 0, marginTop: '2px' }}>✓</span>
                <span style={{ color: 'var(--foreground)' }}>{label}</span>
              </li>
            ))}
          </ul>
        </div>

        <Link href="/registro" className="btn-secondary" style={{
          display: 'block', textAlign: 'center', width: '100%',
          padding: '14px', borderRadius: '12px', fontSize: '15px',
        }}>
          {s.basicCta}
        </Link>
      </div>

      {/* ── PRO PLAN ── */}
      <div
        className="card"
        onMouseEnter={() => setHovered('pro')}
        onMouseLeave={() => setHovered(null)}
        style={{
          padding: '40px',
          background: 'linear-gradient(160deg, rgba(124,58,237,0.12) 0%, rgba(0,180,216,0.06) 100%)',
          borderColor: hovered === 'pro' ? '#7c3aed' : 'rgba(124,58,237,0.45)',
          position: 'relative',
          overflow: 'hidden',
          transition: 'all 0.3s ease',
        }}
      >
        <div style={{
          position: 'absolute', top: '-60px', right: '-60px',
          width: '200px', height: '200px',
          background: 'radial-gradient(circle, rgba(124,58,237,0.25) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ marginBottom: '32px', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <span className="tag tag-pro">⚡ {s.proTag}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '4px' }}>
            <div style={{ fontSize: '44px', fontWeight: 900, letterSpacing: '-0.02em' }}>
              <span className="gradient-text-accent">{s.proPrice}</span>
            </div>
            <span style={{ color: 'var(--muted)', fontSize: '15px' }}>{s.proUnit}</span>
          </div>
          <div style={{ color: 'var(--muted)', fontSize: '15px' }}>{s.proSubtitle}</div>
        </div>

        <div style={{ borderTop: '1px solid rgba(124,58,237,0.25)', paddingTop: '28px', marginBottom: '36px' }}>
          <p style={{ color: 'var(--muted)', fontSize: '15px', marginBottom: '24px', lineHeight: 1.6 }}>
            {s.proDesc}
          </p>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {s.proFeatures.map((item, i) => (
              <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', fontSize: '15px' }}>
                <span style={{
                  color: item.isPro ? '#a78bfa' : 'var(--accent)',
                  fontSize: '16px', flexShrink: 0, marginTop: '2px',
                }}>
                  {item.isPro ? '⚡' : '✓'}
                </span>
                <span>{item.label}</span>
              </li>
            ))}
          </ul>
        </div>

        <Link href="/registro" className="btn-primary" style={{
          display: 'block', textAlign: 'center', width: '100%',
          padding: '14px', borderRadius: '12px', fontSize: '15px',
          background: 'linear-gradient(135deg, oklch(0.235 0.07 265), oklch(0.55 0.11 250))',
          boxShadow: '0 8px 30px oklch(0.235 0.07 265 / 0.3)',
        }}>
          {s.proCta}
        </Link>
      </div>
    </div>
  );
}
