import './globals.css'
import Providers from '../components/Providers'

export const metadata = {
  title: 'LocalIQ Platform',
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
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
