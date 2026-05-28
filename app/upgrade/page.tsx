'use client';

import Link from 'next/link';
import { useState } from 'react';

const proFeatures = [
  {
    icon: '🗺️',
    title: 'Competitor Analysis',
    desc: 'Discover all registered businesses within a 2 km radius. Understand market saturation by category.',
    detail: 'Real-time data on nearby competitors with distance, ratings, and category breakdown.',
  },
  {
    icon: '🤖',
    title: 'AI Recommendations',
    desc: 'Get personalized business type suggestions based on your property and location.',
    detail: 'Machine learning algorithms analyze your property to suggest the most promising uses.',
  },
  {
    icon: '💰',
    title: 'Rental Potential',
    desc: 'Know your property\'s estimated rental value based on comparable properties.',
    detail: 'Market-driven pricing data to maximize your rental income.',
  },
  {
    icon: '⚡',
    title: 'Priority Support',
    desc: 'Direct support channel for any questions about your analysis.',
    detail: 'Email and chat support with response times under 24 hours.',
  },
];

const faqItems = [
  {
    q: 'How much does it cost to publish?',
    a: 'Your first listing each month is free and stays live for 30 days, with the full market analysis included. Additional listings in the same month are $149 MXN each, and you can keep any listing live another 30 days for $99 MXN.',
  },
  {
    q: 'Is the competitor analysis included for free?',
    a: 'Yes. Every listing — including the free one — gets the 2 km competitor analysis and AI recommendations at no extra cost.',
  },
  {
    q: 'What happens after 30 days?',
    a: 'The listing expires and stops showing on the marketplace. You can republish it for another 30 days for $99 MXN from the property detail page.',
  },
  {
    q: 'How many free listings can I publish?',
    a: 'One free listing per calendar month during this trial stage. Any additional listing that month is $149 MXN.',
  },
  {
    q: 'How is the data kept current?',
    a: 'The competitor analysis runs when you publish. We recommend reviewing it periodically as the area changes.',
  },
];

const testimonials = [
  {
    name: 'Carlos M.',
    role: 'Restaurant Owner, Condesa',
    quote: 'The competition analysis saved me from opening in a saturated market. Invaluable.',
    highlight: 'Competitor Analysis',
  },
  {
    name: 'Elena R.',
    role: 'Real Estate Investor',
    quote: 'The rental potential estimate helped me negotiate 15% higher rent than I initially quoted.',
    highlight: 'Rental Potential',
  },
  {
    name: 'Javier L.',
    role: 'Retail Store Owner, Roma',
    quote: 'AI recommendations showed me a business type I hadn\'t considered. Best decision ever.',
    highlight: 'AI Recommendations',
  },
];

const comparisonTable = [
  { feature: 'Property Registration', basic: true, pro: true },
  { feature: 'Photos (up to 5)', basic: true, pro: true },
  { feature: 'Map Location', basic: true, pro: true },
  { feature: 'Price & Amenities', basic: true, pro: true },
  { feature: 'Competitor Analysis (2 km)', basic: true, pro: true },
  { feature: 'AI Business Recommendations', basic: true, pro: true },
  { feature: 'Rental Potential Estimation', basic: true, pro: true },
  { feature: 'Extra listing same month ($149)', basic: false, pro: true },
  { feature: 'Keep live beyond 30 days ($99)', basic: false, pro: true },
];

export default function UpgradePage() {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [hoveredPlan, setHoveredPlan] = useState<'pro' | null>(null);

  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Noise texture overlay */}
      <div className="noise-overlay" />

      {/* ────────────────── HEADER ────────────────── */}
      <header style={{
        padding: '20px 48px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid var(--surface-border)',
        background: 'rgba(6, 6, 15, 0.85)',
        backdropFilter: 'blur(20px)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}>
        <Link href="/" style={{ fontWeight: 800, fontSize: '22px', display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', color: 'inherit' }}>
          <div style={{
            width: 36, height: 36,
            background: 'linear-gradient(135deg, var(--accent), var(--accent-secondary))',
            borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18,
            boxShadow: '0 4px 16px rgba(0,245,160,0.3)',
          }}>📍</div>
          <span>Local<span style={{ color: 'var(--accent)' }}>IQ</span></span>
        </Link>

        <nav style={{ display: 'flex', gap: '28px', alignItems: 'center' }}>
          <Link href="/" style={{ fontWeight: 500, opacity: 0.7, transition: 'opacity 0.2s', fontSize: '15px' }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '0.7')}>
            Home
          </Link>
          <Link href="/propiedades" style={{ fontWeight: 500, opacity: 0.7, transition: 'opacity 0.2s', fontSize: '15px' }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '0.7')}>
            Properties
          </Link>
          <Link href="/registro" className="btn-primary" style={{ padding: '10px 24px', fontSize: '15px', borderRadius: '10px' }}>
            Get Started
          </Link>
        </nav>
      </header>

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
          background: 'radial-gradient(ellipse, rgba(124,58,237,0.1) 0%, transparent 65%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: '0%', left: '10%',
          width: '500px', height: '500px',
          background: 'radial-gradient(circle, rgba(0,245,160,0.06) 0%, transparent 65%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: '10%', right: '5%',
          width: '400px', height: '400px',
          background: 'radial-gradient(circle, rgba(0,180,216,0.07) 0%, transparent 65%)',
          pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: '860px' }}>
          {/* Badge */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '28px' }}>
            <span className="tag tag-pro" style={{ fontSize: '13px' }}>
              ⚡ Unlock full potential
            </span>
          </div>

          <h1 style={{
            fontSize: 'clamp(44px, 6vw, 80px)',
            fontWeight: 900,
            lineHeight: 1.05,
            marginBottom: '28px',
            letterSpacing: '-0.02em',
          }}>
            <span className="gradient-text-accent">Transform data into<br />smart decisions.</span>
          </h1>

          <p style={{
            fontSize: 'clamp(17px, 2vw, 21px)',
            color: 'var(--muted)',
            marginBottom: '52px',
            maxWidth: '640px',
            margin: '0 auto 52px auto',
            lineHeight: 1.7,
          }}>
            Your first listing each month is free for 30 days — competitor analysis and{' '}
            <strong style={{ color: 'var(--foreground)' }}>AI recommendations</strong> included. Pay only for extra listings or longer runtime.
          </p>

          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/registro" className="btn-primary" style={{ fontSize: '16px', padding: '16px 40px' }}>
              Publish a free listing →
            </Link>
            <a href="#features" className="btn-secondary">
              See all features
            </a>
          </div>

          {/* Stats */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '48px',
            marginTop: '72px',
            flexWrap: 'wrap',
          }}>
            {[
              { value: 'Free', label: '1 listing / month' },
              { value: '2 km+', label: 'Analysis radius' },
              { value: '30 days', label: 'Live per listing' },
            ].map((s, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--accent)' }}>{s.value}</div>
                <div style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '4px' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ────────────────── PRO FEATURES SHOWCASE ────────────────── */}
      <section id="features" style={{ padding: '100px 24px', background: 'var(--surface)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '72px' }}>
            <span className="section-label">Pro Features</span>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, lineHeight: 1.2, marginBottom: '16px' }}>
              Everything you need<br />
              <span className="gradient-text-accent">to analyze your market</span>
            </h2>
            <p style={{ color: 'var(--muted)', maxWidth: '540px', margin: '0 auto', fontSize: '17px' }}>
              Six powerful tools designed to maximize your property&amp;s value and help you make data-backed decisions.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
            {proFeatures.map((f, i) => (
              <div key={i} className="card" style={{
                padding: '32px',
                background: 'linear-gradient(160deg, rgba(124,58,237,0.08) 0%, rgba(0,180,216,0.04) 100%)',
                borderColor: 'rgba(124,58,237,0.25)',
              }}>
                <div style={{
                  width: 56, height: 56,
                  background: 'rgba(124,58,237,0.15)',
                  borderRadius: '14px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '28px',
                  marginBottom: '20px',
                }}>
                  {f.icon}
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '10px' }}>{f.title}</h3>
                <p style={{ color: 'var(--muted)', lineHeight: 1.65, fontSize: '15px', marginBottom: '12px' }}>{f.desc}</p>
                <p style={{ color: 'var(--muted)', lineHeight: 1.5, fontSize: '14px', opacity: 0.75, fontStyle: 'italic' }}>
                  {f.detail}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ────────────────── TESTIMONIALS ────────────────── */}
      <section style={{ padding: '100px 24px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '72px' }}>
            <span className="section-label">Success Stories</span>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, lineHeight: 1.2 }}>
              Trusted by property owners
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '28px' }}>
            {testimonials.map((t, i) => (
              <div key={i} className="card" style={{ padding: '32px', borderColor: 'rgba(124,58,237,0.2)' }}>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                  {[1, 2, 3, 4, 5].map(s => (
                    <span key={s} style={{ fontSize: '16px', color: '#fbbf24' }}>★</span>
                  ))}
                </div>
                <p style={{ fontSize: '16px', lineHeight: 1.75, marginBottom: '24px', color: 'var(--foreground)', fontStyle: 'italic' }}>
                  {t.quote}
                </p>
                <div style={{ borderTop: '1px solid var(--surface-border)', paddingTop: '16px' }}>
                  <div style={{ fontSize: '15px', fontWeight: 700, marginBottom: '4px' }}>{t.name}</div>
                  <div style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '8px' }}>{t.role}</div>
                  <span className="tag tag-pro" style={{ fontSize: '11px' }}>
                    {t.highlight}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ────────────────── FEATURE COMPARISON ────────────────── */}
      <section style={{ padding: '100px 24px', background: 'var(--surface)' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '72px' }}>
            <span className="section-label">Comparison</span>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, lineHeight: 1.2 }}>
              Free vs Pay-as-you-go
            </h2>
          </div>

          {/* Table - Desktop */}
          <div style={{ overflowX: 'auto', marginBottom: '32px', display: 'none' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '15px',
            }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--surface-border)' }}>
                  <th style={{ textAlign: 'left', padding: '20px', fontWeight: 700, color: 'var(--muted)' }}>Feature</th>
                  <th style={{ textAlign: 'center', padding: '20px', fontWeight: 700 }}>Free</th>
                  <th style={{ textAlign: 'center', padding: '20px', fontWeight: 700 }}>Paid</th>
                </tr>
              </thead>
              <tbody>
                {comparisonTable.map((row, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--surface-border)' }}>
                    <td style={{ padding: '16px 20px', fontWeight: 600 }}>{row.feature}</td>
                    <td style={{ textAlign: 'center', padding: '16px 20px' }}>
                      {row.basic ? (
                        <span style={{ color: 'var(--accent)', fontSize: '18px' }}>✓</span>
                      ) : (
                        <span style={{ opacity: 0.2 }}>✗</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center', padding: '16px 20px' }}>
                      {row.pro ? (
                        <span style={{ color: '#a78bfa', fontSize: '18px' }}>⚡</span>
                      ) : (
                        <span style={{ opacity: 0.2 }}>✗</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Card-based comparison for mobile - always shown */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
            {comparisonTable.map((row, i) => (
              <div key={i} className="card" style={{ padding: '20px', display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '16px', alignItems: 'center' }}>
                <div style={{ fontWeight: 600, fontSize: '15px' }}>{row.feature}</div>
                <div style={{ textAlign: 'center', width: '40px' }}>
                  {row.basic ? (
                    <span style={{ color: 'var(--accent)', fontSize: '16px' }}>✓</span>
                  ) : (
                    <span style={{ opacity: 0.2, fontSize: '16px' }}>✗</span>
                  )}
                </div>
                <div style={{ textAlign: 'center', width: '40px' }}>
                  {row.pro ? (
                    <span style={{ color: '#a78bfa', fontSize: '16px' }}>⚡</span>
                  ) : (
                    <span style={{ opacity: 0.2, fontSize: '16px' }}>✗</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ────────────────── FAQ ────────────────── */}
      <section style={{ padding: '100px 24px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '72px' }}>
            <span className="section-label">FAQ</span>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, lineHeight: 1.2 }}>
              Frequently asked questions
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {faqItems.map((item, i) => (
              <div key={i} className="card" style={{ padding: '24px', cursor: 'pointer', transition: 'all 0.3s ease' }}
                onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(124,58,237,0.4)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--surface-border)')}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, flex: 1 }}>{item.q}</h3>
                  <span style={{
                    fontSize: '20px', color: 'var(--accent)', flexShrink: 0,
                    transform: expandedFaq === i ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.3s ease',
                  }}>
                    ▼
                  </span>
                </div>

                {expandedFaq === i && (
                  <p style={{
                    color: 'var(--muted)', fontSize: '15px', lineHeight: 1.7,
                    marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--surface-border)',
                    animation: 'fadeIn 0.3s ease',
                  }}>
                    {item.a}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ────────────────── PRICING CTA ────────────────── */}
      <section style={{
        padding: '100px 24px',
        background: 'var(--surface)',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
          width: '800px', height: '500px',
          background: 'radial-gradient(ellipse, rgba(124,58,237,0.08) 0%, transparent 65%)',
          pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ marginBottom: '56px' }}>
            <span className="section-label">Ready?</span>
            <h2 style={{ fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: 900, lineHeight: 1.1, marginBottom: '20px', letterSpacing: '-0.02em' }}>
              <span className="gradient-text-accent">Get Pro analysis</span><br />
              and unlock your property&quot;s potential
            </h2>
            <p style={{ color: 'var(--muted)', fontSize: '18px', marginBottom: '44px', lineHeight: 1.7 }}>
              Publish your first listing free each month — full market analysis included. Pay only when you need more.
            </p>
          </div>

          <div
            className="card"
            onMouseEnter={() => setHoveredPlan('pro')}
            onMouseLeave={() => setHoveredPlan(null)}
            style={{
              padding: '48px 40px',
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

            <div style={{ position: 'relative', zIndex: 1 }}>
              <span className="tag tag-pro" style={{ marginBottom: '24px' }}>⚡ PAY AS YOU GO</span>
              <div style={{
                fontSize: '56px', fontWeight: 900, letterSpacing: '-0.02em',
                marginBottom: '12px', background: 'linear-gradient(135deg, #7c3aed, #00b4d8)', backgroundClip: 'text',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>
                $149
              </div>
              <p style={{ color: 'var(--muted)', fontSize: '16px', marginBottom: '36px' }}>
                per additional listing · $99 to extend any listing +30 days
              </p>

              <Link href="/registro" className="btn-primary" style={{
                fontSize: '16px', padding: '18px 48px',
                background: 'linear-gradient(135deg, #7c3aed, #00b4d8)',
                boxShadow: '0 12px 40px rgba(124,58,237,0.4)',
              }}>
                Publish a free listing →
              </Link>

              <p style={{ color: 'var(--muted)', fontSize: '13px', marginTop: '24px' }}>
                Your first listing each month is free for 30 days — analysis included.
              </p>
            </div>
          </div>
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
              <linearGradient id="up-g" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                <stop stopColor="#0f1b3d"/><stop offset="1" stopColor="#3b6fa0"/>
              </linearGradient>
            </defs>
            <rect width="32" height="32" rx="8" fill="url(#up-g)"/>
            <rect x="4" y="8" width="24" height="3" rx="1.5" fill="white" opacity="0.9"/>
            <rect x="5" y="14" width="8" height="6" rx="1.5" fill="white" opacity="0.65"/>
            <rect x="19" y="14" width="8" height="6" rx="1.5" fill="white" opacity="0.65"/>
            <rect x="12" y="22" width="8" height="7" rx="1.5" fill="white" opacity="0.45"/>
          </svg>
          <span style={{ letterSpacing: '-0.02em' }}>Plazi<span style={{ color: 'var(--accent)' }}>ia</span></span>
        </div>
        <p>© {new Date().getFullYear()} Plaziia. All rights reserved.</p>
        <div style={{ display: 'flex', gap: '24px' }}>
          <Link href="/" style={{ transition: 'color 0.2s' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent)')}
            onMouseLeave={e => (e.currentTarget.style.color = '')}>Home</Link>
          <Link href="/propiedades" style={{ transition: 'color 0.2s' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent)')}
            onMouseLeave={e => (e.currentTarget.style.color = '')}>Properties</Link>
          <Link href="/registro" style={{ transition: 'color 0.2s' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent)')}
            onMouseLeave={e => (e.currentTarget.style.color = '')}>Register</Link>
        </div>
      </footer>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </main>
  );
}
