import type { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { getSupabase } from '@/lib/supabase';
import NavHeader from '@/components/NavHeader';
import PricingCards from '@/components/PricingCards';
import Testimonials from '@/components/Testimonials';
import { TIPO_KEY } from '@/lib/tipoKey';

interface Property {
  id: string;
  colonia: string;
  tipo_local: string;
  m2: number;
  precio_inmueble: number | null;
  photo_urls: string[];
  created_at: string;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (locale === 'es') {
    return {
      title: { absolute: 'Locales en Renta — Propiedades Comerciales | Plaziia' },
      description:
        'Encuentra locales comerciales en renta en México. Oficinas, bodegas, tiendas y más. Registra tu propiedad gratis.',
      keywords: [
        'locales en renta',
        'locales comerciales',
        'renta de locales',
        'bodegas en renta',
        'oficinas en renta',
        'propiedades comerciales México',
      ],
      openGraph: {
        title: 'Locales en Renta — Propiedades Comerciales | Plaziia',
        description:
          'Encuentra locales comerciales en renta en México. Registra tu propiedad gratis en Plaziia.',
        locale: 'es_MX',
      },
    };
  }
  return {
    title: { absolute: 'Commercial Properties for Rent | Plaziia' },
    description:
      'Find commercial spaces for rent in Mexico. Offices, warehouses, stores and more. Register your property for free.',
    openGraph: {
      title: 'Commercial Properties for Rent | Plaziia',
      description: 'Find commercial spaces for rent in Mexico. Register your property for free on Plaziia.',
    },
  };
}

async function getLatestProperties(): Promise<Property[]> {
  const supabase = getSupabase();
  const { data } = await supabase
    .from('properties')
    .select('id, colonia, tipo_local, m2, precio_inmueble, photo_urls, created_at')
    .eq('is_published', true)
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
    .order('created_at', { ascending: false })
    .limit(6);
  return data ?? [];
}

async function getPropertyStats(): Promise<{ total: number; recentWeek: number }> {
  const supabase = getSupabase();
  const now = new Date().toISOString();
  const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [{ count: total }, { count: recentWeek }] = await Promise.all([
    supabase
      .from('properties')
      .select('id', { count: 'exact', head: true })
      .eq('is_published', true)
      .or(`expires_at.is.null,expires_at.gt.${now}`),
    supabase
      .from('properties')
      .select('id', { count: 'exact', head: true })
      .eq('is_published', true)
      .gte('created_at', lastWeek),
  ]);

  return { total: total ?? 0, recentWeek: recentWeek ?? 0 };
}

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const [t, tF, tS, tCard] = await Promise.all([
    getTranslations('HomePage'),
    getTranslations('Features'),
    getTranslations('Steps'),
    getTranslations('PropertyCard'),
  ]);

  const [latestProperties, { total: totalCount, recentWeek }] = await Promise.all([
    getLatestProperties(),
    getPropertyStats(),
  ]);

  const tipoLabel = (raw: string) => {
    const key = TIPO_KEY[raw];
    return key ? tCard(key as Parameters<typeof tCard>[0]) : raw;
  };

  const features = [
    { icon: '🗺️', title: tF('nearbyCompetitionTitle'), desc: tF('nearbyCompetitionDesc'), plan: 'pro' },
    { icon: '📍', title: tF('propertyRegistrationTitle'), desc: tF('propertyRegistrationDesc'), plan: 'basic' },
    { icon: '🤖', title: tF('aiRecommendationsTitle'), desc: tF('aiRecommendationsDesc'), plan: 'pro' },
  ];

  const steps = [
    { number: '01', title: tS('step1Title'), desc: tS('step1Desc') },
    { number: '02', title: tS('step2Title'), desc: tS('step2Desc') },
    { number: '03', title: tS('step3Title'), desc: tS('step3Desc') },
  ];

  const pricingStrings = {
    basicTag: t('basicTag'),
    basicPrice: t('basicPrice'),
    basicSubtitle: t('basicSubtitle'),
    basicDesc: t('basicDesc'),
    basicFeatures: (
      ['basicFeature1', 'basicFeature2', 'basicFeature3', 'basicFeature4', 'basicFeature5'] as const
    ).map((k) => t(k)),
    basicCta: t('basicCta'),
    proTag: t('proTag'),
    proPrice: t('proPrice'),
    proUnit: t('proUnit'),
    proSubtitle: t('proSubtitle'),
    proDesc: t('proDesc'),
    proFeatures: [
      { label: t('proFeature1'), isPro: false },
      { label: t('proFeature2'), isPro: true },
      { label: t('proFeature3'), isPro: true },
      { label: t('proFeature4'), isPro: true },
    ],
    proCta: t('proCta'),
  };

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Plaziia',
    url: 'https://plaziia.com',
    description:
      locale === 'es'
        ? 'Plataforma de locales comerciales en renta en México'
        : 'Commercial real estate marketplace in Mexico',
    potentialAction: {
      '@type': 'SearchAction',
      target: `https://plaziia.com/${locale}/buscar?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <>
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
    />
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div className="noise-overlay" />

      <NavHeader activePage="home" />

      {/* ────────────────── HERO ────────────────── */}
      <section style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '100px 24px 80px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: '10%', left: '50%', transform: 'translate(-50%, 0)',
          width: '900px', height: '700px',
          background: 'radial-gradient(ellipse, oklch(0.55 0.11 250 / 0.07) 0%, transparent 65%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: '0%', left: '10%',
          width: '500px', height: '500px',
          background: 'radial-gradient(circle, oklch(0.52 0.18 295 / 0.06) 0%, transparent 65%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: '10%', right: '5%',
          width: '400px', height: '400px',
          background: 'radial-gradient(circle, oklch(0.235 0.07 265 / 0.05) 0%, transparent 65%)',
          pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: '860px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '28px' }}>
            <span className="tag tag-accent" style={{ fontSize: '13px' }}>
              ✦ {t('badge')}
            </span>
          </div>

          <h1 style={{
            fontSize: 'clamp(44px, 6vw, 80px)',
            fontWeight: 900,
            lineHeight: 1.05,
            marginBottom: '28px',
            letterSpacing: '-0.02em',
          }}>
            <span className="gradient-text">{t('heroLine1')}</span>
            <br />
            <span style={{ color: 'var(--foreground)' }}>{t('heroLine2')} </span>
            <span className="gradient-text-accent">{t('heroAccent')}</span>
          </h1>

          <p style={{
            fontSize: 'clamp(17px, 2vw, 21px)',
            color: 'var(--muted)',
            marginBottom: '52px',
            maxWidth: '640px',
            margin: '0 auto 52px auto',
            lineHeight: 1.7,
          }}>
            {t.rich('heroDesc', {
              strong: (chunks) => <strong style={{ color: 'var(--foreground)' }}>{chunks}</strong>,
            })}
          </p>

          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/registro" className="btn-primary">
              {t('ctaHaveProperty')}
            </Link>
            <Link href="/buscar" className="btn-secondary">
              {t('ctaLookingForSpace')}
            </Link>
          </div>

          {/* Trust strip */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '8px',
            marginTop: '28px',
            flexWrap: 'wrap',
          }}>
            {[t('trustFree'), t('trustNoCommission'), t('trustNoContract'), t('trustRealTime')].map((label, i) => (
              <span key={i} style={{
                fontSize: '12px',
                color: 'var(--muted)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}>
                {i > 0 && <span style={{ opacity: 0.3, marginRight: '4px' }}>·</span>}
                <span style={{ color: 'var(--accent)', fontWeight: 700 }}>✓</span>
                {label}
              </span>
            ))}
          </div>

          {/* Hero stats */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '48px',
            marginTop: '64px',
            flexWrap: 'wrap',
          }}>
            {[
              { value: String(totalCount), label: t('stat1Label') },
              { value: t('stat2Value'), label: t('stat2Label') },
              { value: t('stat3Value'), label: t('stat3Label') },
            ].map((s, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--accent)' }}>{s.value}</div>
                <div style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '4px' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ────────────────── LATEST PROPERTIES ────────────────── */}
      <section style={{ padding: '100px 24px', background: 'var(--background)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '56px', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <span className="section-label">{t('marketplaceLabel')}</span>
              <h2 style={{ fontSize: 'clamp(26px, 4vw, 40px)', fontWeight: 800, lineHeight: 1.2, marginTop: '8px' }}>
                {t('latestPropertiesTitle')}<br />
                <span className="gradient-text-accent">{t('latestPropertiesAccent')}</span>
              </h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
              {recentWeek > 0 && (
                <span style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 500 }}>
                  {t('recentActivity', { count: recentWeek })}
                </span>
              )}
              {recentWeek === 0 && (
                <span style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 500 }}>
                  {t('recentActivityZero')}
                </span>
              )}
              <Link href="/propiedades" style={{
                fontSize: '14px', fontWeight: 600, color: 'var(--accent)',
                display: 'flex', alignItems: 'center', gap: '6px',
                opacity: 0.85,
              }}>
                {t('viewAll')}
              </Link>
            </div>
          </div>

          {latestProperties.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '80px 24px',
              border: '1px dashed var(--surface-border)', borderRadius: '16px',
              color: 'var(--muted)',
            }}>
              <div style={{ fontSize: '40px', marginBottom: '16px' }}>📭</div>
              <p style={{ fontSize: '16px' }}>{t('noPropertiesYet')}</p>
              <Link href="/registro" className="btn-primary" style={{ display: 'inline-block', marginTop: '24px' }}>
                {t('beFirst')}
              </Link>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
              {latestProperties.map(p => (
                <Link key={p.id} href={`/propiedades/${p.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', cursor: 'pointer' }}>
                    <div style={{
                      height: 180, background: 'oklch(0.96 0.01 250)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0, position: 'relative', overflow: 'hidden',
                    }}>
                      {p.photo_urls?.length > 0 ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.photo_urls[0]}
                          alt={p.colonia}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <span style={{ fontSize: '36px', opacity: 0.3 }}>🏬</span>
                      )}
                      <span style={{
                        position: 'absolute', top: 12, left: 12,
                        background: 'rgba(10,10,20,0.75)', backdropFilter: 'blur(6px)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '100px', padding: '4px 10px',
                        fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em',
                        color: 'var(--accent)',
                      }}>
                        {p.colonia}
                      </span>
                    </div>

                    <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
                      <p style={{ fontSize: '14px', color: 'var(--muted)', margin: 0 }}>{tipoLabel(p.tipo_local)}</p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '13px', color: 'var(--muted)' }}>{p.m2} m²</span>
                        <span style={{ fontSize: '15px', fontWeight: 700, color: p.precio_inmueble ? 'var(--foreground)' : 'var(--muted)' }}>
                          {p.precio_inmueble
                            ? `$${p.precio_inmueble.toLocaleString('en-US')} MXN`
                            : t('priceNotListed')}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <Testimonials />

      {/* ────────────────── FEATURES ────────────────── */}
      <section id="features" style={{ padding: '100px 24px', background: 'var(--surface)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '72px' }}>
            <span className="section-label">{t('featuresLabel')}</span>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, lineHeight: 1.2, marginBottom: '16px' }}>
              {t('featuresTitle')}<br />
              <span className="gradient-text-accent">{t('featuresAccent')}</span>
            </h2>
            <p style={{ color: 'var(--muted)', maxWidth: '520px', margin: '0 auto', fontSize: '17px' }}>
              {t('featuresDesc')}
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
            {features.map((f, i) => (
              <div key={i} className="card" style={{
                padding: '32px',
                borderColor: f.plan === 'pro' ? 'rgba(124,58,237,0.3)' : 'var(--surface-border)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                  <div style={{
                    width: 52, height: 52,
                    background: f.plan === 'pro' ? 'rgba(124,58,237,0.12)' : 'rgba(0,245,160,0.08)',
                    borderRadius: '14px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '26px',
                  }}>{f.icon}</div>
                  <span className={f.plan === 'pro' ? 'tag tag-pro' : 'tag tag-accent'} style={{ fontSize: '11px' }}>
                    {f.plan === 'pro' ? '⚡ PRO' : '✓ BASIC'}
                  </span>
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '10px' }}>{f.title}</h3>
                <p style={{ color: 'var(--muted)', lineHeight: 1.65, fontSize: '15px' }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ────────────────── HOW IT WORKS ────────────────── */}
      <section id="how-it-works" style={{ padding: '100px 24px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '72px' }}>
            <span className="section-label">{t('processLabel')}</span>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, lineHeight: 1.2 }}>
              {t('processTitle')}
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            {steps.map((step, i) => (
              <div key={i} style={{ display: 'flex', gap: '32px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '60px' }}>
                  <div style={{
                    width: 52, height: 52,
                    background: 'linear-gradient(135deg, var(--accent), var(--accent-secondary))',
                    borderRadius: '14px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 800, fontSize: '15px',
                    color: 'var(--background)',
                    flexShrink: 0,
                  }}>{step.number}</div>
                  {i < steps.length - 1 && (
                    <div style={{ width: '2px', flex: 1, minHeight: '48px', background: 'var(--surface-border)', margin: '8px 0' }} />
                  )}
                </div>

                <div style={{ paddingTop: '12px', paddingBottom: i < steps.length - 1 ? '48px' : '0' }}>
                  <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '10px' }}>{step.title}</h3>
                  <p style={{ color: 'var(--muted)', fontSize: '16px', lineHeight: 1.65 }}>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ────────────────── PRICING ────────────────── */}
      <section id="plans" style={{ padding: '100px 24px', background: 'var(--surface)' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '72px' }}>
            <span className="section-label">{t('plansLabel')}</span>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, lineHeight: 1.2, marginBottom: '16px' }}>
              {t('plansTitle')}
            </h2>
            <p style={{ color: 'var(--muted)', fontSize: '17px', maxWidth: '480px', margin: '0 auto' }}>
              {t('plansDesc')}
            </p>
          </div>

          <PricingCards s={pricingStrings} />
        </div>
      </section>

      {/* ────────────────── WHY PLAZIIA ────────────────── */}
      <section style={{ padding: '100px 24px', background: 'var(--background)' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <span className="section-label">{t('whyLabel')}</span>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, lineHeight: 1.2, marginTop: '8px' }}>
              {t('whyTitle')}<br />
              <span className="gradient-text-accent">{t('whyAccent')}</span>
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '32px' }}>
            {[
              { icon: t('why1Icon'), title: t('why1Title'), desc: t('why1Desc') },
              { icon: t('why2Icon'), title: t('why2Title'), desc: t('why2Desc') },
              { icon: t('why3Icon'), title: t('why3Title'), desc: t('why3Desc') },
            ].map((item, i) => (
              <div key={i} style={{ textAlign: 'center', padding: '32px 24px' }}>
                <div style={{
                  fontSize: '48px',
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 72,
                  height: 72,
                  background: 'rgba(0,245,160,0.08)',
                  borderRadius: '20px',
                  margin: '0 auto 20px auto',
                }}>
                  {item.icon}
                </div>
                <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '12px', color: 'var(--foreground)' }}>
                  {item.title}
                </h3>
                <p style={{ fontSize: '15px', color: 'var(--muted)', lineHeight: 1.7 }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ────────────────── CTA FINAL ────────────────── */}
      <section style={{
        padding: '120px 24px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
          width: '800px', height: '500px',
          background: 'radial-gradient(ellipse, rgba(0,245,160,0.06) 0%, transparent 65%)',
          pointerEvents: 'none',
        }} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '660px', margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: 900, lineHeight: 1.1, marginBottom: '20px', letterSpacing: '-0.02em' }}>
            {t('ctaFinalTitle')}<br />
            <span className="gradient-text-accent">{t('ctaFinalAccent')}</span>
          </h2>
          <p style={{ color: 'var(--muted)', fontSize: '18px', marginBottom: '44px', lineHeight: 1.7 }}>
            {t('ctaFinalDesc')}
          </p>
          <Link href="/registro" className="btn-primary" style={{ fontSize: '17px', padding: '18px 44px' }}>
            {t('getStarted')}
          </Link>
        </div>
      </section>

      {/* ────────────────── FOOTER ────────────────── */}
      <footer style={{
        padding: '36px 48px',
        borderTop: '1px solid var(--surface-border)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
        color: 'var(--muted)',
        fontSize: '14px',
        background: 'var(--surface)',
      }}>
        <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="22" height="22" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="ft-g" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                <stop stopColor="#0f1b3d"/><stop offset="1" stopColor="#3b6fa0"/>
              </linearGradient>
            </defs>
            <rect width="32" height="32" rx="8" fill="url(#ft-g)"/>
            <rect x="4" y="8" width="24" height="3" rx="1.5" fill="white" opacity="0.9"/>
            <rect x="5" y="14" width="8" height="6" rx="1.5" fill="white" opacity="0.65"/>
            <rect x="19" y="14" width="8" height="6" rx="1.5" fill="white" opacity="0.65"/>
            <rect x="12" y="22" width="8" height="7" rx="1.5" fill="white" opacity="0.45"/>
          </svg>
          <span style={{ letterSpacing: '-0.02em' }}>Plazi<span style={{ color: 'var(--accent)' }}>ia</span></span>
        </div>
        <p>{t('footerRights', { year: new Date().getFullYear() })}</p>
        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
          <Link href="/propiedades" className="footer-link">{t('footerProperties')}</Link>
          <a href="#plans" className="footer-link">{t('footerPlans')}</a>
          <a href="#features" className="footer-link">{t('footerFeatures')}</a>
          <Link href="/registro" className="footer-link">{t('footerRegister')}</Link>
          <Link href="/terms" className="footer-link">{t('footerTerms')}</Link>
          <Link href="/privacy" className="footer-link">{t('footerPrivacy')}</Link>
        </div>
      </footer>
    </main>
    </>
  );
}
