import './globals.css'

export const metadata = {
  title: 'LocalIQ Platform',
  description: 'Inteligencia de negocio para locales comerciales y registro de propiedades.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
