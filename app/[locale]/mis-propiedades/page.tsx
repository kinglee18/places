import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/auth';
import { getSupabase } from '@/lib/supabase';
import NavHeader from '@/components/NavHeader';
import PropertyActions from '@/components/PropertyActions';
import { getTranslations } from 'next-intl/server';

interface Property {
  id: string;
  colonia: string;
  tipo_local: string;
  m2: number;
  modalidad: string | null;
  precio_inmueble: number | null;
  photo_urls: string[];
  is_published: boolean;
  expires_at: string | null;
  created_at: string;
}

function formatPrice(val: number | null): string {
  if (!val) return '—';
  return `$${val.toLocaleString('en-US')} MXN`;
}

export default async function MisPropiedadesPage() {
  const session = await auth();
  if (!session?.user?.email) redirect('/login');

  const t = await getTranslations('MisPropiedadesPage');

  const { data: properties } = await getSupabase()
    .from('properties')
    .select('id, colonia, tipo_local, m2, modalidad, precio_inmueble, photo_urls, is_published, expires_at, created_at')
    .eq('user_email', session.user.email)
    .order('created_at', { ascending: false });

  const items = (properties ?? []) as Property[];

  return (
    <main style={{ minHeight: '100vh', background: 'oklch(0.985 0.005 240)', color: '#181e38', fontFamily: "'Inter', sans-serif" }}>
      <NavHeader />

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '48px 24px 80px' }}>

        {/* Header */}
        <div style={{ marginBottom: 36 }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'oklch(0.55 0.11 250)', display: 'block', marginBottom: 8 }}>
            {t('accountLabel')}
          </span>
          <h1 style={{ fontSize: 'clamp(24px, 3vw, 36px)', fontWeight: 900, letterSpacing: '-0.02em', marginBottom: 8, color: '#181e38' }}>
            {t('title')}
          </h1>
          <p style={{ color: '#5a6288', fontSize: 14 }}>
            {items.length} {t('title').toLowerCase()}
          </p>
        </div>

        {items.length === 0 ? (
          /* Empty state */
          <div style={{
            textAlign: 'center', padding: '80px 24px',
            border: '1px dashed #c8d0e8', borderRadius: 20,
            background: '#f5f6fc',
          }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>🏬</div>
            <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 10, color: '#181e38' }}>{t('emptyTitle')}</h2>
            <p style={{ color: '#5a6288', marginBottom: 28, maxWidth: 400, margin: '0 auto 28px' }}>
              {t('emptyDesc')}
            </p>
            <Link href="/registro" style={{
              background: 'linear-gradient(135deg, #0f1b3d, #3b6fa0)',
              color: '#ffffff', padding: '13px 28px', borderRadius: 12,
              fontWeight: 700, fontSize: 14, textDecoration: 'none',
              boxShadow: '0 6px 24px rgba(15,27,61,0.18)',
              display: 'inline-block',
            }}>
              {t('emptyRegisterBtn')}
            </Link>
          </div>
        ) : (
          <>
            {/* Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20, marginBottom: 32 }}>
              {items.map(p => (
                <div key={p.id} style={{
                  background: '#ffffff', border: '1px solid #e4e7f4',
                  borderRadius: 16, overflow: 'hidden',
                  boxShadow: '0 2px 8px rgba(15,27,61,0.04)',
                  transition: 'border-color 0.2s, box-shadow 0.2s, transform 0.2s',
                }}>
                  {/* Photo */}
                  <div style={{ height: 160, background: '#edf0f8', position: 'relative', overflow: 'hidden' }}>
                    {p.photo_urls?.[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.photo_urls[0]}
                        alt={p.tipo_local}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, opacity: 0.25 }}>
                        🏬
                      </div>
                    )}
                    {/* Status badge */}
                    {(() => {
                      const expired = p.expires_at ? new Date(p.expires_at).getTime() <= Date.now() : false;
                      const status = !p.is_published ? 'pending' : expired ? 'expired' : 'active';
                      const styleMap = {
                        active:  { bg: 'oklch(0.96 0.06 155)', bd: 'oklch(0.82 0.1 155)',  fg: 'oklch(0.40 0.14 155)', label: t('statusActive') },
                        expired: { bg: 'oklch(0.97 0.04 25)',  bd: 'oklch(0.84 0.1 25)',   fg: 'oklch(0.50 0.18 25)',  label: t('statusExpired') },
                        pending: { bg: 'oklch(0.96 0.02 250)', bd: 'oklch(0.84 0.05 250)', fg: 'oklch(0.48 0.08 250)', label: t('statusPending') },
                      }[status];
                      return (
                        <span style={{
                          position: 'absolute', top: 10, right: 10,
                          fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 100,
                          background: styleMap.bg,
                          border: `1px solid ${styleMap.bd}`,
                          color: styleMap.fg,
                        }}>
                          {styleMap.label}
                        </span>
                      );
                    })()}
                  </div>

                  {/* Info */}
                  <div style={{ padding: '16px 18px' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: 'oklch(0.55 0.11 250)', marginBottom: 4, textTransform: 'uppercase' }}>
                      {p.colonia}
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4, color: '#181e38' }}>
                      {p.tipo_local}
                    </div>
                    <div style={{ fontSize: 12, color: '#5a6288', marginBottom: 14 }}>
                      {p.m2} m²{p.modalidad ? ` · ${p.modalidad === 'rent' ? t('rent') : t('sale')}` : ''}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 15, fontWeight: 800, color: '#181e38' }}>
                        {formatPrice(p.precio_inmueble)}
                      </span>
                      <Link href={`/propiedades/${p.id}`} style={{
                        fontSize: 12, fontWeight: 700, color: '#3b6fa0',
                        border: '1px solid rgba(59,111,160,0.3)', borderRadius: 8,
                        padding: '5px 12px', textDecoration: 'none',
                      }}>
                        {t('viewBtn')}
                      </Link>
                    </div>
                    <Link
                      href={`/propiedades/${p.id}#pricing-suggestion`}
                      style={{
                        display: 'block', textAlign: 'center', marginTop: 10,
                        fontSize: 12, fontWeight: 600,
                        color: 'oklch(0.42 0.12 280)',
                        border: '1px solid oklch(0.84 0.06 280)',
                        borderRadius: 8, padding: '6px 12px',
                        background: 'oklch(0.97 0.02 280)',
                        textDecoration: 'none',
                      }}
                    >
                      {t('pricingSuggestion')}
                    </Link>
                    <PropertyActions id={p.id} isPublished={p.is_published} />
                  </div>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div style={{ textAlign: 'center' }}>
              <Link href="/registro" style={{
                background: 'linear-gradient(135deg, #0f1b3d, #3b6fa0)',
                color: '#ffffff', padding: '13px 28px', borderRadius: 12,
                fontWeight: 700, fontSize: 14, textDecoration: 'none',
                boxShadow: '0 6px 24px rgba(15,27,61,0.18)',
                display: 'inline-block',
              }}>
                {t('registerAnotherBtn')}
              </Link>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
