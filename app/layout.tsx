import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono, Fraunces } from 'next/font/google'
import './globals.css'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})
const fraunces = Fraunces({
  variable: '--font-fraunces',
  subsets: ['latin'],
  style: ['normal', 'italic'],
})

export const metadata: Metadata = {
  title: 'Creations — Disfraces personalizados hechos a mano',
  description:
    'Un catálogo visual de disfraces personalizados hechos a mano para niños y adultos. Explora creaciones y contáctanos para dar vida a tu idea.',
  generator: 'v0.app',
  icons: {
    icon: '/creations-logo.webp',
    apple: '/creations-logo.webp',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#fdf6f0',
}

import { Toaster } from '@/components/ui/sonner'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} bg-background`}
      suppressHydrationWarning
    >
      <body className="font-sans antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  )
}
