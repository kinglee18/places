'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';

function PublicadoContent() {
  const params = useSearchParams();
  const id = params.get('id');

  return (
    <main style={{ minHeight: '100vh', background: '#0a0a14', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
      <div style={{ maxWidth: 480, textAlign: 'center' }}>
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: 'linear-gradient(135deg, #00f5a0, #00b4d8)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 36, margin: '0 auto 24px',
          boxShadow: '0 0 60px rgba(0,245,160,0.35)',
        }}>✓</div>

        <h1 style={{ color: '#e0e0ff', fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 28, marginBottom: 12 }}>
          Listing published!
        </h1>
        <p style={{ color: '#8888aa', fontFamily: "'DM Mono', monospace", fontSize: 14, lineHeight: 1.8, marginBottom: 32 }}>
          Your property is now visible on the marketplace with verified badge,<br />
          competition analysis and downloadable report active.
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          {id && (
            <Link href={`/propiedades/${id}`} style={{
              background: 'linear-gradient(135deg, #00f5a0, #00b4d8)',
              color: '#0a0a14', padding: '12px 24px', borderRadius: 8,
              fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 14,
              textDecoration: 'none',
            }}>
              View my listing
            </Link>
          )}
          <Link href="/propiedades" style={{
            border: '1px solid #2a2a4a', color: '#e0e0ff', padding: '12px 24px', borderRadius: 8,
            fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 14,
            textDecoration: 'none',
          }}>
            View marketplace
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function PublicadoPage() {
  return (
    <Suspense>
      <PublicadoContent />
    </Suspense>
  );
}
