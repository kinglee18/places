import BuscarLocal from '../../components/BuscarLocal';
import Link from 'next/link';

export const metadata = {
  title: 'Find Space — LocalIQ',
  description: 'Describe your project and AI finds the ideal commercial space for you.',
};

export default function BuscarPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'oklch(0.985 0.005 240)' }}>
      <header style={{
        padding: '20px 48px',
        display: 'flex',
        alignItems: 'center',
        borderBottom: '1px solid var(--surface-border)',
        background: 'rgba(6, 6, 15, 0.85)',
        backdropFilter: 'blur(20px)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}>
        <Link href="/" style={{
          fontSize: '15px', fontWeight: 600, display: 'flex', alignItems: 'center',
          gap: '8px', color: 'var(--muted)', transition: 'color 0.2s',
        }}>
          ← Back to home
        </Link>
      </header>

      <div style={{ flex: 1, position: 'relative' }}>
        <BuscarLocal />
      </div>
    </div>
  );
}
