import Link from 'next/link';

export default function Home() {
  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{
        padding: '24px 48px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid var(--surface-border)',
        background: 'rgba(10, 10, 15, 0.8)',
        backdropFilter: 'blur(10px)',
        position: 'sticky',
        top: 0,
        zIndex: 10
      }}>
        <div style={{ fontSize: '24px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: 32, height: 32, background: 'linear-gradient(135deg, var(--accent), var(--accent-secondary))',
            borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16
          }}>📍</div>
          <span>Local<span style={{ color: 'var(--accent)' }}>IQ</span></span>
        </div>
        <nav style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
          <a href="#features" style={{ fontWeight: 500, opacity: 0.8, transition: 'opacity 0.2s' }}>Características</a>
          <a href="#para-quien" style={{ fontWeight: 500, opacity: 0.8, transition: 'opacity 0.2s' }}>¿Para quién?</a>
          <Link href="/registro" style={{
            background: 'var(--foreground)', color: 'var(--background)',
            padding: '8px 20px', borderRadius: '100px', fontWeight: 600,
            transition: 'transform 0.2s'
          }}>
            Evaluar Local
          </Link>
        </nav>
      </header>

      {/* ── HERO ── */}
      <section style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '120px 24px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute', top: '20%', left: '50%', transform: 'translate(-50%, -50%)',
          width: '80vw', height: '80vw', maxWidth: '800px', maxHeight: '800px',
          background: 'radial-gradient(circle, rgba(0,245,160,0.1) 0%, transparent 60%)',
          zIndex: 0, pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute', top: '70%', left: '30%', transform: 'translate(-50%, -50%)',
          width: '60vw', height: '60vw', maxWidth: '600px', maxHeight: '600px',
          background: 'radial-gradient(circle, rgba(0,180,216,0.1) 0%, transparent 60%)',
          zIndex: 0, pointerEvents: 'none'
        }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: '800px' }}>
          <h1 style={{
            fontSize: 'clamp(48px, 6vw, 72px)',
            fontWeight: 800,
            lineHeight: 1.1,
            marginBottom: '24px',
            background: 'linear-gradient(to right, #fff, #aab)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            El espacio comercial correcto, para la persona correcta
          </h1>
          <p style={{
            fontSize: 'clamp(18px, 2vw, 22px)',
            color: '#8888aa',
            marginBottom: '48px',
            maxWidth: '620px',
            margin: '0 auto 48px auto'
          }}>
            IA que conecta locales disponibles con emprendedores que ya tienen equipo y quieren arrancar su negocio en CDMX.
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/registro" style={{
              background: 'linear-gradient(135deg, var(--accent), var(--accent-secondary))',
              color: 'var(--background)',
              padding: '16px 32px',
              borderRadius: '12px',
              fontSize: '17px',
              fontWeight: 700,
              boxShadow: '0 8px 30px rgba(0, 245, 160, 0.2)',
              transition: 'transform 0.2s, box-shadow 0.2s',
              display: 'inline-block'
            }}>
              Tengo un local →
            </Link>
            <Link href="/buscar" style={{
              background: 'transparent',
              color: 'var(--foreground)',
              padding: '16px 32px',
              borderRadius: '12px',
              fontSize: '17px',
              fontWeight: 700,
              border: '1px solid #2a2a4a',
              transition: 'border-color 0.2s, background 0.2s',
              display: 'inline-block'
            }}>
              Busco un espacio →
            </Link>
          </div>
        </div>
      </section>

      {/* ── PARA QUIÉN ── */}
      <section id="para-quien" style={{ padding: '80px 24px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '36px', fontWeight: 800, textAlign: 'center', marginBottom: '16px' }}>
            ¿Para quién es Local<span style={{ color: 'var(--accent)' }}>IQ</span>?
          </h2>
          <p style={{ textAlign: 'center', color: '#8888aa', marginBottom: '64px', fontSize: '18px' }}>
            Dos lados del mismo mercado, un solo lugar para conectar.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>

            {/* Card dueño de local */}
            <div style={{
              background: 'linear-gradient(145deg, #0e0e22, #12122a)',
              border: '1px solid #00f5a033',
              padding: '40px 36px',
              borderRadius: '20px',
            }}>
              <div style={{ fontSize: '44px', marginBottom: '20px' }}>🏠</div>
              <div style={{
                display: 'inline-block', background: 'rgba(0,245,160,0.1)', color: 'var(--accent)',
                padding: '4px 12px', borderRadius: '100px', fontSize: '12px', fontWeight: 700,
                letterSpacing: '1px', marginBottom: '16px'
              }}>DUEÑO DE LOCAL</div>
              <h3 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '12px' }}>Tienes un local, busca el inquilino ideal</h3>
              <p style={{ color: '#8888aa', lineHeight: 1.7, marginBottom: '28px' }}>
                Registra tu propiedad y la IA analiza qué tipo de negocio tiene más potencial en tu zona. Atrae emprendedores que ya tienen el equipo y solo necesitan el espacio.
              </p>
              <ul style={{ color: '#8888aa', lineHeight: 2, listStyle: 'none', padding: 0, marginBottom: '32px' }}>
                <li>✅ Análisis de demanda por zona</li>
                <li>✅ Recomendaciones de giro de negocio</li>
                <li>✅ Potencial de renta estimado</li>
              </ul>
              <Link href="/registro" style={{
                display: 'block', textAlign: 'center',
                background: 'linear-gradient(135deg, var(--accent), var(--accent-secondary))',
                color: 'var(--background)', padding: '14px 24px', borderRadius: '10px',
                fontWeight: 700, fontSize: '15px'
              }}>
                Registrar mi local →
              </Link>
            </div>

            {/* Card emprendedor */}
            <div style={{
              background: 'linear-gradient(145deg, #0e0e22, #12122a)',
              border: '1px solid #00b4d833',
              padding: '40px 36px',
              borderRadius: '20px',
            }}>
              <div style={{ fontSize: '44px', marginBottom: '20px' }}>🧑‍🍳</div>
              <div style={{
                display: 'inline-block', background: 'rgba(0,180,216,0.1)', color: 'var(--accent-secondary)',
                padding: '4px 12px', borderRadius: '100px', fontSize: '12px', fontWeight: 700,
                letterSpacing: '1px', marginBottom: '16px'
              }}>EMPRENDEDOR</div>
              <h3 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '12px' }}>Tienes el equipo, falta el lugar</h3>
              <p style={{ color: '#8888aa', lineHeight: 1.7, marginBottom: '28px' }}>
                Dile a la IA qué tienes y qué quieres hacer. Ella detecta tu giro, te dice qué espacio necesitas, en qué colonia triunfarías y cuánto deberías pagar.
              </p>
              <ul style={{ color: '#8888aa', lineHeight: 2, listStyle: 'none', padding: 0, marginBottom: '32px' }}>
                <li>✅ Detección de giro por descripción libre</li>
                <li>✅ Requisitos del espacio que necesitas</li>
                <li>✅ Colonias de CDMX recomendadas</li>
              </ul>
              <Link href="/buscar" style={{
                display: 'block', textAlign: 'center',
                background: 'transparent',
                color: 'var(--foreground)', padding: '14px 24px', borderRadius: '10px',
                fontWeight: 700, fontSize: '15px', border: '1px solid #2a2a4a'
              }}>
                Buscar mi espacio →
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" style={{ padding: '80px 24px', background: 'var(--surface)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '36px', fontWeight: 800, textAlign: 'center', marginBottom: '64px' }}>
            ¿Por qué usar Local<span style={{ color: 'var(--accent)' }}>IQ</span>?
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>
            {[
              { icon: '📊', title: 'Análisis de Demanda', desc: 'Identifica qué servicios necesita realmente la zona basándose en datos de saturación y tendencias actuales.' },
              { icon: '🤖', title: 'Recomendaciones IA', desc: 'Recibe top picks de negocios elaborados por algoritmos inteligentes que evalúan el historial de tu local.' },
              { icon: '🔍', title: 'Match Emprendedor–Local', desc: 'Conectamos a quien tiene el espacio con quien tiene el equipo y las ganas. La IA detecta la compatibilidad perfecta.' }
            ].map((f, i) => (
              <div key={i} style={{
                background: 'var(--background)',
                border: '1px solid var(--surface-border)',
                padding: '32px',
                borderRadius: '16px',
                transition: 'transform 0.3s'
              }}>
                <div style={{ fontSize: '40px', marginBottom: '16px' }}>{f.icon}</div>
                <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '12px' }}>{f.title}</h3>
                <p style={{ color: '#8888aa', lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer style={{
        padding: '40px 24px',
        textAlign: 'center',
        borderTop: '1px solid var(--surface-border)',
        color: '#666688'
      }}>
        <p>© {new Date().getFullYear()} LocalIQ Platform. Todos los derechos reservados.</p>
      </footer>
    </main>
  );
}
