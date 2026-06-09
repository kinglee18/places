'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import NavHeader from '@/components/NavHeader';

interface Property {
  id: string;
  colonia: string;
  tipo_local: string;
  m2: number;
  precio_inmueble: number | null;
  photo_urls: string[];
  created_at: string;
}

export default function Home() {
  const [hoveredPlan, setHoveredPlan] = useState<'basic' | 'pro' | null>(null);
  const [latestProperties, setLatestProperties] = useState<Property[]>([]);
  const [loadingProps, setLoadingProps] = useState(true);
  const t = useTranslations('HomePage');
  const tF = useTranslations('Features');
  const tS = useTranslations('Steps');

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

  useEffect(() => {
    fetch('/api/properties?limit=6&published=true')
      .then(r => r.json())
      .then((data: Property[]) => {
        setLatestProperties(data ?? []);
        setLoadingProps(false);
      });
  }, []);

  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Noise texture overlay */}
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
        {/* Background blobs */}
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
          {/* Badge */}
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

          {/* Mini stats */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '48px',
            marginTop: '72px',
            flexWrap: 'wrap',
          }}>
            {[
              { value: t('stat1Value'), label: t('stat1Label') },
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
            <Link href="/propiedades" style={{
              fontSize: '14px', fontWeight: 600, color: 'var(--accent)',
              display: 'flex', alignItems: 'center', gap: '6px',
              opacity: 0.85, transition: 'opacity 0.2s',
            }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '0.85')}
            >
              {t('viewAll')}
            </Link>
          </div>

          {loadingProps ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="card" style={{ height: 280, opacity: 0.4, animation: 'pulse 1.5s ease-in-out infinite' }} />
              ))}
            </div>
          ) : latestProperties.length === 0 ? (
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
                <div className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', cursor: 'pointer', transition: 'border-color 0.2s' }}>
                  {/* Photo */}
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

                  {/* Info */}
                  <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
                    <p style={{ fontSize: '14px', color: 'var(--muted)', margin: 0 }}>{p.tipo_local}</p>
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
              <div key={i} style={{ display: 'flex', gap: '32px', marginBottom: i < steps.length - 1 ? '0' : '0' }}>
                {/* Vertical line + number */}
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

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '28px' }}>
            {/* ── BASIC PLAN ── */}
            <div
              className="card"
              onMouseEnter={() => setHoveredPlan('basic')}
              onMouseLeave={() => setHoveredPlan(null)}
              style={{
                padding: '40px',
                background: hoveredPlan === 'basic' ? 'rgba(0,245,160,0.03)' : 'var(--plan-basic-bg)',
                borderColor: hoveredPlan === 'basic' ? 'rgba(0,245,160,0.4)' : 'var(--plan-basic-border)',
                transition: 'all 0.3s ease',
              }}
            >
              <div style={{ marginBottom: '32px' }}>
                <span className="tag tag-accent" style={{ marginBottom: '20px', display: 'inline-flex' }}>
                  ✓ {t('basicTag')}
                </span>
                <div style={{ fontSize: '44px', fontWeight: 900, letterSpacing: '-0.02em', marginBottom: '4px' }}>
                  {t('basicPrice')}
                </div>
                <div style={{ color: 'var(--muted)', fontSize: '15px' }}>{t('basicSubtitle')}</div>
              </div>

              <div style={{ borderTop: '1px solid var(--plan-basic-border)', paddingTop: '28px', marginBottom: '36px' }}>
                <p style={{ color: 'var(--muted)', fontSize: '15px', marginBottom: '24px', lineHeight: 1.6 }}>
                  {t('basicDesc')}
                </p>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {(['basicFeature1', 'basicFeature2', 'basicFeature3', 'basicFeature4', 'basicFeature5'] as const).map((key, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', fontSize: '15px' }}>
                      <span style={{ color: 'var(--accent)', fontSize: '16px', flexShrink: 0, marginTop: '2px' }}>✓</span>
                      <span style={{ color: 'var(--foreground)' }}>{t(key)}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Link href="/registro" className="btn-secondary" style={{
                display: 'block', textAlign: 'center', width: '100%',
                padding: '14px', borderRadius: '12px', fontSize: '15px',
              }}>
                {t('basicCta')}
              </Link>
            </div>

            {/* ── PRO PLAN ── */}
            <div
              className="card"
              onMouseEnter={() => setHoveredPlan('pro')}
              onMouseLeave={() => setHoveredPlan(null)}
              style={{
                padding: '40px',
                background: 'linear-gradient(160deg, rgba(124,58,237,0.12) 0%, rgba(0,180,216,0.06) 100%)',
                borderColor: hoveredPlan === 'pro' ? '#7c3aed' : 'rgba(124,58,237,0.45)',
                position: 'relative',
                overflow: 'hidden',
                transition: 'all 0.3s ease',
              }}
            >
              {/* Pro glow */}
              <div style={{
                position: 'absolute', top: '-60px', right: '-60px',
                width: '200px', height: '200px',
                background: 'radial-gradient(circle, rgba(124,58,237,0.25) 0%, transparent 70%)',
                pointerEvents: 'none',
              }} />

              <div style={{ marginBottom: '32px', position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                  <span className="tag tag-pro">⚡ {t('proTag')}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '4px' }}>
                  <div style={{ fontSize: '44px', fontWeight: 900, letterSpacing: '-0.02em' }}>
                    <span className="gradient-text-accent">{t('proPrice')}</span>
                  </div>
                  <span style={{ color: 'var(--muted)', fontSize: '15px' }}>{t('proUnit')}</span>
                </div>
                <div style={{ color: 'var(--muted)', fontSize: '15px' }}>{t('proSubtitle')}</div>
              </div>

              <div style={{ borderTop: '1px solid rgba(124,58,237,0.25)', paddingTop: '28px', marginBottom: '36px' }}>
                <p style={{ color: 'var(--muted)', fontSize: '15px', marginBottom: '24px', lineHeight: 1.6 }}>
                  {t('proDesc')}
                </p>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {[
                    { key: 'proFeature1' as const, isPro: false },
                    { key: 'proFeature2' as const, isPro: true },
                    { key: 'proFeature3' as const, isPro: true },
                    { key: 'proFeature4' as const, isPro: true },
                  ].map((item, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', fontSize: '15px' }}>
                      <span style={{
                        color: item.isPro ? '#a78bfa' : 'var(--accent)',
                        fontSize: '16px', flexShrink: 0, marginTop: '2px',
                      }}>
                        {item.isPro ? '⚡' : '✓'}
                      </span>
                      <span>{t(item.key)}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div style={{ display: 'flex', gap: '12px', flexDirection: 'column' }}>
                <Link href="/registro" className="btn-primary" style={{
                  display: 'block', textAlign: 'center', width: '100%',
                  padding: '14px', borderRadius: '12px', fontSize: '15px',
                  background: 'linear-gradient(135deg, oklch(0.235 0.07 265), oklch(0.55 0.11 250))',
                  boxShadow: '0 8px 30px oklch(0.235 0.07 265 / 0.3)',
                }}>
                  {t('proCta')}
                </Link>
              </div>
            </div>
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
          <Link href="/propiedades" style={{ transition: 'color 0.2s' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent)')}
            onMouseLeave={e => (e.currentTarget.style.color = '')}>{t('footerProperties')}</Link>
          <a href="#plans" style={{ transition: 'color 0.2s' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent)')}
            onMouseLeave={e => (e.currentTarget.style.color = '')}>{t('footerPlans')}</a>
          <a href="#features" style={{ transition: 'color 0.2s' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent)')}
            onMouseLeave={e => (e.currentTarget.style.color = '')}>{t('footerFeatures')}</a>
          <Link href="/registro" style={{ transition: 'color 0.2s' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent)')}
            onMouseLeave={e => (e.currentTarget.style.color = '')}>{t('footerRegister')}</Link>
          <Link href="/terms" style={{ transition: 'color 0.2s' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent)')}
            onMouseLeave={e => (e.currentTarget.style.color = '')}>{t('footerTerms')}</Link>
          <Link href="/privacy" style={{ transition: 'color 0.2s' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent)')}
            onMouseLeave={e => (e.currentTarget.style.color = '')}>{t('footerPrivacy')}</Link>
        </div>
      </footer>
    </main>
  );
}
