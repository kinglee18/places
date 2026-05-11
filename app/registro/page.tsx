import LocalIQComponent from '../../components/LocalIQ';
import Link from 'next/link';

export const metadata = {
  title: 'Property Registration - LocalIQ',
  description: 'Enter your property details for AI analysis.',
}

export default function RegistroPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#0a0a14' }}>
      <header style={{
        padding: '24px 48px',
        display: 'flex',
        alignItems: 'center',
        borderBottom: '1px solid #1e1e2d',
        background: 'rgba(10, 10, 15, 0.8)',
        zIndex: 50
      }}>
        <Link href="/" style={{
          fontSize: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', color: '#8888aa', transition: 'color 0.2s'
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
