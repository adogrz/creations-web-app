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
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_BASE_URL || 'https://creations.adogrz.com',
  ),
  title: {
    default: 'Creations — Disfraces personalizados hechos a mano',
    template: '%s | Creations',
  },
  description:
    'Un catálogo visual de disfraces personalizados hechos a mano para niños y adultos. Explora creaciones y contáctanos para dar vida a tu idea.',
  icons: {
    icon: '/creations-logo.webp',
    apple: '/creations-logo.webp',
  },
  openGraph: {
    type: 'website',
    locale: 'es_SV',
    url: 'https://creations.adogrz.com',
    siteName: 'Creations',
    title: 'Creations — Disfraces personalizados hechos a mano',
    description:
      'Un catálogo visual de disfraces personalizados hechos a mano para niños y adultos. Explora creaciones y contáctanos para dar vida a tu idea.',
    images: [
      {
        url: '/creations-logo.webp',
        width: 512,
        height: 512,
        alt: 'Logo de Creations',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Creations — Disfraces personalizados hechos a mano',
    description:
      'Un catálogo visual de disfraces personalizados hechos a mano para niños y adultos. Explora creaciones y contáctanos para dar vida a tu idea.',
    images: ['/creations-logo.webp'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
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
