import { getTranslations } from 'next-intl/server';
import BuscarLocal from '@/components/BuscarLocal';
import Link from 'next/link';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isEs = locale === 'es';
  return {
    title: isEs ? 'Buscar Local — Plaziia' : 'Find Space — Plaziia',
    description: isEs
      ? 'Describe tu proyecto y la IA encuentra el local comercial ideal para ti.'
      : 'Describe your project and AI finds the ideal commercial space for you.',
    alternates: {
      canonical: `https://plaziia.com/${locale}/buscar`,
      languages: {
        es: 'https://plaziia.com/es/buscar',
        en: 'https://plaziia.com/en/buscar',
        'x-default': 'https://plaziia.com/es/buscar',
      },
    },
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
