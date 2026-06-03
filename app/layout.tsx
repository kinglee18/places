import './globals.css'
import Providers from '../components/Providers'
import { Analytics } from '@vercel/analytics/next';

export const metadata = {
  title: 'Plaziia',
  description: 'Business intelligence for commercial properties and property registration.',
}

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
