import Link from 'next/link'
import Image from 'next/image'
import { WhatsAppIcon, MessengerIcon, InstagramIcon } from '@/components/icons'
import { getSettings } from '@/lib/queries'
import { getWhatsappLink } from '@/lib/contact'

export async function SiteFooter() {
  const settings = await getSettings()
  const whatsappUrl = getWhatsappLink(settings.whatsappNumber)
  const facebookUrl = `https://www.facebook.com/${settings.messengerHandle}`
  const instagramUrl = settings.instagramHandle
    ? `https://www.instagram.com/${settings.instagramHandle}/`
    : null

  return (
    <footer className="border-border/70 bg-secondary/40 mt-20 border-t">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="flex flex-col gap-10 md:flex-row md:justify-between">
          <div className="max-w-sm">
            <Link href="/" className="flex items-center gap-2">
              <div className="bg-primary flex size-8 items-center justify-center overflow-hidden rounded-full">
                <Image
                  src="/creations-logo.webp"
                  alt="Creations logo"
                  width={32}
                  height={32}
                  className="size-full object-cover"
                />
              </div>
              <span className="font-heading text-xl font-semibold">
                Creations
              </span>
            </Link>
            <p className="text-muted-foreground mt-4 text-sm leading-relaxed">
              Disfraces personalizados hechos a mano con amor para niños y
              adultos. Cada pieza es diseñada y confeccionada a mano para dar
              vida a tu imaginación.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
            <div>
              <h3 className="text-sm font-semibold">Explorar</h3>
              <ul className="text-muted-foreground mt-4 flex flex-col gap-2 text-sm">
                <li>
                  <Link href="/costumes" className="hover:text-foreground">
                    Catálogo
                  </Link>
                </li>
                <li>
                  <Link href="/categories" className="hover:text-foreground">
                    Categorías
                  </Link>
                </li>
                <li>
                  <Link href="/admin" className="hover:text-foreground">
                    Estudio
                  </Link>
                </li>
              </ul>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <h3 className="text-sm font-semibold">Contacto</h3>
              <ul className="text-muted-foreground mt-4 flex flex-col gap-3 text-sm">
                <li>
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-foreground flex items-center gap-2"
                  >
                    <WhatsAppIcon className="text-primary size-4" />
                    WhatsApp
                  </a>
                </li>
                <li>
                  <a
                    href={facebookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-foreground flex items-center gap-2"
                  >
                    <MessengerIcon className="text-primary size-4" />
                    Messenger
                  </a>
                </li>
                {instagramUrl && (
                  <li>
                    <a
                      href={instagramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-foreground flex items-center gap-2"
                    >
                      <InstagramIcon className="text-primary size-4" />
                      Instagram
                    </a>
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>

        <p className="border-border/70 text-muted-foreground mt-10 border-t pt-6 text-xs">
          © {new Date().getFullYear()} Creations. Hecho a mano con dedicación.
        </p>
      </div>
    </footer>
  )
}
