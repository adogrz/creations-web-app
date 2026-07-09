import { WhatsAppIcon, MessengerIcon, InstagramIcon } from '@/components/icons'
import {
  getWhatsappLink,
  getMessengerLink,
  getInstagramLink,
} from '@/lib/contact'
import { cn } from '@/lib/utils'

type ContactButtonsProps = {
  settings: {
    whatsappNumber: string
    messengerHandle: string
    instagramHandle: string | null
  }
  costumeUrl?: string
  costumeSlug?: string
  className?: string
}

export function ContactButtons({
  settings,
  costumeUrl,
  costumeSlug,
  className,
}: ContactButtonsProps) {
  const whatsappUrl = getWhatsappLink(settings.whatsappNumber, costumeUrl)
  const messengerUrl = getMessengerLink(settings.messengerHandle, costumeUrl)
  const instagramUrl = getInstagramLink(settings.instagramHandle, costumeUrl)

  return (
    <div
      className={cn(
        'flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center',
        className,
      )}
    >
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        data-umami-event="contact-whatsapp"
        data-umami-event-costume={costumeSlug}
        className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-[background-color] sm:w-auto"
      >
        <WhatsAppIcon className="size-5" />
        Chatear por WhatsApp
      </a>
      <a
        href={messengerUrl}
        target="_blank"
        rel="noopener noreferrer"
        data-umami-event="contact-messenger"
        data-umami-event-costume={costumeSlug}
        className="border-border bg-background text-foreground hover:bg-muted inline-flex items-center justify-center gap-2 rounded-full border px-6 py-3 text-sm font-semibold transition-[background-color,color,border-color] sm:w-auto"
      >
        <MessengerIcon className="text-primary size-5" />
        Mensaje por Messenger
      </a>
      {instagramUrl && (
        <a
          href={instagramUrl}
          target="_blank"
          rel="noopener noreferrer"
          data-umami-event="contact-instagram"
          data-umami-event-costume={costumeSlug}
          className="border-border bg-background text-foreground hover:bg-muted inline-flex items-center justify-center gap-2 rounded-full border px-6 py-3 text-sm font-semibold transition-[background-color,color,border-color] sm:w-auto"
        >
          <InstagramIcon className="text-primary size-5" />
          DM en Instagram
        </a>
      )}
    </div>
  )
}
