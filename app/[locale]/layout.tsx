import type { Metadata } from 'next';
import '../globals.css';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import Providers from '@/components/Providers';
import FeedbackWidget from '@/components/FeedbackWidget';
import { Analytics } from '@vercel/analytics/next';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
    alternates: {
      canonical: `https://plaziia.com/${locale}`,
      languages: {
        en: 'https://plaziia.com/en',
        es: 'https://plaziia.com/es',
        'x-default': 'https://plaziia.com/en',
      },
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as 'en' | 'es')) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body>
        <Analytics />
        <NextIntlClientProvider messages={messages}>
          <Providers>
            {children}
            <FeedbackWidget />
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
