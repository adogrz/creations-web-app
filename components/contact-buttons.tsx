import { WhatsAppIcon, MessengerIcon, InstagramIcon } from '@/components/icons'
import { whatsappLink, messengerLink, instagramLink } from '@/lib/data'
import { cn } from '@/lib/utils'

type ContactButtonsProps = {
  costumeUrl?: string
  className?: string
}

export function ContactButtons({ costumeUrl, className }: ContactButtonsProps) {
  return (
    <div className={cn('flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center sm:items-center', className)}>
      <a
        href={whatsappLink(costumeUrl)}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-[background-color] hover:bg-primary/90 sm:w-auto"
      >
        <WhatsAppIcon className="size-5" />
        Chatear por WhatsApp
      </a>
      <a
        href={messengerLink(costumeUrl)}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-background px-6 py-3 text-sm font-semibold text-foreground transition-[background-color,color,border-color] hover:bg-muted sm:w-auto"
      >
        <MessengerIcon className="size-5 text-primary" />
        Mensaje por Messenger
      </a>
      <a
        href={instagramLink(costumeUrl)}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-background px-6 py-3 text-sm font-semibold text-foreground transition-[background-color,color,border-color] hover:bg-muted sm:w-auto"
      >
        <InstagramIcon className="size-5 text-primary" />
        DM en Instagram
      </a>
    </div>
  )
}
