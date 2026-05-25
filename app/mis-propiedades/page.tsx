import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/auth';
import { getSupabase } from '@/lib/supabase';
import NavHeader from '@/components/NavHeader';
import PropertyActions from '@/components/PropertyActions';

interface Property {
  id: string;
  colonia: string;
  tipo_local: string;
  m2: number;
  modalidad: string | null;
  precio_inmueble: number | null;
  photo_urls: string[];
  is_published: boolean;
  created_at: string;
}

function formatPrice(val: number | null): string {
  if (!val) return '—';
  return `$${val.toLocaleString('en-US')} MXN`;
}

export default async function MisPropiedadesPage() {
  const session = await auth();
  if (!session?.user?.email) redirect('/login');

  const { data: properties } = await getSupabase()
    .from('properties')
    .select('id, colonia, tipo_local, m2, modalidad, precio_inmueble, photo_urls, is_published, created_at')
    .eq('user_email', session.user.email)
    .order('created_at', { ascending: false });

  const items = (properties ?? []) as Property[];

  return (
    <main style={{ minHeight: '100vh', background: '#06060f', color: '#f0f0f8', fontFamily: "'Inter', sans-serif" }}>
      <NavHeader />

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '48px 24px 80px' }}>

        {/* Header */}
        <div style={{ marginBottom: 36 }}>
          <h1 style={{ fontSize: 'clamp(24px, 3vw, 36px)', fontWeight: 900, letterSpacing: '-0.02em', marginBottom: 8 }}>
            My properties
          </h1>
          <p style={{ color: 'oklch(0.45 0.03 260)', fontSize: 14 }}>
            {items.length} registered propert{items.length !== 1 ? 'ies' : 'y'}
          </p>
        </div>

        {items.length === 0 ? (
          /* Empty state */
          <div style={{
            textAlign: 'center', padding: '80px 24px',
            border: '1px dashed #1e1e35', borderRadius: 20,
            background: '#0a0a18',
          }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>🏬</div>
            <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 10 }}>No properties yet</h2>
            <p style={{ color: 'oklch(0.45 0.03 260)', marginBottom: 28, maxWidth: 400, margin: '0 auto 28px' }}>
              Register your first commercial space and start analyzing your market.
            </p>
            <Link href="/registro" style={{
              background: 'linear-gradient(135deg, #00f5a0, #00b4d8)',
              color: '#06060f', padding: '13px 28px', borderRadius: 12,
              fontWeight: 700, fontSize: 14, textDecoration: 'none',
              boxShadow: '0 6px 24px rgba(0,245,160,0.25)',
            }}>
              + Register property
            </Link>
          </div>
        ) : (
          <>
            {/* Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20, marginBottom: 32 }}>
              {items.map(p => (
                <div key={p.id} style={{
                  background: '#0d0d1a', border: '1px solid #1e1e35',
                  borderRadius: 16, overflow: 'hidden',
                  transition: 'border-color 0.2s, transform 0.2s',
                }}>
                  {/* Photo */}
                  <div style={{ height: 160, background: 'oklch(0.96 0.01 250)', position: 'relative', overflow: 'hidden' }}>
                    {p.photo_urls?.[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.photo_urls[0]}
                        alt={p.tipo_local}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, opacity: 0.3 }}>
                        🏬
                      </div>
                    )}
                    {/* Status badge */}
                    <span style={{
                      position: 'absolute', top: 10, right: 10,
                      fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 100,
                      background: p.is_published ? 'rgba(0,245,160,0.15)' : 'rgba(107,107,154,0.2)',
                      border: `1px solid ${p.is_published ? 'rgba(0,245,160,0.4)' : 'rgba(107,107,154,0.3)'}`,
                      color: p.is_published ? 'oklch(0.55 0.11 250)' : '#9090b8',
                    }}>
                      {p.is_published ? 'Published' : 'Unpublished'}
                    </span>
                  </div>

                  {/* Info */}
                  <div style={{ padding: '16px 18px' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: 'oklch(0.55 0.11 250)', marginBottom: 4, textTransform: 'uppercase' }}>
                      {p.colonia}
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4, color: '#f0f0f8' }}>
                      {p.tipo_local}
                    </div>
                    <div style={{ fontSize: 12, color: 'oklch(0.45 0.03 260)', marginBottom: 14 }}>
                      {p.m2} m²{p.modalidad ? ` · ${p.modalidad === 'rent' ? 'Rent' : 'Sale'}` : ''}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 15, fontWeight: 800, color: '#f0f0f8' }}>
                        {formatPrice(p.precio_inmueble)}
                      </span>
                      <Link href={`/propiedades/${p.id}`} style={{
                        fontSize: 12, fontWeight: 700, color: '#9090b8',
                        border: '1px solid rgba(144,144,184,0.25)', borderRadius: 8,
                        padding: '5px 12px', textDecoration: 'none',
                      }}>
                        Ver →
                      </Link>
                    </div>
                    <PropertyActions id={p.id} isPublished={p.is_published} />
                  </div>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div style={{ textAlign: 'center' }}>
              <Link href="/registro" style={{
                background: 'linear-gradient(135deg, #00f5a0, #00b4d8)',
                color: '#06060f', padding: '13px 28px', borderRadius: 12,
                fontWeight: 700, fontSize: 14, textDecoration: 'none',
                boxShadow: '0 6px 24px rgba(0,245,160,0.25)',
              }}>
                + Register another property
              </Link>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
