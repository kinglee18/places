import { getTranslations } from 'next-intl/server';
import BuscarLocal from '@/components/BuscarLocal';
import Link from 'next/link';

export async function generateMetadata() {
  return {
    title: 'Find Space — Plaziia',
    description: 'Describe your project and AI finds the ideal commercial space for you.',
  };
}

export default async function BuscarPage() {
  const t = await getTranslations('BuscarPage');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'oklch(0.985 0.005 240)' }}>
      <header style={{
        padding: '24px 48px',
        display: 'flex',
        alignItems: 'center',
        borderBottom: '1px solid oklch(0.91 0.02 250)',
        background: 'oklch(0.985 0.005 240 / 0.92)',
        backdropFilter: 'blur(16px)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}>
        <Link href="/" style={{
          fontSize: '16px', fontWeight: 600, display: 'flex', alignItems: 'center',
          gap: '8px', color: 'oklch(0.45 0.03 260)', transition: 'color 0.2s',
        }}>
          <span>{t('backHome')}</span>
        </Link>
      </header>

      <div style={{ flex: 1, position: 'relative' }}>
        <BuscarLocal />
      </div>
    </div>
  );
}
