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
          <a href="#how" style={{ fontWeight: 500, opacity: 0.8, transition: 'opacity 0.2s' }}>Cómo funciona</a>
          <Link href="/registro" style={{
            background: 'var(--foreground)', color: 'var(--background)',
            padding: '8px 20px', borderRadius: '100px', fontWeight: 600,
            transition: 'transform 0.2s'
          }}>
            Evaluar Local
          </Link>
        </nav>
      </header>

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
        {/* Decorative background blur */}
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
            Descubre el potencial oculto de tu propiedad comercial
          </h1>
          <p style={{
            fontSize: 'clamp(18px, 2vw, 22px)',
            color: '#8888aa',
            marginBottom: '48px',
            maxWidth: '600px',
            margin: '0 auto 48px auto'
          }}>
            Aprovecha la inteligencia artificial para analizar el mercado, evaluar la competencia y recibir recomendaciones precisas sobre qué negocio abrir en tu local.
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
            <Link href="/registro" style={{
              background: 'linear-gradient(135deg, var(--accent), var(--accent-secondary))',
              color: 'var(--background)',
              padding: '16px 32px',
              borderRadius: '12px',
              fontSize: '18px',
              fontWeight: 700,
              boxShadow: '0 8px 30px rgba(0, 245, 160, 0.2)',
              transition: 'transform 0.2s, box-shadow 0.2s',
              display: 'inline-block'
            }}>
              Registrar y Analizar Local →
            </Link>
          </div>
        </div>
      </section>

      <section id="features" style={{ padding: '80px 24px', background: 'var(--surface)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '36px', fontWeight: 800, textAlign: 'center', marginBottom: '64px' }}>
            ¿Por qué usar Local<span style={{ color: 'var(--accent)' }}>IQ</span>?
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>
            {[
              { icon: '📊', title: 'Análisis de Demanda', desc: 'Identifica qué servicios necesita realmente la zona basándose en datos de saturación y tendencias actuales.' },
              { icon: '🤖', title: 'Recomendaciones IA', desc: 'Recibe top picks de negocios elaborados por algoritmos inteligentes que evalúan el historial de tu local.' },
              { icon: '📈', title: 'Potencial de Renta', desc: 'Conoce el valor estimado de ingresos de tu propiedad enfocado en el giro correcto, maximizando tus retornos.' }
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
