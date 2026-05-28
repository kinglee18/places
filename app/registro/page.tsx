import LocalIQComponent from '../../components/LocalIQ';
import Link from 'next/link';

export const metadata = {
  title: 'Property Registration — Plaziia',
  description: 'Enter your property details for AI analysis.',
}

export default function RegistroPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'oklch(0.985 0.005 240)' }}>
      <header style={{
        padding: '24px 48px',
        display: 'flex',
        alignItems: 'center',
        borderBottom: '1px solid var(--surface-border)',
        background: 'oklch(0.985 0.005 240 / 0.92)',
        backdropFilter: 'blur(16px)',
        zIndex: 50
      }}>
        <Link href="/" style={{
          fontSize: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', color: 'oklch(0.45 0.03 260)', transition: 'color 0.2s'
        }}>
          <span>← Back to home</span>
        </Link>
      </header>
      
      <div style={{ flex: 1, position: 'relative' }}>
        <LocalIQComponent />
      </div>
    </div>
  )
}
