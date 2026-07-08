import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Home } from 'lucide-react'
import { getSettings } from '@/lib/queries'
import {
  getWhatsappLink,
  getMessengerLink,
  getInstagramLink,
} from '@/lib/contact'
import { WhatsAppIcon, MessengerIcon, InstagramIcon } from '@/components/icons'

export const metadata: Metadata = {
  title: 'Página no encontrada',
  robots: {
    index: false,
    follow: true,
  },
}

export default async function NotFound() {
  const settings = await getSettings()

  const whatsappUrl = getWhatsappLink(settings.whatsappNumber)
  const messengerUrl = getMessengerLink(settings.messengerHandle)
  const instagramUrl = getInstagramLink(settings.instagramHandle)

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-[#fdf6f0] px-4 text-center dark:bg-zinc-950">
      <div className="mx-auto flex max-w-md flex-col items-center gap-6">
        {/* Número 404 estilizado */}
        <span className="font-heading text-primary text-8xl font-semibold tracking-tight italic select-none">
          404
        </span>

        {/* Textos */}
        <div className="flex flex-col gap-2">
          <h1 className="font-heading text-foreground text-3xl font-semibold tracking-tight text-balance">
            Parece que te has perdido
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed text-pretty">
            El disfraz o página que estás buscando no existe o ha cambiado de
            lugar. No te preocupes, puedes volver a nuestro catálogo o
            contactarnos directamente.
          </p>
        </div>

        {/* Acciones */}
        <div className="flex w-full flex-col justify-center gap-3 pt-2 sm:flex-row">
          <Link
            href="/"
            className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-colors"
          >
            <Home className="size-4" />
            Volver al Inicio
          </Link>
          <Link
            href="/costumes"
            className="border-border bg-background text-foreground hover:bg-muted inline-flex items-center justify-center gap-2 rounded-full border px-6 py-3 text-sm font-semibold transition-colors"
          >
            Ver Catálogo
            <ArrowRight className="size-4" />
          </Link>
        </div>

        {/* Redes sociales */}
        <div className="mt-8 flex flex-col items-center gap-3">
          <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
            ¿Buscas un diseño personalizado?
          </p>
          <div className="flex items-center gap-4">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Escríbenos por WhatsApp"
              className="bg-background text-foreground ring-foreground/5 hover:text-primary flex size-10 items-center justify-center rounded-full shadow-sm ring-1 transition-colors"
            >
              <WhatsAppIcon className="size-5" />
            </a>
            <a
              href={messengerUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Contáctanos por Messenger"
              className="bg-background text-foreground ring-foreground/5 hover:text-primary flex size-10 items-center justify-center rounded-full shadow-sm ring-1 transition-colors"
            >
              <MessengerIcon className="size-5" />
            </a>
            {instagramUrl && (
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="Síguenos en Instagram"
                className="bg-background text-foreground ring-foreground/5 hover:text-primary flex size-10 items-center justify-center rounded-full shadow-sm ring-1 transition-colors"
              >
                <InstagramIcon className="size-5" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
