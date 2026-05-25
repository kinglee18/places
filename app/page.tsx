'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import NavHeader from '@/components/NavHeader';

const features = [
  {
    icon: '🗺️',
    title: 'Nearby Competition',
    desc: 'We analyze all registered businesses within a 2 km radius to identify real market saturation.',
    plan: 'pro',
  },
  {
    icon: '📍',
    title: 'Property Registration',
    desc: 'Publish your property with all the details: exact location, price, amenities and full description.',
    plan: 'basic',
  },
  {
    icon: '🤖',
    title: 'AI Recommendations',
    desc: 'Our algorithms suggest the most promising business types based on the unique characteristics of your property.',
    plan: 'pro',
  },
  {
    icon: '💰',
    title: 'Rental Potential',
    desc: 'Know the estimated rental value for your property based on similar properties in your area.',
    plan: 'pro',
  },
];

const steps = [
  {
    number: '01',
    title: 'Register your property',
    desc: 'Enter your property details: address, size, price and main characteristics.',
  },
  {
    number: '02',
    title: 'Choose your plan',
    desc: 'Select the free basic plan or the Pro plan with complete area analysis.',
  },
  {
    number: '03',
    title: 'Get your analysis',
    desc: 'With the Pro plan you will get a complete analysis of competition and AI-powered recommendations for your area.',
  },
];

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

  useEffect(() => {
    fetch('/api/properties?limit=6&published=true')
      .then(r =>  r.json())
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
              ✦ Business intelligence platform
            </span>
          </div>

          <h1 style={{
            fontSize: 'clamp(44px, 6vw, 80px)',
            fontWeight: 900,
            lineHeight: 1.05,
            marginBottom: '28px',
            letterSpacing: '-0.02em',
          }}>
            <span className="gradient-text">Register your property.</span>
            <br />
            <span style={{ color: 'var(--foreground)' }}>Discover its </span>
            <span className="gradient-text-accent">real potential.</span>
          </h1>

          <p style={{
            fontSize: 'clamp(17px, 2vw, 21px)',
            color: 'var(--muted)',
            marginBottom: '52px',
            maxWidth: '640px',
            margin: '0 auto 52px auto',
            lineHeight: 1.7,
          }}>
            Publish your commercial property in minutes or unlock complete analysis
            of <strong style={{ color: 'var(--foreground)' }}>nearby competition</strong> and{' '}
            <strong style={{ color: 'var(--foreground)' }}>AI-powered recommendations</strong> for your area.
          </p>

          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/registro" className="btn-primary">
              I have a property →
            </Link>
            <Link href="/buscar" className="btn-secondary">
              I&apos;m looking for a space →
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
              { value: '2 km', label: 'Analysis radius' },
              { value: '100%', label: 'Real-time data' },
              { value: 'AI', label: 'Powered by AI' },
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
              <span className="section-label">Marketplace</span>
              <h2 style={{ fontSize: 'clamp(26px, 4vw, 40px)', fontWeight: 800, lineHeight: 1.2, marginTop: '8px' }}>
                Latest registered<br />
                <span className="gradient-text-accent">properties</span>
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
              View all →
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
              <p style={{ fontSize: '16px' }}>No properties registered yet.</p>
              <Link href="/registro" className="btn-primary" style={{ display: 'inline-block', marginTop: '24px' }}>
                Be the first →
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
                          : 'Price not listed'}
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
            <span className="section-label">Features</span>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, lineHeight: 1.2, marginBottom: '16px' }}>
              Everything you need<br />
              <span className="gradient-text-accent">to make smart decisions</span>
            </h2>
            <p style={{ color: 'var(--muted)', maxWidth: '520px', margin: '0 auto', fontSize: '17px' }}>
              From basic registration to pro analysis, LocalIQ supports you every step of the way.
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
            <span className="section-label">Process</span>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, lineHeight: 1.2 }}>
              How LocalIQ Works
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
            <span className="section-label">Plans</span>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, lineHeight: 1.2, marginBottom: '16px' }}>
              Choose the plan that<br />fits your needs
            </h2>
            <p style={{ color: 'var(--muted)', fontSize: '17px', maxWidth: '480px', margin: '0 auto' }}>
              Publish one listing free every month — full analysis included. Pay only for extra listings or longer runtime.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '28px' }}>
            {/* ── PLAN BÁSICO ── */}
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
                  ✓ BASIC
                </span>
                <div style={{ fontSize: '44px', fontWeight: 900, letterSpacing: '-0.02em', marginBottom: '4px' }}>
                  Free
                </div>
                <div style={{ color: 'var(--muted)', fontSize: '15px' }}>1 listing / month · live 30 days</div>
              </div>

              <div style={{ borderTop: '1px solid var(--plan-basic-border)', paddingTop: '28px', marginBottom: '36px' }}>
                <p style={{ color: 'var(--muted)', fontSize: '15px', marginBottom: '24px', lineHeight: 1.6 }}>
                  Publish one commercial property each month — full market analysis included, live for 30 days.
                </p>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {[
                    'Complete property registration',
                    'Map location selection',
                    'Details: price, size and amenities',
                    'Competitor analysis within 2 km',
                    'AI business recommendations',
                    'Rental potential estimate',
                  ].map((item, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', fontSize: '15px' }}>
                      <span style={{ color: 'var(--accent)', fontSize: '16px', flexShrink: 0, marginTop: '2px' }}>✓</span>
                      <span style={{ color: 'var(--foreground)' }}>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Link href="/registro" className="btn-secondary" style={{
                display: 'block', textAlign: 'center', width: '100%',
                padding: '14px', borderRadius: '12px', fontSize: '15px',
              }}>
                Register free
              </Link>
            </div>

            {/* ── PLAN PRO ── */}
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
                  <span className="tag tag-pro">⚡ PAY AS YOU GO</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '4px' }}>
                  <div style={{ fontSize: '44px', fontWeight: 900, letterSpacing: '-0.02em' }}>
                    <span className="gradient-text-accent">$149</span>
                  </div>
                  <span style={{ color: 'var(--muted)', fontSize: '15px' }}>/ extra listing</span>
                </div>
                <div style={{ color: 'var(--muted)', fontSize: '15px' }}>+ $99 to keep any listing live another 30 days</div>
              </div>

              <div style={{ borderTop: '1px solid rgba(124,58,237,0.25)', paddingTop: '28px', marginBottom: '36px' }}>
                <p style={{ color: 'var(--muted)', fontSize: '15px', marginBottom: '24px', lineHeight: 1.6 }}>
                  For owners who need more than one active listing a month, or want a listing to stay live longer.
                </p>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {[
                    { text: 'Everything in the free plan, every listing', isPro: false },
                    { text: 'Additional listing this month — $149', isPro: true },
                    { text: 'Extend any listing +30 days — $99', isPro: true },
                    { text: 'Full 2 km analysis + AI on every listing', isPro: true },
                  ].map((item, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', fontSize: '15px' }}>
                      <span style={{
                        color: item.isPro ? '#a78bfa' : 'var(--accent)',
                        fontSize: '16px', flexShrink: 0, marginTop: '2px',
                      }}>
                        {item.isPro ? '⚡' : '✓'}
                      </span>
                      <span>{item.text}</span>
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
                  Start with a free listing →
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
            Your property deserves<br />
            <span className="gradient-text-accent">smart decisions</span>
          </h2>
          <p style={{ color: 'var(--muted)', fontSize: '18px', marginBottom: '44px', lineHeight: 1.7 }}>
            Register it today and start understanding the market around it.
          </p>
          <Link href="/registro" className="btn-primary" style={{ fontSize: '17px', padding: '18px 44px' }}>
            Get started now →
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
          <span style={{ color: 'var(--accent)' }}>📍</span>
          Local<span style={{ color: 'var(--accent)' }}>IQ</span>
        </div>
        <p>© {new Date().getFullYear()} LocalIQ Platform. All rights reserved.</p>
        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
          <Link href="/propiedades" style={{ transition: 'color 0.2s' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent)')}
            onMouseLeave={e => (e.currentTarget.style.color = '')}>Properties</Link>
          <a href="#plans" style={{ transition: 'color 0.2s' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent)')}
            onMouseLeave={e => (e.currentTarget.style.color = '')}>Plans</a>
          <a href="#features" style={{ transition: 'color 0.2s' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent)')}
            onMouseLeave={e => (e.currentTarget.style.color = '')}>Features</a>
          <Link href="/registro" style={{ transition: 'color 0.2s' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent)')}
            onMouseLeave={e => (e.currentTarget.style.color = '')}>Register</Link>
          <Link href="/terms" style={{ transition: 'color 0.2s' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent)')}
            onMouseLeave={e => (e.currentTarget.style.color = '')}>Terms</Link>
          <Link href="/privacy" style={{ transition: 'color 0.2s' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent)')}
            onMouseLeave={e => (e.currentTarget.style.color = '')}>Privacy</Link>
        </div>
      </footer>
    </main>
  );
}
