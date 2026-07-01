import Link from 'next/link'
import Image from 'next/image'
import { WhatsAppIcon, MessengerIcon, InstagramIcon } from '@/components/icons'
import { whatsappLink, messengerLink, instagramLink } from '@/lib/data'

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-border/70 bg-secondary/40">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="flex flex-col gap-10 md:flex-row md:justify-between">
          <div className="max-w-sm">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-full overflow-hidden bg-primary">
                <Image
                  src="/creations-logo.webp"
                  alt="Creations logo"
                  width={32}
                  height={32}
                  className="object-cover size-full"
                />
              </div>
              <span className="font-heading text-xl font-semibold">
                Creations
              </span>
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Disfraces personalizados hechos a mano con amor para niños y adultos. Cada
              pieza es diseñada y confeccionada a mano para dar vida a tu imaginación.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
            <div>
              <h3 className="text-sm font-semibold">Explorar</h3>
              <ul className="mt-4 flex flex-col gap-2 text-sm text-muted-foreground">
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
              <ul className="mt-4 flex flex-col gap-3 text-sm text-muted-foreground">
                <li>
                  <a
                    href={whatsappLink()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 hover:text-foreground"
                  >
                    <WhatsAppIcon className="size-4 text-primary" />
                    WhatsApp
                  </a>
                </li>
                <li>
                  <a
                    href={messengerLink()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 hover:text-foreground"
                  >
                    <MessengerIcon className="size-4 text-primary" />
                    Messenger
                  </a>
                </li>
                <li>
                  <a
                    href={instagramLink()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 hover:text-foreground"
                  >
                    <InstagramIcon className="size-4 text-primary" />
                    Instagram
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <p className="mt-10 border-t border-border/70 pt-6 text-xs text-muted-foreground">
          © {new Date().getFullYear()} Creations. Hecho a mano con dedicación.
        </p>
      </div>
    </footer>
  )
}
