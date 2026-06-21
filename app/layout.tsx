import type { Metadata, Viewport } from 'next';

// Rich metadata kept here so it applies globally across all locales.
// The actual <html>/<body> structure and providers live in app/[locale]/layout.tsx.
export const metadata: Metadata = {
  metadataBase: new URL('https://plaziia.com'),
  title: { default: 'Plaziia — Locales en Renta', template: '%s | Plaziia' },
  description: 'Encuentra locales comerciales en renta en México. Oficinas, bodegas y tiendas disponibles. Registra tu propiedad gratis en Plaziia.',
  keywords: ['locales en renta', 'locales comerciales', 'renta de locales', 'bodegas en renta', 'oficinas en renta', 'propiedades comerciales México'],
  openGraph: {
    type: 'website',
    siteName: 'Plaziia',
    locale: 'es_MX',
    title: 'Plaziia — Locales en Renta',
    description: 'Encuentra locales comerciales en renta en México. Registra tu propiedad gratis.',
  },
  twitter: { card: 'summary_large_image' },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

// Pass-through: the [locale] nested layout renders the <html> and <body> tags
// with the correct lang attribute and NextIntlClientProvider.
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children as unknown as React.ReactElement;
}
