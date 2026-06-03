import './globals.css'
import Providers from '../components/Providers'
import { Analytics } from '@vercel/analytics/next';
import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  metadataBase: new URL('https://plaziia.com'),
  title: { default: 'Plaziia', template: '%s | Plaziia' },
  description: 'Business intelligence for commercial properties and property registration.',
  openGraph: {
    type: 'website',
    siteName: 'Plaziia',
    locale: 'es_MX',
  },
  twitter: { card: 'summary_large_image' },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body>
        <Analytics />
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
