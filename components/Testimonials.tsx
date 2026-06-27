import { getTranslations } from 'next-intl/server';

export default async function Testimonials() {
  const t = await getTranslations('HomePage');

  const items = [
    {
      quote: t('testimonial1Quote'),
      author: t('testimonial1Author'),
      location: t('testimonial1Location'),
    },
    {
      quote: t('testimonial2Quote'),
      author: t('testimonial2Author'),
      location: t('testimonial2Location'),
    },
    {
      quote: t('testimonial3Quote'),
      author: t('testimonial3Author'),
      location: t('testimonial3Location'),
    },
  ];

  return (
    <section style={{ padding: '80px 24px', background: 'var(--surface)' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '56px' }}>
          <span className="section-label">{t('testimonialLabel')}</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
          {items.map((item, i) => (
            <div key={i} className="card" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Stars */}
              <div style={{ display: 'flex', gap: '4px' }}>
                {Array.from({ length: 5 }).map((_, s) => (
                  <span key={s} style={{ color: '#f59e0b', fontSize: '16px' }}>★</span>
                ))}
              </div>

              {/* Quote */}
              <p style={{
                fontSize: '15px',
                lineHeight: 1.7,
                color: 'var(--foreground)',
                flex: 1,
                fontStyle: 'italic',
              }}>
                &ldquo;{item.quote}&rdquo;
              </p>

              {/* Author */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: 40, height: 40,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--accent), var(--accent-secondary))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: '16px',
                  color: 'var(--background)',
                  flexShrink: 0,
                }}>
                  {item.author.charAt(0)}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--foreground)' }}>{item.author}</div>
                  <div style={{ fontSize: '12px', color: 'var(--muted)' }}>{item.location}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
